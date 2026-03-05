const overlay = document.getElementById('overlay');
const rankNameEl = document.getElementById('rankName');
const rrValueEl = document.getElementById('rrValue');
const rrBarEl = document.getElementById('rrBar');
const gameModeEl = document.getElementById('gameMode');
const errorMsgEl = document.getElementById('errorMsg');
const alertOverlay = document.getElementById('alertOverlay');
const alertModeEl = document.getElementById('alertMode');

function updateUI(data) {
  if (!data.ok) {
    errorMsgEl.textContent = data.error;
    errorMsgEl.classList.remove('hidden');
    rankNameEl.textContent = '--';
    rankNameEl.style.color = '#5a5a5a';
    rrValueEl.textContent = '-';
    rrBarEl.style.width = '0%';
    gameModeEl.textContent = 'Sin conexion';
    gameModeEl.className = 'mode-value lobby';
    return;
  }

  errorMsgEl.classList.add('hidden');

  rankNameEl.textContent = data.rank;
  rankNameEl.style.color = data.rankColor;

  rrValueEl.textContent = data.rr;
  rrBarEl.style.width = `${Math.min(data.rr, 100)}%`;

  gameModeEl.textContent = data.gameMode;

  // Status class for the indicator dot
  gameModeEl.className = 'mode-value';
  if (data.gameStatus === 'in_game') {
    gameModeEl.classList.add('in-game');
  } else if (data.gameStatus === 'agent_select') {
    gameModeEl.classList.add('agent-select');
  } else {
    gameModeEl.classList.add('lobby');
  }
}

// Show/hide animations
window.api.onOverlayShow(async () => {
  overlay.classList.remove('hidden');
  const data = await window.api.getRankData();
  updateUI(data);
});

window.api.onOverlayHide(() => {
  overlay.classList.add('hidden');
});

// Receive pushed data updates
window.api.onRankData((data) => {
  updateUI(data);
});

// Ranked reminder alert
window.api.onAlert((alert) => {
  if (alert.show) {
    alertModeEl.textContent = alert.modeName;
    alertOverlay.classList.remove('hidden');
  } else {
    alertOverlay.classList.add('hidden');
  }
});
