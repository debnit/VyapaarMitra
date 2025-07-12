
const { pool } = require('../config/database');
const winston = require('winston');
const crypto = require('crypto');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

class EscrowService {
  constructor() {
    this.escrowFeePercentage = 2.5; // 2.5% escrow fee
    this.minimumEscrowAmount = 10000; // Minimum 10,000 INR
  }

  async createEscrowAccount(transactionData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const escrowId = crypto.randomUUID();
      const escrowAccountNumber = this.generateEscrowAccountNumber();
      
      const escrowAccount = await client.query(`
        INSERT INTO escrow_accounts (
          id, account_number, buyer_id, seller_id, amount, 
          transaction_type, status, created_at, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'created', CURRENT_TIMESTAMP, $7)
        RETURNING *
      `, [
        escrowId,
        escrowAccountNumber,
        transactionData.buyerId,
        transactionData.sellerId,
        transactionData.amount,
        transactionData.transactionType,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
      ]);

      // Create transaction log
      await client.query(`
        INSERT INTO escrow_transactions (
          escrow_id, transaction_type, amount, status, created_by, description
        ) VALUES ($1, 'creation', $2, 'completed', $3, $4)
      `, [
        escrowId,
        transactionData.amount,
        transactionData.buyerId,
        `Escrow account created for ${transactionData.transactionType}`
      ]);

      await client.query('COMMIT');
      
      logger.info(`Escrow account created: ${escrowId}`);
      return escrowAccount.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Escrow creation error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async depositFunds(escrowId, amount, depositorId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify escrow account
      const escrowResult = await client.query(`
        SELECT * FROM escrow_accounts 
        WHERE id = $1 AND status = 'created' AND expires_at > CURRENT_TIMESTAMP
      `, [escrowId]);

      if (escrowResult.rows.length === 0) {
        throw new Error('Invalid or expired escrow account');
      }

      const escrow = escrowResult.rows[0];

      // Verify depositor is buyer
      if (escrow.buyer_id !== depositorId) {
        throw new Error('Only buyer can deposit funds');
      }

      // Calculate fees
      const escrowFee = (amount * this.escrowFeePercentage) / 100;
      const totalAmount = amount + escrowFee;

      // Update escrow account
      await client.query(`
        UPDATE escrow_accounts 
        SET deposited_amount = $1, escrow_fee = $2, status = 'funded'
        WHERE id = $3
      `, [amount, escrowFee, escrowId]);

      // Log transaction
      await client.query(`
        INSERT INTO escrow_transactions (
          escrow_id, transaction_type, amount, fee, status, created_by, description
        ) VALUES ($1, 'deposit', $2, $3, 'completed', $4, $5)
      `, [
        escrowId,
        amount,
        escrowFee,
        depositorId,
        `Funds deposited: ₹${amount} + fee: ₹${escrowFee}`
      ]);

      await client.query('COMMIT');
      
      logger.info(`Funds deposited to escrow ${escrowId}: ₹${totalAmount}`);
      return { success: true, totalAmount, escrowFee };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Deposit error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async releaseFunds(escrowId, releasedBy, milestone = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const escrowResult = await client.query(`
        SELECT * FROM escrow_accounts 
        WHERE id = $1 AND status = 'funded'
      `, [escrowId]);

      if (escrowResult.rows.length === 0) {
        throw new Error('Escrow account not found or not funded');
      }

      const escrow = escrowResult.rows[0];

      // Verify releaser authority
      if (escrow.buyer_id !== releasedBy && escrow.seller_id !== releasedBy) {
        throw new Error('Unauthorized to release funds');
      }

      // Update escrow status
      await client.query(`
        UPDATE escrow_accounts 
        SET status = 'released', released_at = CURRENT_TIMESTAMP, released_by = $1
        WHERE id = $2
      `, [releasedBy, escrowId]);

      // Log release transaction
      await client.query(`
        INSERT INTO escrow_transactions (
          escrow_id, transaction_type, amount, status, created_by, description
        ) VALUES ($1, 'release', $2, 'completed', $3, $4)
      `, [
        escrowId,
        escrow.deposited_amount,
        releasedBy,
        `Funds released to seller. ${milestone ? `Milestone: ${milestone}` : ''}`
      ]);

      await client.query('COMMIT');
      
      logger.info(`Funds released from escrow ${escrowId}`);
      return { success: true, amount: escrow.deposited_amount };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Release error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async requestDispute(escrowId, requesterId, reason) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const escrowResult = await client.query(`
        SELECT * FROM escrow_accounts 
        WHERE id = $1 AND status IN ('funded', 'in_dispute')
      `, [escrowId]);

      if (escrowResult.rows.length === 0) {
        throw new Error('Escrow account not found or cannot be disputed');
      }

      const escrow = escrowResult.rows[0];

      // Update escrow status
      await client.query(`
        UPDATE escrow_accounts 
        SET status = 'in_dispute', dispute_raised_by = $1, dispute_reason = $2
        WHERE id = $3
      `, [requesterId, reason, escrowId]);

      // Log dispute
      await client.query(`
        INSERT INTO escrow_transactions (
          escrow_id, transaction_type, status, created_by, description
        ) VALUES ($1, 'dispute', 'pending', $2, $3)
      `, [
        escrowId,
        requesterId,
        `Dispute raised: ${reason}`
      ]);

      await client.query('COMMIT');
      
      logger.info(`Dispute raised for escrow ${escrowId}`);
      return { success: true };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Dispute error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async refundFunds(escrowId, refundedBy, reason) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const escrowResult = await client.query(`
        SELECT * FROM escrow_accounts 
        WHERE id = $1 AND status IN ('funded', 'in_dispute')
      `, [escrowId]);

      if (escrowResult.rows.length === 0) {
        throw new Error('Escrow account not found or cannot be refunded');
      }

      const escrow = escrowResult.rows[0];

      // Update escrow status
      await client.query(`
        UPDATE escrow_accounts 
        SET status = 'refunded', refunded_at = CURRENT_TIMESTAMP, refunded_by = $1
        WHERE id = $2
      `, [refundedBy, escrowId]);

      // Log refund
      await client.query(`
        INSERT INTO escrow_transactions (
          escrow_id, transaction_type, amount, status, created_by, description
        ) VALUES ($1, 'refund', $2, 'completed', $3, $4)
      `, [
        escrowId,
        escrow.deposited_amount - escrow.escrow_fee, // Refund minus fees
        refundedBy,
        `Funds refunded to buyer: ${reason}`
      ]);

      await client.query('COMMIT');
      
      logger.info(`Funds refunded from escrow ${escrowId}`);
      return { success: true, amount: escrow.deposited_amount - escrow.escrow_fee };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Refund error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  generateEscrowAccountNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ESC${timestamp.slice(-8)}${random}`;
  }

  async getEscrowStatus(escrowId) {
    const result = await pool.query(`
      SELECT ea.*, 
             u1.first_name || ' ' || u1.last_name as buyer_name,
             u2.first_name || ' ' || u2.last_name as seller_name
      FROM escrow_accounts ea
      JOIN users u1 ON ea.buyer_id = u1.id
      JOIN users u2 ON ea.seller_id = u2.id
      WHERE ea.id = $1
    `, [escrowId]);

    if (result.rows.length === 0) {
      throw new Error('Escrow account not found');
    }

    // Get transaction history
    const transactions = await pool.query(`
      SELECT * FROM escrow_transactions 
      WHERE escrow_id = $1 
      ORDER BY created_at DESC
    `, [escrowId]);

    return {
      ...result.rows[0],
      transactions: transactions.rows
    };
  }
}

module.exports = EscrowService;
