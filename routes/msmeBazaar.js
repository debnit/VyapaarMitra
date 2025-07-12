
const express = require('express');
const joi = require('joi');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// MSME profile creation schema
const msmeProfileSchema = joi.object({
  businessName: joi.string().min(2).required(),
  businessType: joi.string().required(),
  panNumber: joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
  gstNumber: joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  address: joi.string().required(),
  city: joi.string().required(),
  state: joi.string().required(),
  pincode: joi.string().pattern(/^[0-9]{6}$/).required(),
  industrySector: joi.string().required(),
  annualTurnover: joi.number().positive().required(),
  employeeCount: joi.number().integer().min(1).required(),
  establishmentYear: joi.number().integer().min(1900).max(new Date().getFullYear()).required()
});

// Create MSME profile (onboarding step 1)
router.post('/profile', authorizeRoles('msme_owner'), async (req, res) => {
  try {
    const { error, value } = msmeProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      businessName, businessType, panNumber, gstNumber, address,
      city, state, pincode, industrySector, annualTurnover,
      employeeCount, establishmentYear
    } = value;

    // Check if profile already exists
    const existingProfile = await pool.query(
      'SELECT id FROM msme_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(400).json({ error: 'MSME profile already exists' });
    }

    const result = await pool.query(
      `INSERT INTO msme_profiles (
        user_id, business_name, business_type, pan_number, gst_number,
        address, city, state, pincode, industry_sector, annual_turnover,
        employee_count, establishment_year, onboarding_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, business_name, onboarding_status`,
      [
        req.user.id, businessName, businessType, panNumber, gstNumber,
        address, city, state, pincode, industrySector, annualTurnover,
        employeeCount, establishmentYear, 'profile_created'
      ]
    );

    res.status(201).json({
      message: 'MSME profile created successfully',
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get MSME onboarding packages
router.get('/packages', async (req, res) => {
  try {
    const packages = [
      {
        id: 'basic',
        name: 'MSMEBazaar Basic',
        price: 199,
        currency: 'INR',
        features: [
          'Government registration assistance',
          'Basic compliance setup',
          'Loan application support',
          'Raw material procurement access',
          'Basic market visibility'
        ],
        duration: '1 year',
        popular: true
      },
      {
        id: 'premium',
        name: 'MSMEBazaar Premium',
        price: 499,
        currency: 'INR',
        features: [
          'All Basic features',
          'Priority loan processing',
          'Advanced procurement network',
          'Enhanced market visibility',
          'Dedicated support manager',
          'Financial health monitoring'
        ],
        duration: '1 year',
        popular: false
      }
    ];

    res.json({ packages });
  } catch (error) {
    console.error('Packages fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update onboarding status
router.patch('/onboarding-status', authorizeRoles('msme_owner'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['profile_created', 'documents_uploaded', 'payment_completed', 'onboarded'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE msme_profiles SET onboarding_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 RETURNING id, business_name, onboarding_status`,
      [status, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'MSME profile not found' });
    }

    res.json({
      message: 'Onboarding status updated',
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get onboarding progress
router.get('/progress', authorizeRoles('msme_owner'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mp.onboarding_status, mp.business_name, mp.created_at,
              COUNT(ct.id) as compliance_items,
              COUNT(CASE WHEN ct.status = 'completed' THEN 1 END) as completed_compliance
       FROM msme_profiles mp
       LEFT JOIN compliance_tracking ct ON mp.id = ct.msme_id
       WHERE mp.user_id = $1
       GROUP BY mp.id, mp.onboarding_status, mp.business_name, mp.created_at`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'MSME profile not found' });
    }

    const profile = result.rows[0];
    const progress = {
      status: profile.onboarding_status,
      businessName: profile.business_name,
      registrationDate: profile.created_at,
      completionPercentage: calculateOnboardingPercentage(profile.onboarding_status),
      complianceProgress: {
        total: parseInt(profile.compliance_items),
        completed: parseInt(profile.completed_compliance)
      }
    };

    res.json({ progress });

  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function calculateOnboardingPercentage(status) {
  const statusMap = {
    'pending': 0,
    'profile_created': 25,
    'documents_uploaded': 50,
    'payment_completed': 75,
    'onboarded': 100
  };
  return statusMap[status] || 0;
}

module.exports = router;
