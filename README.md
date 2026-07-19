# Mathom

> **Your Local AI Memory House**

Mathom listens, remembers, organizes, and helps you rediscover conversations,
meetings, and ideas — all completely local. It transcribes voice recordings
with [faster-whisper](https://github.com/SYSTRAN/faster-whisper), summarizes
them with [Ollama](https://ollama.com), and shelves every recording as a
**Mathom** in your searchable **Mathom-house**. Your data never leaves your own
server.

*In Tolkien's Shire, a "mathom" is anything hobbits have no immediate use for
but are unwilling to throw away. Their mathoms went to the Mathom-house —
yours go here.*

## Features

- 🎙️ **Voice transcription** — faster-whisper, any common audio format, FFmpeg
  under the hood
- ✨ **AI summaries** — 12 editable prompt templates: TL;DR, Meeting Minutes,
  Action Items, Email Draft, GitHub/Jira Issue, CRM Entry, Calendar Events,
  Executive Brief, and more
- 💬 **Follow-up chat** — ask questions about any recording, grounded in its
  transcript
- 🔍 **Full-text search** — SQLite FTS5 across titles, transcripts, and
  summaries, with highlighted snippets
- 🏷️ **Tags, favorites, collections, archive, timeline** — a real archive, not
  a junk drawer
- 📤 **Exports** — Markdown, plain text, or JSON per Mathom
- 👥 **Optional multi-user + SSO** — off by default; enable
  [Authentik](https://goauthentik.io/) single sign-on for private per-user
  archives with Owner/Admin/User roles and Authentik-managed MFA
  ([docs](docs/authentication.md))
- 🏠 **Local-first** — no cloud, no telemetry; Ollama is never exposed
  publicly
- 🐳 **One Docker Compose stack** — CPU by default, optional NVIDIA GPU
  overlay, TrueNAS SCALE compatible

## Quick Start

Requirements: Docker with Compose v2. Optional: NVIDIA Container Toolkit for
GPU acceleration.

```bash
git clone https://github.com/MacNite/Mathom-House---Your-Local-AI-Memory-House.git
cd Mathom-House---Your-Local-AI-Memory-House
cp .env.example .env      # adjust if you like — defaults work
make up                   # CPU stack
make models               # pull the Ollama model (first run only)
```

Open **http://localhost:8080** and bring your first recording home.

GPU users: `make up-gpu` instead of `make up`.

## How It Works

```
Browser ──▶ proxy (nginx) ──▶ backend (FastAPI) ──▶ Ollama (internal only)
                 │                   │
             frontend            SQLite + audio
             (React)             (persistent volume)
```

Each upload becomes a Mathom and moves through
`pending → transcribing → summarizing → ready`. Everything about it — audio,
transcript, summaries, chat, tags, metadata — is stored locally in SQLite and
a persistent volume.

## Configuration

All settings live in `.env` (see [`.env.example`](.env.example)):

| Variable               | Default    | Purpose                                |
| ---------------------- | ---------- | -------------------------------------- |
| `MATHOM_PORT`          | `8080`     | Host port for the web UI               |
| `OLLAMA_MODEL`         | `llama3.2` | Model for summaries and chat           |
| `WHISPER_MODEL`        | `small`    | faster-whisper model size              |
| `WHISPER_DEVICE`       | `cpu`      | `cpu` or `cuda`                        |
| `WHISPER_COMPUTE_TYPE` | `int8`     | `int8` (CPU) / `float16` (GPU)         |
| `MAX_UPLOAD_MB`        | `200`      | Upload size limit per recording        |

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment (including TrueNAS SCALE)](docs/deployment.md)
- [Authentication & user management (Authentik SSO)](docs/authentication.md)
- [PWA & Android Share Target](docs/pwa.md)
- [API overview](docs/api.md)
- [Contributing](CONTRIBUTING.md) · [Security policy](SECURITY.md) ·
  [Changelog](CHANGELOG.md)
- [CLAUDE.md](CLAUDE.md) — project standards and conventions

## Development

```bash
make test       # backend pytest + frontend vitest
make lint       # ruff, mypy, eslint, tsc
./scripts/dev.sh  # run backend :8000 + frontend :5173 without Docker
```

## License

[MIT](LICENSE)
