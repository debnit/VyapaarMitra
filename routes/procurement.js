
const express = require('express');
const joi = require('joi');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Procurement request schema
const procurementRequestSchema = joi.object({
  materialType: joi.string().required(),
  materialName: joi.string().min(3).max(100).required(),
  quantity: joi.number().positive().required(),
  unit: joi.string().required(),
  maxBudget: joi.number().positive().required(),
  deliveryLocation: joi.string().min(10).max(200).required(),
  requiredBy: joi.date().greater('now').required(),
  specifications: joi.string().max(1000).optional(),
  qualityRequirements: joi.string().max(500).optional()
});

// Supplier quote schema
const quoteSchema = joi.object({
  pricePerUnit: joi.number().positive().required(),
  totalPrice: joi.number().positive().required(),
  deliveryDays: joi.number().integer().positive().required(),
  paymentTerms: joi.string().required(),
  warranty: joi.string().optional(),
  additionalNotes: joi.string().max(500).optional()
});

// Create procurement request
router.post('/requests', async (req, res) => {
  try {
    const { error, value } = procurementRequestSchema.validate(req.body);
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

    const {
      materialType, materialName, quantity, unit, maxBudget,
      deliveryLocation, requiredBy, specifications, qualityRequirements
    } = value;

    const result = await pool.query(`
      INSERT INTO procurement_requests (
        msme_id, material_type, material_name, quantity, unit, 
        max_budget, delivery_location, required_by, specifications, 
        quality_requirements, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open')
      RETURNING *
    `, [
      msmeProfile.rows[0].id, materialType, materialName, quantity, unit,
      maxBudget, deliveryLocation, requiredBy, specifications, qualityRequirements
    ]);

    res.status(201).json({
      message: 'Procurement request created successfully',
      request: result.rows[0]
    });

  } catch (error) {
    console.error('Procurement request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get procurement requests
router.get('/requests', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const msmeProfile = await pool.query(
      'SELECT id FROM msme_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (msmeProfile.rows.length === 0) {
      return res.json({ requests: [], total: 0 });
    }

    let query = `
      SELECT pr.*, COUNT(pq.id) as quote_count
      FROM procurement_requests pr
      LEFT JOIN procurement_quotes pq ON pr.id = pq.request_id
      WHERE pr.msme_id = $1
    `;
    let params = [msmeProfile.rows[0].id];

    if (status) {
      query += ` AND pr.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` GROUP BY pr.id ORDER BY pr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM procurement_requests WHERE msme_id = $1';
    let countParams = [msmeProfile.rows[0].id];

    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      requests: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });

  } catch (error) {
    console.error('Procurement requests fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get quotes for a procurement request
router.get('/requests/:id/quotes', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify request belongs to user
    const requestCheck = await pool.query(`
      SELECT pr.id FROM procurement_requests pr
      JOIN msme_profiles mp ON pr.msme_id = mp.id
      WHERE pr.id = $1 AND mp.user_id = $2
    `, [id, req.user.id]);

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Procurement request not found' });
    }

    const quotes = await pool.query(`
      SELECT pq.*, sp.company_name, sp.contact_person, sp.rating
      FROM procurement_quotes pq
      JOIN supplier_profiles sp ON pq.supplier_id = sp.id
      WHERE pq.request_id = $1
      ORDER BY pq.total_price ASC
    `, [id]);

    res.json({ quotes: quotes.rows });

  } catch (error) {
    console.error('Quotes fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit quote (for suppliers)
router.post('/requests/:id/quotes', authorizeRoles('supplier'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = quoteSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if procurement request exists and is open
    const requestCheck = await pool.query(
      'SELECT id, status FROM procurement_requests WHERE id = $1',
      [id]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Procurement request not found' });
    }

    if (requestCheck.rows[0].status !== 'open') {
      return res.status(400).json({ error: 'Procurement request is no longer accepting quotes' });
    }

    // Get supplier profile
    const supplierProfile = await pool.query(
      'SELECT id FROM supplier_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (supplierProfile.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Check if supplier already submitted a quote
    const existingQuote = await pool.query(
      'SELECT id FROM procurement_quotes WHERE request_id = $1 AND supplier_id = $2',
      [id, supplierProfile.rows[0].id]
    );

    if (existingQuote.rows.length > 0) {
      return res.status(400).json({ error: 'Quote already submitted for this request' });
    }

    const {
      pricePerUnit, totalPrice, deliveryDays, paymentTerms, warranty, additionalNotes
    } = value;

    const result = await pool.query(`
      INSERT INTO procurement_quotes (
        request_id, supplier_id, price_per_unit, total_price, 
        delivery_days, payment_terms, warranty, additional_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      id, supplierProfile.rows[0].id, pricePerUnit, totalPrice,
      deliveryDays, paymentTerms, warranty, additionalNotes
    ]);

    res.status(201).json({
      message: 'Quote submitted successfully',
      quote: result.rows[0]
    });

  } catch (error) {
    console.error('Quote submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept a quote
router.post('/quotes/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify quote belongs to user's procurement request
    const quoteCheck = await pool.query(`
      SELECT pq.*, pr.id as request_id, pr.status
      FROM procurement_quotes pq
      JOIN procurement_requests pr ON pq.request_id = pr.id
      JOIN msme_profiles mp ON pr.msme_id = mp.id
      WHERE pq.id = $1 AND mp.user_id = $2
    `, [id, req.user.id]);

    if (quoteCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quoteCheck.rows[0].status !== 'open') {
      return res.status(400).json({ error: 'Procurement request is no longer open' });
    }

    // Update quote status to accepted
    await pool.query(
      'UPDATE procurement_quotes SET status = $1, accepted_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['accepted', id]
    );

    // Update procurement request status
    await pool.query(
      'UPDATE procurement_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['awarded', quoteCheck.rows[0].request_id]
    );

    // Reject other quotes for this request
    await pool.query(
      'UPDATE procurement_quotes SET status = $1 WHERE request_id = $2 AND id != $3',
      ['rejected', quoteCheck.rows[0].request_id, id]
    );

    res.json({ message: 'Quote accepted successfully' });

  } catch (error) {
    console.error('Quote acceptance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get material categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        category: 'raw_materials',
        name: 'Raw Materials',
        subcategories: ['metals', 'plastics', 'chemicals', 'textiles', 'wood', 'rubber']
      },
      {
        category: 'machinery',
        name: 'Machinery & Equipment',
        subcategories: ['production_machines', 'testing_equipment', 'tools', 'packaging_machines']
      },
      {
        category: 'components',
        name: 'Components & Parts',
        subcategories: ['electronic_components', 'mechanical_parts', 'fasteners', 'hardware']
      },
      {
        category: 'packaging',
        name: 'Packaging Materials',
        subcategories: ['boxes', 'bags', 'labels', 'protective_materials']
      },
      {
        category: 'consumables',
        name: 'Consumables',
        subcategories: ['office_supplies', 'safety_equipment', 'maintenance_items']
      }
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
