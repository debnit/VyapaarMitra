
const monitoringConfig = {
  // Application Performance Monitoring
  apm: {
    tool: 'new_relic',
    metrics: [
      'response_time',
      'throughput',
      'error_rate',
      'database_performance',
      'memory_usage',
      'cpu_utilization'
    ],
    alerts: {
      response_time: '> 2_seconds',
      error_rate: '> 1_percent',
      cpu_usage: '> 80_percent',
      memory_usage: '> 85_percent'
    }
  },

  // Business Metrics Dashboard
  business_metrics: {
    kpis: [
      'daily_active_msmes',
      'loan_application_volume',
      'valuation_requests',
      'escrow_transactions',
      'procurement_matches',
      'revenue_metrics'
    ],
    
    real_time_analytics: {
      user_activity: 'live_dashboard',
      system_health: 'status_page',
      transaction_monitoring: 'fraud_detection'
    }
  },

  // Log Management
  logging: {
    centralized_logging: 'elasticsearch_kibana',
    log_levels: ['error', 'warn', 'info', 'debug'],
    structured_logging: 'json_format',
    log_retention: '1_year'
  },

  // Infrastructure Monitoring
  infrastructure: {
    tools: ['prometheus', 'grafana', 'alertmanager'],
    metrics: [
      'server_health',
      'database_connections',
      'cache_hit_rates',
      'queue_depths',
      'network_latency'
    ]
  }
};

module.exports = monitoringConfig;
