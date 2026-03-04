const fs = require('fs');
const path = require('path');

const LOCKFILE_PATH = path.join(
  process.env.LOCALAPPDATA,
  'Riot Games',
  'Riot Client',
  'Config',
  'lockfile'
);

function readLockfile() {
  if (!fs.existsSync(LOCKFILE_PATH)) {
    return { ok: false, error: 'Valorant no está corriendo' };
  }

  try {
    const content = fs.readFileSync(LOCKFILE_PATH, 'utf-8');
    const [name, pid, port, password, protocol] = content.trim().split(':');

    if (!port || !password) {
      return { ok: false, error: 'Lockfile inválido' };
    }

    return {
      ok: true,
      data: { name, pid: parseInt(pid, 10), port: parseInt(port, 10), password, protocol }
    };
  } catch (err) {
    return { ok: false, error: `Error leyendo lockfile: ${err.message}` };
  }
}

module.exports = { readLockfile, LOCKFILE_PATH };
