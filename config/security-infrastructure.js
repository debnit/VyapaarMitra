
const securityInfrastructure = {
  // API Gateway Security
  api_gateway: {
    rate_limiting: {
      global: '10000_requests_per_minute',
      per_user: '100_requests_per_minute',
      per_ip: '1000_requests_per_minute'
    },
    
    authentication: {
      methods: ['jwt', 'oauth2', 'api_keys'],
      mfa_required: true,
      session_timeout: '24_hours'
    },

    encryption: {
      in_transit: 'TLS_1.3',
      at_rest: 'AES_256',
      key_rotation: '90_days'
    }
  },

  // Data Protection
  data_security: {
    pii_encryption: {
      fields: ['pan_number', 'aadhar_number', 'bank_accounts', 'phone', 'email'],
      algorithm: 'AES_256_GCM',
      key_management: 'aws_kms'
    },

    audit_logging: {
      events: ['login', 'data_access', 'financial_transactions', 'admin_actions'],
      retention: '7_years',
      compliance: ['gdpr', 'rbi_guidelines']
    },

    data_masking: {
      production_access: 'masked_data_only',
      sensitive_fields: 'encrypted_or_tokenized'
    }
  },

  // Infrastructure Security
  infrastructure: {
    network_security: {
      vpc_isolation: true,
      private_subnets: ['database', 'internal_services'],
      public_subnets: ['load_balancers', 'api_gateway'],
      waf_protection: true
    },

    container_security: {
      image_scanning: 'vulnerability_assessment',
      runtime_protection: 'container_monitoring',
      secrets_management: 'vault_integration'
    },

    compliance_frameworks: [
      'iso_27001',
      'soc_2_type_2', 
      'rbi_cyber_security',
      'cert_in_guidelines'
    ]
  }
};

module.exports = securityInfrastructure;
