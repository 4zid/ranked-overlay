const RANK_TIERS = {
  0: { name: 'Unranked', color: '#5a5a5a' },
  1: { name: 'Unused', color: '#5a5a5a' },
  2: { name: 'Unused', color: '#5a5a5a' },
  3: { name: 'Iron 1', color: '#6e6e6e' },
  4: { name: 'Iron 2', color: '#6e6e6e' },
  5: { name: 'Iron 3', color: '#6e6e6e' },
  6: { name: 'Bronze 1', color: '#b47643' },
  7: { name: 'Bronze 2', color: '#b47643' },
  8: { name: 'Bronze 3', color: '#b47643' },
  9: { name: 'Silver 1', color: '#c0c0c0' },
  10: { name: 'Silver 2', color: '#c0c0c0' },
  11: { name: 'Silver 3', color: '#c0c0c0' },
  12: { name: 'Gold 1', color: '#e6c84d' },
  13: { name: 'Gold 2', color: '#e6c84d' },
  14: { name: 'Gold 3', color: '#e6c84d' },
  15: { name: 'Platinum 1', color: '#3cb8c9' },
  16: { name: 'Platinum 2', color: '#3cb8c9' },
  17: { name: 'Platinum 3', color: '#3cb8c9' },
  18: { name: 'Diamond 1', color: '#c77dff' },
  19: { name: 'Diamond 2', color: '#c77dff' },
  20: { name: 'Diamond 3', color: '#c77dff' },
  21: { name: 'Ascendant 1', color: '#2dce89' },
  22: { name: 'Ascendant 2', color: '#2dce89' },
  23: { name: 'Ascendant 3', color: '#2dce89' },
  24: { name: 'Immortal 1', color: '#ff4655' },
  25: { name: 'Immortal 2', color: '#ff4655' },
  26: { name: 'Immortal 3', color: '#ff4655' },
  27: { name: 'Radiant', color: '#fffaa0' }
};

const QUEUE_NAMES = {
  competitive: 'Competitivo',
  unrated: 'No clasificatoria',
  spikerush: 'Spike Rush',
  deathmatch: 'Deathmatch',
  ggteam: 'Escalation',
  onefa: 'Replication',
  swiftplay: 'Swiftplay',
  hurm: 'Team Deathmatch',
  premier: 'Premier',
  '': 'Lobby'
};

const SHARD_REGIONS = {
  na: { shard: 'na', region: 'na' },
  latam: { shard: 'na', region: 'latam' },
  br: { shard: 'na', region: 'br' },
  eu: { shard: 'eu', region: 'eu' },
  ap: { shard: 'ap', region: 'ap' },
  kr: { shard: 'kr', region: 'kr' }
};

function getRankName(tier) {
  return RANK_TIERS[tier]?.name || 'Unknown';
}

function getRankColor(tier) {
  return RANK_TIERS[tier]?.color || '#5a5a5a';
}

function getQueueName(queueId) {
  return QUEUE_NAMES[queueId] || queueId || 'Lobby';
}

module.exports = { RANK_TIERS, QUEUE_NAMES, SHARD_REGIONS, getRankName, getRankColor, getQueueName };
