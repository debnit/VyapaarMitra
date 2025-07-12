
const express = require('express');
const joi = require('joi');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

const navarambhCaseSchema = joi.object({
  caseType: joi.string().valid('financial_restructuring', 'asset_liquidation', 'business_transfer', 'closure_assistance').required(),
  distressLevel: joi.string().valid('low', 'medium', 'high', 'critical').required(),
  financialHealth: joi.object({
    totalAssets: joi.number().required(),
    totalLiabilities: joi.number().required(),
    monthlyRevenue: joi.number().required(),
    monthlyExpenses: joi.number().required()
  }).required(),
  assetsDetails: joi.object().optional(),
  debtDetails: joi.object().optional()
});

// Create Navarambh case
router.post('/case', authorizeRoles('msme_owner'), async (req, res) => {
  try {
    const { error, value } = navarambhCaseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get MSME profile
    const msmeProfile = await pool.query(
      'SELECT id FROM msme_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (msmeProfile.rows.length === 0) {
      return res.status(400).json({ error: 'MSME profile required' });
    }

    const { caseType, distressLevel, financialHealth, assetsDetails, debtDetails } = value;

    // Determine initial exit strategy based on financial health
    const netWorth = financialHealth.totalAssets - financialHealth.totalLiabilities;
    const monthlyCashflow = financialHealth.monthlyRevenue - financialHealth.monthlyExpenses;
    
    let exitStrategy = 'assessment_required';
    if (netWorth > 0 && monthlyCashflow > 0) {
      exitStrategy = 'restructuring_viable';
    } else if (netWorth > 0) {
      exitStrategy = 'asset_optimization';
    } else {
      exitStrategy = 'liquidation_assessment';
    }

    const result = await pool.query(
      `INSERT INTO navarambh_cases (
        msme_id, case_type, distress_level, financial_health, 
        assets_details, debt_details, exit_strategy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id, case_type, distress_level, exit_strategy, status`,
      [
        msmeProfile.rows[0].id, caseType, distressLevel, 
        JSON.stringify(financialHealth), 
        JSON.stringify(assetsDetails || {}),
        JSON.stringify(debtDetails || {}),
        exitStrategy
      ]
    );

    res.status(201).json({
      message: 'Navarambh case created successfully',
      case: result.rows[0]
    });

  } catch (error) {
    console.error('Navarambh case creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get case details
router.get('/cases', authorizeRoles('msme_owner', 'consultant'), async (req, res) => {
  try {
    let query, params;
    
    if (req.user.role === 'consultant') {
      query = `
        SELECT nc.*, mp.business_name, u.first_name, u.last_name, u.email
        FROM navarambh_cases nc
        JOIN msme_profiles mp ON nc.msme_id = mp.id
        JOIN users u ON mp.user_id = u.id
        WHERE nc.assigned_consultant = $1 OR nc.assigned_consultant IS NULL
        ORDER BY nc.created_at DESC
      `;
      params = [req.user.id];
    } else {
      // MSME owner
      const msmeProfile = await pool.query(
        'SELECT id FROM msme_profiles WHERE user_id = $1',
        [req.user.id]
      );

      if (msmeProfile.rows.length === 0) {
        return res.json({ cases: [] });
      }

      query = `
        SELECT nc.*, u.first_name as consultant_first_name, u.last_name as consultant_last_name
        FROM navarambh_cases nc
        LEFT JOIN users u ON nc.assigned_consultant = u.id
        WHERE nc.msme_id = $1
        ORDER BY nc.created_at DESC
      `;
      params = [msmeProfile.rows[0].id];
    }

    const result = await pool.query(query, params);
    res.json({ cases: result.rows });

  } catch (error) {
    console.error('Cases fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign consultant to case
router.patch('/case/:caseId/assign', authorizeRoles('consultant'), async (req, res) => {
  try {
    const { caseId } = req.params;

    const result = await pool.query(
      `UPDATE navarambh_cases 
       SET assigned_consultant = $1, status = 'in_progress', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND assigned_consultant IS NULL
       RETURNING id, case_type, status`,
      [req.user.id, caseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found or already assigned' });
    }

    res.json({
      message: 'Case assigned successfully',
      case: result.rows[0]
    });

  } catch (error) {
    console.error('Case assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get exit strategies
router.get('/exit-strategies', async (req, res) => {
  try {
    const strategies = [
      {
        id: 'restructuring_viable',
        name: 'Financial Restructuring',
        description: 'Reorganize debts and operations to restore viability',
        timeframe: '6-12 months',
        costRange: '50000-200000',
        successRate: 70
      },
      {
        id: 'asset_optimization',
        name: 'Asset Optimization',
        description: 'Optimize asset utilization and reduce operational costs',
        timeframe: '3-6 months',
        costRange: '25000-100000',
        successRate: 60
      },
      {
        id: 'liquidation_assessment',
        name: 'Controlled Liquidation',
        description: 'Systematic asset liquidation to maximize recovery',
        timeframe: '6-18 months',
        costRange: '75000-300000',
        successRate: 85
      },
      {
        id: 'business_transfer',
        name: 'Business Transfer',
        description: 'Transfer business to new ownership',
        timeframe: '3-9 months',
        costRange: '100000-500000',
        successRate: 55
      }
    ];

    res.json({ strategies });
  } catch (error) {
    console.error('Strategies fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
