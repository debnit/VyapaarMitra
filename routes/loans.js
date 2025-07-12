
const express = require('express');
const joi = require('joi');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

const loanApplicationSchema = joi.object({
  loanType: joi.string().valid('working_capital', 'term_loan', 'equipment_finance', 'emergency_loan').required(),
  requestedAmount: joi.number().positive().max(10000000).required(),
  purpose: joi.string().min(10).required(),
  documents: joi.object().optional()
});

// Submit loan application
router.post('/apply', authorizeRoles('msme_owner'), async (req, res) => {
  try {
    const { error, value } = loanApplicationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get MSME profile
    const msmeProfile = await pool.query(
      'SELECT id FROM msme_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (msmeProfile.rows.length === 0) {
      return res.status(400).json({ error: 'MSME profile required for loan application' });
    }

    const { loanType, requestedAmount, purpose, documents } = value;

    const result = await pool.query(
      `INSERT INTO loan_applications (msme_id, loan_type, requested_amount, purpose, documents)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, loan_type, requested_amount, status`,
      [msmeProfile.rows[0].id, loanType, requestedAmount, purpose, JSON.stringify(documents || {})]
    );

    res.status(201).json({
      message: 'Loan application submitted successfully',
      application: result.rows[0]
    });

  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get loan applications
router.get('/applications', authorizeRoles('msme_owner'), async (req, res) => {
  try {
    const msmeProfile = await pool.query(
      'SELECT id FROM msme_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (msmeProfile.rows.length === 0) {
      return res.status(400).json({ error: 'MSME profile not found' });
    }

    const result = await pool.query(
      `SELECT id, loan_type, requested_amount, purpose, status, 
              lender_type, interest_rate, tenure_months, created_at
       FROM loan_applications WHERE msme_id = $1 ORDER BY created_at DESC`,
      [msmeProfile.rows[0].id]
    );

    res.json({ applications: result.rows });

  } catch (error) {
    console.error('Loan fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available lenders
router.get('/lenders', async (req, res) => {
  try {
    const lenders = [
      {
        id: 'hdfc_bank',
        name: 'HDFC Bank',
        type: 'bank',
        minAmount: 100000,
        maxAmount: 5000000,
        interestRate: { min: 10.5, max: 14.5 },
        processingTime: '7-14 days',
        eligibility: ['GST registration', 'Minimum 2 years in business']
      },
      {
        id: 'bajaj_finserv',
        name: 'Bajaj Finserv',
        type: 'nbfc',
        minAmount: 50000,
        maxAmount: 2500000,
        interestRate: { min: 13.0, max: 18.0 },
        processingTime: '3-7 days',
        eligibility: ['Udyam registration', 'Minimum 1 year in business']
      },
      {
        id: 'tata_capital',
        name: 'Tata Capital',
        type: 'nbfc',
        minAmount: 75000,
        maxAmount: 3000000,
        interestRate: { min: 12.5, max: 16.5 },
        processingTime: '5-10 days',
        eligibility: ['Valid business registration', 'Good credit score']
      }
    ];

    res.json({ lenders });
  } catch (error) {
    console.error('Lenders fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
const express = require('express');
const joi = require('joi');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Loan application schema
const loanApplicationSchema = joi.object({
  loanType: joi.string().valid('working_capital', 'term_loan', 'equipment_loan').required(),
  amount: joi.number().positive().max(50000000).required(),
  purpose: joi.string().min(10).max(500).required(),
  tenure: joi.number().integer().min(6).max(120).required()
});

// Apply for loan
router.post('/apply', authorizeRoles('msme_owner'), async (req, res) => {
  try {
    const { error, value } = loanApplicationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const msmeProfile = await pool.query(
      'SELECT id FROM msme_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (msmeProfile.rows.length === 0) {
      return res.status(400).json({ error: 'Complete your MSME profile first' });
    }

    const { loanType, amount, purpose, tenure } = value;

    const result = await pool.query(`
      INSERT INTO loan_applications (msme_id, loan_type, amount, purpose, tenure, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [msmeProfile.rows[0].id, loanType, amount, purpose, tenure]);

    res.status(201).json({
      message: 'Loan application submitted successfully',
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get loan applications
router.get('/applications', authorizeRoles('msme_owner'), async (req, res) => {
  try {
    const msmeProfile = await pool.query(
      'SELECT id FROM msme_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (msmeProfile.rows.length === 0) {
      return res.json({ applications: [] });
    }

    const applications = await pool.query(`
      SELECT * FROM loan_applications 
      WHERE msme_id = $1 
      ORDER BY created_at DESC
    `, [msmeProfile.rows[0].id]);

    res.json({ applications: applications.rows });
  } catch (error) {
    console.error('Applications fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
