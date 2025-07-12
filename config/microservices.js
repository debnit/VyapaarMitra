
const microservices = {
  // Authentication & User Management Service
  auth: {
    port: 3001,
    replicas: 5,
    resources: { cpu: '1000m', memory: '2Gi' },
    databases: ['user_auth_db'],
    cache: ['session_cache']
  },

  // MSME Profile Service
  msme_profile: {
    port: 3002,
    replicas: 10,
    resources: { cpu: '2000m', memory: '4Gi' },
    databases: ['msme_profiles_db'],
    cache: ['profile_cache']
  },

  // Loan Processing Service
  loan_engine: {
    port: 3003,
    replicas: 15,
    resources: { cpu: '3000m', memory: '6Gi' },
    databases: ['loan_applications_db', 'credit_scores_db'],
    cache: ['loan_cache'],
    queue: ['loan_processing_queue']
  },

  // Valuation Engine Service
  valuation_engine: {
    port: 3004,
    replicas: 8,
    resources: { cpu: '2000m', memory: '4Gi' },
    databases: ['valuations_db', 'market_data_db'],
    cache: ['valuation_cache'],
    ml_models: ['financial_health_model', 'market_position_model']
  },

  // Escrow & Payments Service
  escrow_payments: {
    port: 3005,
    replicas: 12,
    resources: { cpu: '2000m', memory: '3Gi' },
    databases: ['escrow_accounts_db', 'transactions_db'],
    cache: ['payment_cache'],
    external_apis: ['razorpay', 'payu', 'upi_gateway']
  },

  // Procurement Marketplace Service
  procurement: {
    port: 3006,
    replicas: 8,
    resources: { cpu: '1500m', memory: '3Gi' },
    databases: ['procurement_db', 'supplier_network_db'],
    cache: ['marketplace_cache'],
    search_engine: ['elasticsearch']
  },

  // Compliance & Regulatory Service
  compliance: {
    port: 3007,
    replicas: 6,
    resources: { cpu: '1000m', memory: '2Gi' },
    databases: ['compliance_db', 'regulatory_updates_db'],
    cache: ['compliance_cache'],
    external_apis: ['gst_api', 'mca_api', 'rbi_api']
  },

  // Navarambh (Recovery) Service
  navarambh: {
    port: 3008,
    replicas: 4,
    resources: { cpu: '1500m', memory: '3Gi' },
    databases: ['distressed_cases_db', 'recovery_strategies_db'],
    cache: ['recovery_cache'],
    ai_models: ['risk_assessment_model']
  },

  // Analytics & Reporting Service
  analytics: {
    port: 3009,
    replicas: 6,
    resources: { cpu: '2000m', memory: '8Gi' },
    databases: ['analytics_db', 'data_warehouse'],
    cache: ['analytics_cache'],
    streaming: ['kafka', 'storm']
  },

  // Notification Service
  notification: {
    port: 3010,
    replicas: 5,
    resources: { cpu: '500m', memory: '1Gi' },
    databases: ['notification_logs_db'],
    cache: ['notification_cache'],
    queue: ['email_queue', 'sms_queue', 'push_queue']
  }
};

module.exports = microservices;
