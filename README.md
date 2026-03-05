# Ranked Overlay

A lightweight Windows desktop overlay for Valorant that displays your current **rank**, **RR (Rating)**, and **game mode** in real-time. Toggle it on and off with a keyboard shortcut while you play.

![Electron](https://img.shields.io/badge/Electron-40-47848F?logo=electron&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

---

## Features

- **Keyboard shortcut** — Press `Alt+Shift+T` to toggle the overlay on/off
- **Always-on-top overlay** — Transparent, click-through, doesn't interfere with gameplay
- **Real-time rank data** — Shows your competitive tier (Iron → Radiant) with RR points
- **Game mode detection** — Displays current queue (Competitive, Deathmatch, Spike Rush, etc.)
- **Status indicators** — Green dot = in game, yellow = agent select, gray = lobby
- **Control panel** — Start/Stop UI with live data preview
- **System tray** — Minimizes to tray, runs in background
- **Auto-refresh** — Updates every 30 seconds while visible
- **Ranked reminder** — Optional alert when you queue unrated instead of competitive
- **No API keys needed** — Reads directly from the local Riot Client
- **Portable .exe** — Single file, no installation required

## Screenshots

### Control Panel
```
┌─────────────────────────────┐
│  RANKED OVERLAY         _ X │
│                             │
│  ● Ejecutando               │
│                             │
│  RANGO        Diamond 2     │
│  RR           67             │
│  MODO         Competitivo   │
│                             │
│  [■ DETENER]                │
│                             │
│  Alt + Shift + T  para overlay    │
└─────────────────────────────┘
```

### In-Game Overlay
```
┌──────────────────────┐
│ V  RANKED            │
│                      │
│ DIAMOND 2    RR 67   │
│              ████░░  │
│ ─────────────────    │
│ MODO   ● Competitivo │
└──────────────────────┘
```

## Requirements

- **Windows 10/11** (x64)
- **Valorant** must be running (the app reads from the local Riot Client API)
- No Riot API key or external account needed

## Quick Start (Portable .exe)

1. Download `RankedOverlay.exe` from [Releases](../../releases)
2. Double-click to run
3. Click **INICIAR** in the control panel
4. Press `Alt+Shift+T` in-game to show/hide the overlay

> **Note:** Windows SmartScreen may show a warning since the app is unsigned. Click "More info" → "Run anyway".

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)

### Install & Run

```bash
git clone https://github.com/4zid/ranked-overlay.git
cd ranked-overlay
npm install
npm start
```

### Build Portable .exe

```bash
npm run build
```

Output: `dist/RankedOverlay.exe` (~84 MB)

## Project Structure

```
ranked-overlay/
├── main.js                    # Electron main process, tray, shortcuts
├── preload.js                 # IPC bridge for overlay window
├── preload-control.js         # IPC bridge for control window
├── package.json
├── assets/
│   └── icon.png               # App icon
└── src/
    ├── control/               # Control panel UI (Start/Stop)
    │   ├── index.html
    │   ├── style.css
    │   └── control.js
    ├── renderer/              # Overlay UI
    │   ├── index.html
    │   ├── style.css
    │   └── renderer.js
    └── valorant/
        ├── lockfile.js        # Reads Riot Client lockfile
        ├── api.js             # Auth + rank/game mode API calls
        └── constants.js       # Rank tiers, queues, shards mapping
```

## How It Works

The app uses Valorant's **local client API** — no external API keys or accounts needed.

```
┌──────────────┐     ┌────────────────┐     ┌───────────────────┐
│  Riot Client │────▶│  Lockfile      │────▶│  Local Auth       │
│  (running)   │     │  port+password │     │  127.0.0.1:{port} │
└──────────────┘     └────────────────┘     └─────────┬─────────┘
                                                      │
                                    accessToken + entitlementsToken
                                                      │
                          ┌───────────────────────────┤
                          ▼                           ▼
                ┌──────────────────┐      ┌──────────────────────┐
                │ pd.{shard}       │      │ glz-{region}         │
                │ .a.pvp.net       │      │ .{shard}.a.pvp.net   │
                │                  │      │                      │
                │ /mmr/v1/players  │      │ /core-game/v1/players│
                │ → Rank + RR      │      │ → Game mode          │
                └──────────────────┘      └──────────────────────┘
```

1. **Lockfile** — Reads `%LOCALAPPDATA%\Riot Games\Riot Client\Config\lockfile` to get the local port and password
2. **Authentication** — Uses Basic Auth (`riot:{password}`) to get access tokens from `https://127.0.0.1:{port}/entitlements/v1/token`
3. **Shard detection** — Parses `ShooterGame.log` to determine your shard (NA, EU, AP, KR)
4. **Rank data** — Fetches MMR from `pd.{shard}.a.pvp.net`
5. **Game mode** — Checks core-game and pregame GLZ endpoints

## Supported Ranks

| Tier | Ranks |
|------|-------|
| Iron | Iron 1, Iron 2, Iron 3 |
| Bronze | Bronze 1, Bronze 2, Bronze 3 |
| Silver | Silver 1, Silver 2, Silver 3 |
| Gold | Gold 1, Gold 2, Gold 3 |
| Platinum | Platinum 1, Platinum 2, Platinum 3 |
| Diamond | Diamond 1, Diamond 2, Diamond 3 |
| Ascendant | Ascendant 1, Ascendant 2, Ascendant 3 |
| Immortal | Immortal 1, Immortal 2, Immortal 3 |
| Radiant | Radiant |

## Supported Game Modes

Competitive, Unrated, Spike Rush, Deathmatch, Escalation, Replication, Swiftplay, Team Deathmatch, Premier

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Shortcut | `Alt+Shift+T` | Toggle overlay visibility |
| Ranked Reminder | Off | Alert when queueing unrated instead of competitive |
| Position | Top-right | Overlay screen position |
| Refresh | 30s | Auto-update interval |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Valorant no está corriendo" | Make sure the Riot Client and Valorant are open |
| Overlay doesn't appear | Press `Alt+Shift+T` — make sure you clicked INICIAR first |
| Wrong rank shown | Restart the app to refresh authentication tokens |
| SmartScreen warning | Click "More info" → "Run anyway" (app is unsigned) |
| Shortcut conflict | Close other apps using `Alt+Shift+T` |

## Tech Stack

- **[Electron](https://www.electronjs.org/)** — Desktop app framework
- **[electron-builder](https://www.electron.build/)** — Packaging & distribution
- **Node.js `https`** — API calls (no external dependencies)
- **Valorant Local API** — [Documentation](https://github.com/techchrism/valorant-api-docs)

## License

ISC

## Disclaimer

This project is not affiliated with or endorsed by Riot Games. Valorant is a trademark of Riot Games. Use at your own risk — the local API is unofficial and may change without notice.
