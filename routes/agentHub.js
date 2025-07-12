
const express = require('express');
const joi = require('joi');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

const agentProfileSchema = joi.object({
  agentType: joi.string().valid('loan_broker', 'procurement_agent', 'compliance_consultant', 'business_advisor').required(),
  specialization: joi.string().min(10).required(),
  experienceYears: joi.number().integer().min(0).max(50).required(),
  commissionRate: joi.number().min(0.5).max(15).required()
});

// Create agent profile
router.post('/profile', authorizeRoles('agent'), async (req, res) => {
  try {
    const { error, value } = agentProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if agent profile already exists
    const existingProfile = await pool.query(
      'SELECT id FROM agent_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(400).json({ error: 'Agent profile already exists' });
    }

    const { agentType, specialization, experienceYears, commissionRate } = value;

    const result = await pool.query(
      `INSERT INTO agent_profiles (
        user_id, agent_type, specialization, experience_years, commission_rate
      ) VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, agent_type, specialization, verification_status`,
      [req.user.id, agentType, specialization, experienceYears, commissionRate]
    );

    res.status(201).json({
      message: 'Agent profile created successfully',
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('Agent profile creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available agents
router.get('/agents', async (req, res) => {
  try {
    const { agentType, specialization, minRating } = req.query;
    
    let query = `
      SELECT ap.*, u.first_name, u.last_name, u.email
      FROM agent_profiles ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.verification_status = 'verified'
    `;
    const params = [];
    let paramCount = 0;

    if (agentType) {
      paramCount++;
      query += ` AND ap.agent_type = $${paramCount}`;
      params.push(agentType);
    }

    if (specialization) {
      paramCount++;
      query += ` AND ap.specialization ILIKE $${paramCount}`;
      params.push(`%${specialization}%`);
    }

    if (minRating) {
      paramCount++;
      query += ` AND ap.rating >= $${paramCount}`;
      params.push(parseFloat(minRating));
    }

    query += ' ORDER BY ap.rating DESC, ap.total_deals DESC';

    const result = await pool.query(query, params);
    res.json({ agents: result.rows });

  } catch (error) {
    console.error('Agents fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create negotiation request
router.post('/negotiations', authorizeRoles('msme_owner'), async (req, res) => {
  try {
    const { agentId, serviceType, description, budget, timeline } = req.body;

    // Validate inputs
    if (!agentId || !serviceType || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get MSME profile
    const msmeProfile = await pool.query(
      'SELECT id FROM msme_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (msmeProfile.rows.length === 0) {
      return res.status(400).json({ error: 'MSME profile required' });
    }

    // Verify agent exists
    const agent = await pool.query(
      'SELECT id FROM agent_profiles WHERE id = $1 AND verification_status = $2',
      [agentId, 'verified']
    );

    if (agent.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid agent or agent not verified' });
    }

    // Create negotiation (using a simple table structure)
    const result = await pool.query(`
      INSERT INTO negotiations (
        msme_id, agent_id, service_type, description, budget, timeline, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, service_type, status, created_at
    `, [msmeProfile.rows[0].id, agentId, serviceType, description, budget, timeline, 'pending']);

    res.status(201).json({
      message: 'Negotiation request created successfully',
      negotiation: result.rows[0]
    });

  } catch (error) {
    if (error.code === '42P01') { // Table doesn't exist
      // Create negotiations table on the fly
      await pool.query(`
        CREATE TABLE IF NOT EXISTS negotiations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          msme_id UUID REFERENCES msme_profiles(id) ON DELETE CASCADE,
          agent_id UUID REFERENCES agent_profiles(id) ON DELETE CASCADE,
          service_type VARCHAR(100) NOT NULL,
          description TEXT,
          budget DECIMAL(15,2),
          timeline VARCHAR(100),
          status VARCHAR(50) DEFAULT 'pending',
          agent_response TEXT,
          final_rate DECIMAL(5,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Retry the request
      return router.handle(req, res);
    }
    
    console.error('Negotiation creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get negotiations for current user
router.get('/negotiations', async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'agent') {
      // Get agent's negotiations
      const agentProfile = await pool.query(
        'SELECT id FROM agent_profiles WHERE user_id = $1',
        [req.user.id]
      );

      if (agentProfile.rows.length === 0) {
        return res.json({ negotiations: [] });
      }

      query = `
        SELECT n.*, mp.business_name, u.first_name, u.last_name
        FROM negotiations n
        JOIN msme_profiles mp ON n.msme_id = mp.id
        JOIN users u ON mp.user_id = u.id
        WHERE n.agent_id = $1
        ORDER BY n.created_at DESC
      `;
      params = [agentProfile.rows[0].id];
    } else {
      // Get MSME's negotiations
      const msmeProfile = await pool.query(
        'SELECT id FROM msme_profiles WHERE user_id = $1',
        [req.user.id]
      );

      if (msmeProfile.rows.length === 0) {
        return res.json({ negotiations: [] });
      }

      query = `
        SELECT n.*, ap.agent_type, ap.specialization, u.first_name, u.last_name
        FROM negotiations n
        JOIN agent_profiles ap ON n.agent_id = ap.id
        JOIN users u ON ap.user_id = u.id
        WHERE n.msme_id = $1
        ORDER BY n.created_at DESC
      `;
      params = [msmeProfile.rows[0].id];
    }

    const result = await pool.query(query, params);
    res.json({ negotiations: result.rows });

  } catch (error) {
    console.error('Negotiations fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
