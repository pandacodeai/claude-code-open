# Twitter / X Posts

---

## Main Announcement Thread

### Tweet 1 (Hook)

I open-sourced a full AI coding platform with Web IDE, multi-agent system, and 37+ tools.

It started as a @anthropic-ai/claude-code study project. Now it's something much bigger.

MIT licensed. Runs locally. Your data stays yours.

GitHub: github.com/kill136/axon

Thread 🧵

### Tweet 2 (Web IDE)

The Web IDE is not just a chat window.

- Monaco editor with file tree
- AI inline code review & test generation
- Terminal panel + Git integration
- Checkpoint/rewind for file snapshots

All in your browser. No VS Code extension needed.

### Tweet 3 (Multi-Agent)

The Blueprint system breaks complex tasks across multiple AI agents:

- Smart Planner analyzes requirements
- Lead Agent coordinates execution
- Workers run in parallel
- Swarm Console monitors everything in real-time

One requirement in → complete code out.

### Tweet 4 (Tools)

37+ built-in tools:

- File ops, ripgrep search, shell
- Browser automation (Playwright)
- Database client (PG, MySQL, SQLite, Redis, Mongo)
- DAP debugger + LSP
- Scheduled task daemon
- Self-evolution (AI modifies its own code)

### Tweet 5 (Getting Started)

Get started in 60 seconds:

```
git clone github.com/kill136/axon
cd axon && npm install
npm run web
```

Open localhost:3456 → done.

One-click installers for Windows/macOS/Linux too.

Live demo: voicegpt.site:3456
Discord: discord.gg/bNyJKk6PVZ

---

## Standalone Tweets (for different days)

### Standalone 1 — Self Evolution

Wild feature: the AI in Axon can modify its own source code.

It edits TypeScript files → runs tsc type check → hot-reloads the server.

All with audit logging and dry-run preview.

github.com/kill136/axon

### Standalone 2 — Scheduled Tasks

"Every morning at 9am, review yesterday's commits and notify me on Feishu."

The scheduled task daemon in Axon supports:
- Natural language time config
- File watching triggers
- Desktop + Feishu notifications
- SQLite persistence

### Standalone 3 — Database Tool

Axon has a built-in database client.

Connect to PostgreSQL, MySQL, SQLite, Redis, or MongoDB right from the AI conversation.

Query data, describe tables, explore schemas — all through natural language.

github.com/kill136/axon
