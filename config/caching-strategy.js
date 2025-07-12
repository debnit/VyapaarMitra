
const cachingStrategy = {
  // Level 1: Application Cache (In-Memory)
  l1_cache: {
    technology: 'node-cache',
    ttl: 300, // 5 minutes
    max_size: '500MB',
    use_cases: ['user_sessions', 'frequent_queries', 'config_data']
  },

  // Level 2: Distributed Cache (Redis Cluster)
  l2_cache: {
    technology: 'redis-cluster',
    nodes: 12,
    ttl: 3600, // 1 hour
    max_size: '50GB_per_node',
    use_cases: ['msme_profiles', 'loan_data', 'marketplace_listings']
  },

  // Level 3: CDN Cache (Global)
  l3_cache: {
    technology: 'cloudflare_cdn',
    edge_locations: 'global',
    ttl: 86400, // 24 hours
    use_cases: ['static_assets', 'public_data', 'documents']
  },

  // Cache Invalidation Strategy
  invalidation: {
    patterns: [
      {
        trigger: 'msme_profile_update',
        invalidate: ['user_cache:*', 'profile_cache:*']
      },
      {
        trigger: 'loan_status_change',
        invalidate: ['loan_cache:*', 'dashboard_cache:*']
      },
      {
        trigger: 'valuation_update',
        invalidate: ['valuation_cache:*', 'analytics_cache:*']
      }
    ]
  }
};

module.exports = cachingStrategy;
