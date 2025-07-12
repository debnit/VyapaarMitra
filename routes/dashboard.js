
const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { cacheGet, cacheSet } = require('../config/redis');
const router = express.Router();

router.use(authenticateToken);

// MSME Dashboard
router.get('/msme', authorizeRoles('msme_owner'), async (req, res) => {
  try {
    const cacheKey = `dashboard_msme_${req.user.id}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Get MSME profile
    const msmeProfile = await pool.query(
      'SELECT id, business_name, onboarding_status, subscription_plan FROM msme_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (msmeProfile.rows.length === 0) {
      return res.status(404).json({ error: 'MSME profile not found' });
    }

    const msmeId = msmeProfile.rows[0].id;
    const businessName = msmeProfile.rows[0].business_name;

    // Get dashboard metrics
    const [loanStats, procurementStats, complianceStats, navarambhStats] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total_applications,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COALESCE(SUM(CASE WHEN status = 'approved' THEN requested_amount END), 0) as total_approved_amount
        FROM loan_applications WHERE msme_id = $1
      `, [msmeId]),
      
      pool.query(`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status = 'fulfilled' THEN 1 END) as fulfilled,
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open
        FROM procurement_requests WHERE msme_id = $1
      `, [msmeId]),
      
      pool.query(`
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 1 END) as overdue
        FROM compliance_tracking WHERE msme_id = $1
      `, [msmeId]),
      
      pool.query(`
        SELECT 
          COUNT(*) as total_cases,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress
        FROM navarambh_cases WHERE msme_id = $1
      `, [msmeId])
    ]);

    const dashboard = {
      businessName,
      onboardingStatus: msmeProfile.rows[0].onboarding_status,
      subscriptionPlan: msmeProfile.rows[0].subscription_plan,
      loans: loanStats.rows[0],
      procurement: procurementStats.rows[0],
      compliance: complianceStats.rows[0],
      navarambh: navarambhStats.rows[0],
      lastUpdated: new Date().toISOString()
    };

    // Cache for 5 minutes
    await cacheSet(cacheKey, dashboard, 300);
    res.json(dashboard);

  } catch (error) {
    console.error('MSME dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Agent Dashboard
router.get('/agent', authorizeRoles('agent'), async (req, res) => {
  try {
    const cacheKey = `dashboard_agent_${req.user.id}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Get agent profile
    const agentProfile = await pool.query(
      'SELECT id, agent_type, rating, total_deals FROM agent_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (agentProfile.rows.length === 0) {
      return res.status(404).json({ error: 'Agent profile not found' });
    }

    const agentId = agentProfile.rows[0].id;

    // Get negotiations stats (assuming table exists)
    const negotiationStats = await pool.query(`
      SELECT 
        COUNT(*) as total_negotiations,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM negotiations WHERE agent_id = $1
    `, [agentId]).catch(() => ({ rows: [{ total_negotiations: 0, accepted: 0, pending: 0, rejected: 0 }] }));

    const dashboard = {
      agentType: agentProfile.rows[0].agent_type,
      rating: agentProfile.rows[0].rating,
      totalDeals: agentProfile.rows[0].total_deals,
      negotiations: negotiationStats.rows[0],
      lastUpdated: new Date().toISOString()
    };

    // Cache for 5 minutes
    await cacheSet(cacheKey, dashboard, 300);
    res.json(dashboard);

  } catch (error) {
    console.error('Agent dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Platform Analytics (Admin view)
router.get('/analytics', authorizeRoles('admin'), async (req, res) => {
  try {
    const cacheKey = 'dashboard_analytics';
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const [userStats, msmeStats, loanStats, revenueStats] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'msme_owner' THEN 1 END) as msme_owners,
          COUNT(CASE WHEN role = 'agent' THEN 1 END) as agents,
          COUNT(CASE WHEN role = 'consultant' THEN 1 END) as consultants
        FROM users
      `),
      
      pool.query(`
        SELECT 
          COUNT(*) as total_msmes,
          COUNT(CASE WHEN onboarding_status = 'onboarded' THEN 1 END) as onboarded,
          COUNT(CASE WHEN subscription_plan = 'premium' THEN 1 END) as premium_subscribers
        FROM msme_profiles
      `),
      
      pool.query(`
        SELECT 
          COUNT(*) as total_applications,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_loans,
          COALESCE(SUM(requested_amount), 0) as total_loan_amount
        FROM loan_applications
      `),
      
      pool.query(`
        SELECT 
          COUNT(CASE WHEN subscription_plan = 'basic' THEN 1 END) * 199 as basic_revenue,
          COUNT(CASE WHEN subscription_plan = 'premium' THEN 1 END) * 499 as premium_revenue
        FROM msme_profiles WHERE onboarding_status = 'onboarded'
      `)
    ]);

    const analytics = {
      users: userStats.rows[0],
      msmes: msmeStats.rows[0],
      loans: loanStats.rows[0],
      revenue: {
        basic: parseInt(revenueStats.rows[0].basic_revenue || 0),
        premium: parseInt(revenueStats.rows[0].premium_revenue || 0),
        total: parseInt(revenueStats.rows[0].basic_revenue || 0) + parseInt(revenueStats.rows[0].premium_revenue || 0)
      },
      lastUpdated: new Date().toISOString()
    };

    // Cache for 10 minutes
    await cacheSet(cacheKey, analytics, 600);
    res.json(analytics);

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
