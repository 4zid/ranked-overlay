const btnToggle = document.getElementById('btnToggle');
const btnText = document.getElementById('btnText');
const btnIcon = document.getElementById('btnIcon');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const infoPanel = document.getElementById('infoPanel');
const infoRank = document.getElementById('infoRank');
const infoRR = document.getElementById('infoRR');
const infoMode = document.getElementById('infoMode');
const btnMinimize = document.getElementById('btnMinimize');
const btnClose = document.getElementById('btnClose');

let running = false;

btnToggle.addEventListener('click', async () => {
  if (running) {
    await window.control.stop();
  } else {
    await window.control.start();
  }
});

btnMinimize.addEventListener('click', () => window.control.minimize());
btnClose.addEventListener('click', () => window.control.closeToTray());

function setRunningState(isRunning) {
  running = isRunning;
  if (isRunning) {
    btnToggle.className = 'btn-main btn-stop';
    btnText.textContent = 'DETENER';
    btnIcon.innerHTML = '&#9632;';
    statusDot.classList.add('running');
    statusText.textContent = 'Ejecutando';
    infoPanel.classList.remove('hidden');
  } else {
    btnToggle.className = 'btn-main btn-start';
    btnText.textContent = 'INICIAR';
    btnIcon.innerHTML = '&#9654;';
    statusDot.classList.remove('running');
    statusText.textContent = 'Detenido';
    infoPanel.classList.add('hidden');
  }
}

window.control.onStateChange((state) => {
  setRunningState(state.running);
});

window.control.onRankUpdate((data) => {
  if (data.ok) {
    infoRank.textContent = data.rank;
    infoRank.style.color = data.rankColor;
    infoRR.textContent = data.rr;
    infoMode.textContent = data.gameMode;
  } else {
    infoRank.textContent = '--';
    infoRank.style.color = '#5a5a5a';
    infoRR.textContent = '--';
    infoMode.textContent = data.error || 'Error';
  }
});
