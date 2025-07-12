
const express = require('express');
const joi = require('joi');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Compliance requirements schema
const complianceRequestSchema = joi.object({
  complianceType: joi.string().valid('gst', 'udyam', 'environmental', 'labor', 'fire_safety', 'pollution_control').required(),
  priority: joi.string().valid('low', 'medium', 'high', 'critical').required(),
  description: joi.string().min(10).max(500).required(),
  dueDate: joi.date().greater('now').required()
});

// Get compliance dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const msmeProfile = await pool.query(
      'SELECT id FROM msme_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (msmeProfile.rows.length === 0) {
      return res.status(404).json({ error: 'MSME profile not found' });
    }

    const msmeId = msmeProfile.rows[0].id;

    // Get compliance summary
    const complianceSummary = await pool.query(`
      SELECT 
        compliance_type,
        status,
        COUNT(*) as count,
        MIN(due_date) as next_due_date
      FROM compliance_tracking 
      WHERE msme_id = $1 
      GROUP BY compliance_type, status
      ORDER BY compliance_type
    `, [msmeId]);

    // Get upcoming deadlines
    const upcomingDeadlines = await pool.query(`
      SELECT * FROM compliance_tracking 
      WHERE msme_id = $1 AND status IN ('pending', 'in_progress') 
      AND due_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY due_date ASC
      LIMIT 10
    `, [msmeId]);

    // Get recent compliance activities
    const recentActivities = await pool.query(`
      SELECT * FROM compliance_tracking 
      WHERE msme_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 20
    `, [msmeId]);

    res.json({
      summary: complianceSummary.rows,
      upcomingDeadlines: upcomingDeadlines.rows,
      recentActivities: recentActivities.rows
    });

  } catch (error) {
    console.error('Compliance dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new compliance requirement
router.post('/requirements', async (req, res) => {
  try {
    const { error, value } = complianceRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const msmeProfile = await pool.query(
      'SELECT id FROM msme_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (msmeProfile.rows.length === 0) {
      return res.status(404).json({ error: 'MSME profile not found' });
    }

    const { complianceType, priority, description, dueDate } = value;

    const result = await pool.query(`
      INSERT INTO compliance_tracking (
        msme_id, compliance_type, priority, description, due_date, status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [msmeProfile.rows[0].id, complianceType, priority, description, dueDate]);

    res.status(201).json({
      message: 'Compliance requirement created successfully',
      requirement: result.rows[0]
    });

  } catch (error) {
    console.error('Compliance creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update compliance status
router.patch('/requirements/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'in_progress', 'completed', 'overdue'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(`
      UPDATE compliance_tracking 
      SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND msme_id IN (
        SELECT id FROM msme_profiles WHERE user_id = $4
      )
      RETURNING *
    `, [status, notes, id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance requirement not found' });
    }

    res.json({
      message: 'Compliance status updated successfully',
      requirement: result.rows[0]
    });

  } catch (error) {
    console.error('Compliance update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get compliance types and requirements
router.get('/types', async (req, res) => {
  try {
    const complianceTypes = [
      {
        type: 'gst',
        name: 'GST Registration & Returns',
        description: 'Goods and Services Tax compliance',
        frequency: 'monthly',
        penalty: 'Rs. 200 per day delay + interest'
      },
      {
        type: 'udyam',
        name: 'Udyam Registration',
        description: 'MSME registration under Udyam portal',
        frequency: 'one-time',
        penalty: 'Loss of MSME benefits'
      },
      {
        type: 'environmental',
        name: 'Environmental Clearance',
        description: 'Environmental compliance certificates',
        frequency: 'annual',
        penalty: 'Rs. 1 lakh fine + closure'
      },
      {
        type: 'labor',
        name: 'Labor Law Compliance',
        description: 'PF, ESI, labor license compliance',
        frequency: 'monthly',
        penalty: 'Rs. 5000 to Rs. 1 lakh'
      },
      {
        type: 'fire_safety',
        name: 'Fire Safety Certificate',
        description: 'Fire safety NOC for business premises',
        frequency: 'annual',
        penalty: 'Business closure + fine'
      },
      {
        type: 'pollution_control',
        name: 'Pollution Control Certificate',
        description: 'Consent to operate from pollution board',
        frequency: 'annual',
        penalty: 'Rs. 25,000 to Rs. 1 crore'
      }
    ];

    res.json({ complianceTypes });
  } catch (error) {
    console.error('Compliance types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
