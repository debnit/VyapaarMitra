
const shardingConfig = {
  // Shard MSMEs by state for better data locality
  msme_sharding: {
    strategy: 'geographic',
    shards: [
      {
        id: 'north_india',
        states: ['punjab', 'haryana', 'delhi', 'uttar_pradesh', 'himachal_pradesh'],
        db_endpoint: 'north-india-cluster.vyapaar.com',
        capacity: '1_crore_msmes'
      },
      {
        id: 'west_india', 
        states: ['maharashtra', 'gujarat', 'rajasthan', 'goa'],
        db_endpoint: 'west-india-cluster.vyapaar.com',
        capacity: '1.5_crore_msmes'
      },
      {
        id: 'south_india',
        states: ['karnataka', 'tamil_nadu', 'kerala', 'andhra_pradesh', 'telangana'],
        db_endpoint: 'south-india-cluster.vyapaar.com',
        capacity: '1.5_crore_msmes'
      },
      {
        id: 'east_india',
        states: ['west_bengal', 'odisha', 'jharkhand', 'bihar', 'assam'],
        db_endpoint: 'east-india-cluster.vyapaar.com',
        capacity: '1_crore_msmes'
      },
      {
        id: 'central_india',
        states: ['madhya_pradesh', 'chhattisgarh', 'other_states'],
        db_endpoint: 'central-india-cluster.vyapaar.com',
        capacity: '1_crore_msmes'
      }
    ]
  },

  // Financial data sharding by business size
  financial_sharding: {
    strategy: 'business_size',
    shards: [
      {
        id: 'micro_enterprises',
        criteria: 'annual_turnover < 5000000',
        db_endpoint: 'micro-financial-cluster.vyapaar.com'
      },
      {
        id: 'small_enterprises', 
        criteria: 'annual_turnover >= 5000000 AND annual_turnover < 50000000',
        db_endpoint: 'small-financial-cluster.vyapaar.com'
      },
      {
        id: 'medium_enterprises',
        criteria: 'annual_turnover >= 50000000',
        db_endpoint: 'medium-financial-cluster.vyapaar.com'
      }
    ]
  }
};

const getShardForMSME = (state, businessSize) => {
  const geoShard = shardingConfig.msme_sharding.shards.find(
    shard => shard.states.includes(state.toLowerCase())
  );
  
  const financialShard = shardingConfig.financial_sharding.shards.find(
    shard => eval(shard.criteria.replace('annual_turnover', businessSize))
  );

  return {
    primary_shard: geoShard?.id,
    financial_shard: financialShard?.id,
    db_endpoints: {
      profile: geoShard?.db_endpoint,
      financial: financialShard?.db_endpoint
    }
  };
};

module.exports = { shardingConfig, getShardForMSME };
