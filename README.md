# Football Match Broadcast

A lightweight, self-hosted broadcast graphics system for live football matches — built in plain PHP, JavaScript, and CSS. It gives you a **control panel** to run a match in real time (score, clock, fouls, formations, cards, substitutions, VAR checks, etc.) and a **TV overlay page** that displays the live graphics, styled like a real broadcast.

This started as a project for a school football tournament — as one of the organisers, I wanted the matches to feel more professional and engaging, so I built this to run the on-screen graphics myself.

**Live demo:** [logos-football-match.rf.gd](https://logos-football-match.rf.gd)

## Features

- **Live match control panel** (`control.php`) — password-protected dashboard for the operator
  - Editable team names, live score (+1 / -1), and match clock (start/stop/reset) with added time
  - Home/away fouls and possession tracking
  - Formation selector (4-3-3, 4-4-2, 3-5-2, 5-4-1) with a visual pitch/lineup renderer
  - Add players to each squad on the fly
- **On-screen graphics / overlays**, triggered from the control panel and shown on the TV page:
  - Goal graphic (scorer + assist)
  - Card graphic (yellow/red, with player)
  - Substitution graphic (player in/out)
  - VAR check (in progress / verdict)
  - Possession bar, foul count, formations/lineups, goal history, league table
  - Offside, advantage, penalty call, handball, replay, penalty overlays
- **TV broadcast page** (`index.php`) — clean full-screen scoreboard and graphics feed meant to be captured/streamed (e.g. via OBS) as a lower-third/overlay source
- **Persistent match state** — the control panel and TV page stay in sync through `state.json`, updated via `save_state.php`
- **User authentication** — login system backed by MySQL (`db.php`, `login.php`, `auth_lock.php`) with login attempt logging
- **Custom error pages** — `403.html`, `404.html`, `500.html`

## Tech stack

- **Backend:** PHP + MySQLi
- **Frontend:** Vanilla JavaScript, HTML, CSS
- **Storage:** JSON files for live match state (`state.json`, `players.json`, `standings.json`)

## Project structure

```
├── index.php              # Public TV/broadcast overlay page
├── control.php            # Password-protected control panel (operator UI)
├── control.css            # Styles for the control panel
├── tv.css                 # Styles for the broadcast overlay
├── script.js               # Shared client logic: state sync, overlays, timers, pitch rendering
├── login.php               # Login page & auth logic
├── logout.php              # Session logout
├── dashboard.php           # Example protected page
├── auth_lock.php           # Guard included by protected pages
├── db.php                   # MySQL connection config
├── save_state.php          # Endpoint that persists match state to state.json
├── logger.php               # Request/visitor logging
├── state.json                # Current live match state (score, clock, overlays, players, table)
├── players.json              # Default squad lists
├── standings.json            # League table data
├── 403.html / 404.html / 500.html  # Custom error pages
└── .htaccess                 # Blocks access to logs & sensitive files, wires error pages
```

## How it works

1. The **operator** logs in and opens `control.php`.
2. Actions in the control panel (score changes, starting the clock, triggering a goal/card/sub graphic, etc.) update a shared state object client-side and POST it to `save_state.php`, which writes it to `state.json`.
3. The **TV page** (`index.php`) syncs from the same state via `script.js` and renders the corresponding overlay — score bug, goal graphic, lineups, table, etc.
4. Capture the TV page in a browser source (OBS, vMix, etc.) to overlay the graphics on your stream or feed.

## Setup

1. Deploy the files to a PHP-enabled web host (this project was built and tested on [InfinityFree](https://infinityfree.com/)).
2. Create a MySQL database with a `users` table (`id`, `username`, `password` — hashed with `password_hash()`), and update the credentials in `db.php`.
3. Make sure `state.json`, `players.json`, `standings.json`, and `login.log` are writable by PHP.
4. Visit `login.php` to sign in, then use `control.php` to run the match.
5. Add `index.php` as a browser source in your streaming software to display the live graphics.

## License

MIT © [CleanBlueBandit](https://github.com/CleanBlueBandit) — see [LICENSE](LICENSE) for details.
