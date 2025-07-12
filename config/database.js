
const { Pool } = require('pg');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vyapaarmitra',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const connectDB = async () => {
  try {
    await pool.connect();
    logger.info('PostgreSQL connected successfully');
    
    // Create tables if they don't exist
    await createTables();
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(15),
        role VARCHAR(50) DEFAULT 'msme_owner',
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // MSME profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS msme_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        business_type VARCHAR(100),
        registration_number VARCHAR(100),
        pan_number VARCHAR(10),
        gst_number VARCHAR(15),
        udyam_number VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        industry_sector VARCHAR(100),
        annual_turnover DECIMAL(15,2),
        employee_count INTEGER,
        establishment_year INTEGER,
        onboarding_status VARCHAR(50) DEFAULT 'pending',
        subscription_plan VARCHAR(50) DEFAULT 'basic',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Loan applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS loan_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        msme_id UUID REFERENCES msme_profiles(id) ON DELETE CASCADE,
        loan_type VARCHAR(100) NOT NULL,
        requested_amount DECIMAL(15,2) NOT NULL,
        purpose TEXT,
        documents JSONB,
        status VARCHAR(50) DEFAULT 'submitted',
        lender_type VARCHAR(50),
        interest_rate DECIMAL(5,2),
        tenure_months INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Procurement requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS procurement_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        msme_id UUID REFERENCES msme_profiles(id) ON DELETE CASCADE,
        product_category VARCHAR(100) NOT NULL,
        product_description TEXT,
        quantity INTEGER,
        budget_range VARCHAR(100),
        delivery_location TEXT,
        required_by DATE,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Agent profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        agent_type VARCHAR(100) NOT NULL,
        specialization VARCHAR(200),
        experience_years INTEGER,
        commission_rate DECIMAL(5,2),
        rating DECIMAL(3,2) DEFAULT 0.0,
        total_deals INTEGER DEFAULT 0,
        verification_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Navarambh cases table
    await client.query(`
      CREATE TABLE IF NOT EXISTS navarambh_cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        msme_id UUID REFERENCES msme_profiles(id) ON DELETE CASCADE,
        case_type VARCHAR(100) NOT NULL,
        distress_level VARCHAR(50),
        financial_health JSONB,
        assets_details JSONB,
        debt_details JSONB,
        exit_strategy VARCHAR(200),
        status VARCHAR(50) DEFAULT 'assessment',
        assigned_consultant UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Compliance tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        msme_id UUID REFERENCES msme_profiles(id) ON DELETE CASCADE,
        compliance_type VARCHAR(100) NOT NULL,
        requirement TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE,
        completion_date DATE,
        documents JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Valuations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS valuations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        msme_id UUID REFERENCES msme_profiles(id) ON DELETE CASCADE,
        base_valuation DECIMAL(20,2) NOT NULL,
        adjusted_valuation DECIMAL(20,2) NOT NULL,
        scores JSONB NOT NULL,
        weighted_score DECIMAL(5,2) NOT NULL,
        multiplier DECIMAL(5,2) NOT NULL,
        calculated_at TIMESTAMP NOT NULL,
        valid_until TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(msme_id)
      )
    `);

    // Escrow accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS escrow_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_number VARCHAR(20) UNIQUE NOT NULL,
        buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        deposited_amount DECIMAL(15,2) DEFAULT 0,
        escrow_fee DECIMAL(10,2) DEFAULT 0,
        transaction_type VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'created' 
          CHECK (status IN ('created', 'funded', 'released', 'refunded', 'in_dispute', 'expired')),
        dispute_raised_by UUID REFERENCES users(id),
        dispute_reason TEXT,
        released_by UUID REFERENCES users(id),
        refunded_by UUID REFERENCES users(id),
        released_at TIMESTAMP,
        refunded_at TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Escrow transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS escrow_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        escrow_id UUID REFERENCES escrow_accounts(id) ON DELETE CASCADE,
        transaction_type VARCHAR(50) NOT NULL 
          CHECK (transaction_type IN ('creation', 'deposit', 'release', 'refund', 'dispute', 'fee')),
        amount DECIMAL(15,2) DEFAULT 0,
        fee DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending' 
          CHECK (status IN ('pending', 'completed', 'failed')),
        created_by UUID REFERENCES users(id),
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_valuations_msme_id ON valuations(msme_id);
      CREATE INDEX IF NOT EXISTS idx_valuations_valid_until ON valuations(valid_until);
      CREATE INDEX IF NOT EXISTS idx_escrow_accounts_status ON escrow_accounts(status);
      CREATE INDEX IF NOT EXISTS idx_escrow_accounts_expires_at ON escrow_accounts(expires_at);
      CREATE INDEX IF NOT EXISTS idx_escrow_transactions_escrow_id ON escrow_transactions(escrow_id);
    `);

    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, connectDB };
