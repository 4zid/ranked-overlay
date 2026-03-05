const https = require('https');
const fs = require('fs');
const path = require('path');
const { readLockfile } = require('./lockfile');
const { getRankName, getRankColor, getQueueName, SHARD_REGIONS } = require('./constants');

// Agent that ignores self-signed certificates from the local Riot Client
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

let cachedAuth = null;

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { ...options, agent: insecureAgent }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); }
          catch { resolve(data); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    if (options.timeout) req.setTimeout(options.timeout, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

async function authenticate() {
  const lockResult = readLockfile();
  if (!lockResult.ok) {
    cachedAuth = null;
    throw new Error(lockResult.error);
  }

  const { port, password } = lockResult.data;
  const basicAuth = Buffer.from(`riot:${password}`).toString('base64');

  const entitlements = await httpRequest(`https://127.0.0.1:${port}/entitlements/v1/token`, {
    headers: { 'Authorization': `Basic ${basicAuth}` },
    timeout: 5000
  });

  cachedAuth = {
    accessToken: entitlements.accessToken,
    entitlementsToken: entitlements.token,
    puuid: entitlements.subject,
    port,
    password,
    basicAuth
  };

  return cachedAuth;
}

async function detectShard() {
  // Try to detect shard from Valorant log files
  const logPath = path.join(
    process.env.LOCALAPPDATA,
    'VALORANT',
    'Saved',
    'Logs',
    'ShooterGame.log'
  );

  try {
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf-8');
      // Look for shard in API URLs within the log
      const match = content.match(/https:\/\/pd\.([a-z]+)\.a\.pvp\.net/);
      if (match) return match[1];

      const glzMatch = content.match(/https:\/\/glz-([a-z]+)-/);
      if (glzMatch) return glzMatch[1];
    }
  } catch { /* ignore */ }

  // Default to NA shard (covers NA, LATAM, BR)
  return 'na';
}

async function detectRegion() {
  const logPath = path.join(
    process.env.LOCALAPPDATA,
    'VALORANT',
    'Saved',
    'Logs',
    'ShooterGame.log'
  );

  try {
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf-8');
      const match = content.match(/https:\/\/glz-([a-z0-9-]+)\.([a-z]+)\.a\.pvp\.net/);
      if (match) return { glzRegion: match[1], shard: match[2] };
    }
  } catch { /* ignore */ }

  return { glzRegion: 'latam-1', shard: 'na' };
}

async function getClientVersion() {
  try {
    const data = await httpRequest('https://valorant-api.com/v1/version', { timeout: 5000 });
    return data.data.riotClientVersion;
  } catch {
    return 'release-09.00-shipping-18-2594305';
  }
}

async function getPlayerMMR() {
  if (!cachedAuth) await authenticate();

  const shard = await detectShard();
  const clientVersion = await getClientVersion();

  const headers = {
    'Authorization': `Bearer ${cachedAuth.accessToken}`,
    'X-Riot-Entitlements-JWT': cachedAuth.entitlementsToken,
    'X-Riot-ClientVersion': clientVersion,
    'X-Riot-ClientPlatform': Buffer.from(JSON.stringify({
      platformType: 'PC',
      platformOS: 'Windows',
      platformOSVersion: '10.0.19042.1.256.64bit',
      platformChipset: 'Unknown'
    })).toString('base64')
  };

  const mmrData = await httpRequest(
    `https://pd.${shard}.a.pvp.net/mmr/v1/players/${cachedAuth.puuid}`,
    { headers, timeout: 10000 }
  );

  // Find the latest season data
  const queueSkills = mmrData.QueueSkills;
  let competitiveTier = 0;
  let rankedRating = 0;

  if (queueSkills?.competitive?.SeasonalInfoBySeasonID) {
    const seasons = queueSkills.competitive.SeasonalInfoBySeasonID;
    const seasonIds = Object.keys(seasons);

    // Get the most recent season (last in the object)
    if (seasonIds.length > 0) {
      const latestSeason = seasons[seasonIds[seasonIds.length - 1]];
      competitiveTier = latestSeason.CompetitiveTier || 0;
      rankedRating = latestSeason.RankedRating || 0;
    }
  }

  return {
    tier: competitiveTier,
    rankName: getRankName(competitiveTier),
    rankColor: getRankColor(competitiveTier),
    rr: rankedRating
  };
}

async function getCurrentGameMode() {
  if (!cachedAuth) await authenticate();

  const { glzRegion, shard } = await detectRegion();
  const clientVersion = await getClientVersion();

  const headers = {
    'Authorization': `Bearer ${cachedAuth.accessToken}`,
    'X-Riot-Entitlements-JWT': cachedAuth.entitlementsToken,
    'X-Riot-ClientVersion': clientVersion,
    'X-Riot-ClientPlatform': Buffer.from(JSON.stringify({
      platformType: 'PC',
      platformOS: 'Windows',
      platformOSVersion: '10.0.19042.1.256.64bit',
      platformChipset: 'Unknown'
    })).toString('base64')
  };

  const baseUrl = `https://glz-${glzRegion}.${shard}.a.pvp.net`;

  // Try core game (active match)
  try {
    const coreGame = await httpRequest(
      `${baseUrl}/core-game/v1/players/${cachedAuth.puuid}`,
      { headers, timeout: 5000 }
    );
    if (coreGame?.MatchID) {
      const matchInfo = await httpRequest(
        `${baseUrl}/core-game/v1/matches/${coreGame.MatchID}`,
        { headers, timeout: 5000 }
      );
      return {
        status: 'in_game',
        queueId: matchInfo?.QueueID || '',
        queueName: getQueueName(matchInfo?.QueueID)
      };
    }
  } catch { /* not in active game */ }

  // Try pregame (agent select)
  try {
    const pregame = await httpRequest(
      `${baseUrl}/pregame/v1/players/${cachedAuth.puuid}`,
      { headers, timeout: 5000 }
    );
    if (pregame?.MatchID) {
      const matchInfo = await httpRequest(
        `${baseUrl}/pregame/v1/matches/${pregame.MatchID}`,
        { headers, timeout: 5000 }
      );
      return {
        status: 'agent_select',
        queueId: matchInfo?.QueueID || '',
        queueName: getQueueName(matchInfo?.QueueID)
      };
    }
  } catch { /* not in pregame */ }

  return { status: 'lobby', queueId: '', queueName: 'Lobby' };
}

async function getAllData() {
  try {
    await authenticate();
    const [mmr, gameMode] = await Promise.all([getPlayerMMR(), getCurrentGameMode()]);
    return {
      ok: true,
      rank: mmr.rankName,
      rankColor: mmr.rankColor,
      tier: mmr.tier,
      rr: mmr.rr,
      gameStatus: gameMode.status,
      gameMode: gameMode.queueName,
      queueId: gameMode.queueId
    };
  } catch (err) {
    cachedAuth = null;
    return {
      ok: false,
      error: err.message,
      rank: 'N/A',
      rankColor: '#5a5a5a',
      tier: 0,
      rr: 0,
      gameStatus: 'unknown',
      gameMode: 'N/A'
    };
  }
}

module.exports = { getAllData, authenticate };
