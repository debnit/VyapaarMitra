
const { pool } = require('../config/database');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

class ValuationEngine {
  constructor() {
    this.weightings = {
      financialHealth: 0.35,
      marketPosition: 0.25,
      operationalEfficiency: 0.20,
      growthPotential: 0.20
    };
  }

  async calculateValuation(msmeId) {
    try {
      const msmeData = await this.getMSMEData(msmeId);
      
      const scores = {
        financialHealth: await this.calculateFinancialHealthScore(msmeData),
        marketPosition: await this.calculateMarketPositionScore(msmeData),
        operationalEfficiency: await this.calculateOperationalScore(msmeData),
        growthPotential: await this.calculateGrowthScore(msmeData)
      };

      const weightedScore = Object.keys(scores).reduce((total, key) => {
        return total + (scores[key] * this.weightings[key]);
      }, 0);

      const baseValuation = msmeData.annual_turnover * this.getMultiplier(msmeData.industry_sector);
      const adjustedValuation = baseValuation * (weightedScore / 100);

      const valuation = {
        msmeId,
        baseValuation,
        adjustedValuation,
        scores,
        weightedScore,
        multiplier: this.getMultiplier(msmeData.industry_sector),
        calculatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      };

      await this.saveValuation(valuation);
      return valuation;

    } catch (error) {
      logger.error('Valuation calculation error:', error);
      throw error;
    }
  }

  async getMSMEData(msmeId) {
    const result = await pool.query(`
      SELECT mp.*, 
             COUNT(DISTINCT la.id) as loan_applications,
             COUNT(DISTINCT CASE WHEN la.status = 'approved' THEN la.id END) as approved_loans,
             COALESCE(SUM(CASE WHEN la.status = 'approved' THEN la.requested_amount END), 0) as total_loans,
             COUNT(DISTINCT pr.id) as procurement_requests,
             COUNT(DISTINCT ct.id) as compliance_items,
             COUNT(DISTINCT CASE WHEN ct.status = 'completed' THEN ct.id END) as completed_compliance
      FROM msme_profiles mp
      LEFT JOIN loan_applications la ON mp.id = la.msme_id
      LEFT JOIN procurement_requests pr ON mp.id = pr.msme_id  
      LEFT JOIN compliance_tracking ct ON mp.id = ct.msme_id
      WHERE mp.id = $1
      GROUP BY mp.id
    `, [msmeId]);

    if (result.rows.length === 0) {
      throw new Error('MSME not found');
    }

    return result.rows[0];
  }

  async calculateFinancialHealthScore(data) {
    let score = 0;
    
    // Revenue stability (40%)
    if (data.annual_turnover > 0) {
      if (data.annual_turnover >= 10000000) score += 40; // >=1 crore
      else if (data.annual_turnover >= 5000000) score += 30; // >=50 lakh
      else if (data.annual_turnover >= 1000000) score += 20; // >=10 lakh
      else score += 10;
    }

    // Loan performance (30%)
    if (data.loan_applications > 0) {
      const approvalRate = data.approved_loans / data.loan_applications;
      score += approvalRate * 30;
    } else {
      score += 15; // No loans can be neutral
    }

    // Compliance record (30%)
    if (data.compliance_items > 0) {
      const complianceRate = data.completed_compliance / data.compliance_items;
      score += complianceRate * 30;
    } else {
      score += 20; // Assume good compliance if no tracking
    }

    return Math.min(score, 100);
  }

  async calculateMarketPositionScore(data) {
    let score = 0;

    // Industry sector multiplier (50%)
    const sectorScores = {
      'manufacturing': 40,
      'technology': 45,
      'services': 35,
      'trading': 30,
      'agriculture': 25
    };
    score += sectorScores[data.industry_sector] || 30;

    // Business age (30%)
    const currentYear = new Date().getFullYear();
    const age = currentYear - data.establishment_year;
    if (age >= 10) score += 30;
    else if (age >= 5) score += 20;
    else if (age >= 2) score += 15;
    else score += 10;

    // Employee count (20%)
    if (data.employee_count >= 50) score += 20;
    else if (data.employee_count >= 20) score += 15;
    else if (data.employee_count >= 10) score += 10;
    else score += 5;

    return Math.min(score, 100);
  }

  async calculateOperationalScore(data) {
    let score = 0;

    // Digital presence (40%)
    if (data.onboarding_status === 'onboarded') score += 40;
    else if (data.onboarding_status === 'payment_completed') score += 30;
    else score += 10;

    // Procurement activity (30%)
    if (data.procurement_requests >= 5) score += 30;
    else if (data.procurement_requests >= 2) score += 20;
    else if (data.procurement_requests >= 1) score += 10;

    // Registration completeness (30%)
    let regScore = 0;
    if (data.gst_number) regScore += 10;
    if (data.udyam_number) regScore += 10;
    if (data.pan_number) regScore += 10;
    score += regScore;

    return Math.min(score, 100);
  }

  async calculateGrowthScore(data) {
    let score = 0;

    // Subscription plan (40%)
    if (data.subscription_plan === 'premium') score += 40;
    else if (data.subscription_plan === 'basic') score += 25;
    else score += 10;

    // Activity level (60%)
    const totalActivity = data.loan_applications + data.procurement_requests + data.compliance_items;
    if (totalActivity >= 10) score += 60;
    else if (totalActivity >= 5) score += 40;
    else if (totalActivity >= 2) score += 25;
    else score += 10;

    return Math.min(score, 100);
  }

  getMultiplier(sector) {
    const multipliers = {
      'technology': 3.5,
      'manufacturing': 2.5,
      'services': 2.0,
      'trading': 1.8,
      'agriculture': 1.5
    };
    return multipliers[sector] || 2.0;
  }

  async saveValuation(valuation) {
    await pool.query(`
      INSERT INTO valuations (
        msme_id, base_valuation, adjusted_valuation, scores, 
        weighted_score, multiplier, calculated_at, valid_until
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (msme_id) 
      DO UPDATE SET 
        base_valuation = $2,
        adjusted_valuation = $3,
        scores = $4,
        weighted_score = $5,
        multiplier = $6,
        calculated_at = $7,
        valid_until = $8
    `, [
      valuation.msmeId,
      valuation.baseValuation,
      valuation.adjustedValuation,
      JSON.stringify(valuation.scores),
      valuation.weightedScore,
      valuation.multiplier,
      valuation.calculatedAt,
      valuation.validUntil
    ]);
  }

  async getValuation(msmeId) {
    const result = await pool.query(`
      SELECT * FROM valuations 
      WHERE msme_id = $1 AND valid_until > CURRENT_TIMESTAMP
      ORDER BY calculated_at DESC LIMIT 1
    `, [msmeId]);

    if (result.rows.length === 0) {
      return await this.calculateValuation(msmeId);
    }

    return result.rows[0];
  }
}

module.exports = ValuationEngine;
