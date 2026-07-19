# Deployment

## Any Docker host

```bash
cp .env.example .env
make up            # or: docker compose -f compose.yaml up -d --build
make models        # pulls the Ollama model configured in .env
```

The UI is served on `http://localhost:8080` (change the port with
`MATHOM_PORT`). By default the port is bound to **loopback only**
(`MATHOM_BIND=127.0.0.1`), because with authentication off (the default) there
is no login. To reach Mathom from other machines on your LAN, set
`MATHOM_BIND=0.0.0.0` — but only behind a VPN or an authenticating reverse
proxy, or with [Authentik SSO](authentication.md) enabled (see the exposure
warning below).

### NVIDIA GPU

Install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html), then:

```bash
make up-gpu        # compose.yaml + compose.gpu.yaml
```

This gives both Ollama and faster-whisper GPU access and switches whisper to
`cuda`/`float16` by default.

## TrueNAS SCALE

Mathom runs as a custom Docker Compose app on TrueNAS SCALE 24.04+
(Dragonfish and later ship Docker support; on older releases use the
*Custom App* YAML install).

1. Create datasets for persistent data, e.g.:
   - `tank/apps/mathom/data` (SQLite + audio)
   - `tank/apps/mathom/ollama` (LLM models)
   - `tank/apps/mathom/whisper` (whisper models)
2. In **Apps → Discover Apps → ⋮ → Install via YAML**, paste `compose.yaml`
   and replace the named volumes with host paths:

```yaml
    volumes:
      - /mnt/tank/apps/mathom/data:/data
      - /mnt/tank/apps/mathom/whisper:/models
# and on the ollama service:
      - /mnt/tank/apps/mathom/ollama:/root/.ollama
```

3. Set the environment values from `.env.example` in the YAML (TrueNAS does
   not read `.env` files), and remove the trailing top-level `volumes:` block
   if you replaced every named volume.
4. Deploy, then pull the model once:
   `docker exec -it <ollama-container> ollama pull llama3.2`

> The backend container runs as UID/GID 1000. Give the datasets matching
> ownership (or an ACL allowing 1000) so it can write.

## Backups

`make backup` (or `scripts/backup.sh`) creates `backups/mathom-<timestamp>/`
containing a consistent SQLite snapshot (via `sqlite3 .backup`) and the audio
directory. On TrueNAS, periodic dataset snapshots of the data path work too —
the database uses WAL mode, but the script's snapshot is the safest copy.

## Upgrades

```bash
git pull
docker compose -f compose.yaml up -d --build
```

Schema changes are additive and applied automatically at backend startup.

## Authentication

By default Mathom runs as a single-user local archive with **no login**. For
multi-user installs you can enable optional [Authentik](https://goauthentik.io/)
single sign-on — see [authentication.md](authentication.md) for the full setup,
roles, and environment variables.

## Exposure warning

With authentication **disabled** (the default), Mathom has no login. The
published port therefore binds to `127.0.0.1` by default, so a fresh install is
only reachable from the host. Widening that (`MATHOM_BIND=0.0.0.0`) puts an
unauthenticated archive on your network — do it only behind a VPN /
authenticating reverse proxy, and never port-forward it to the internet as-is.
If you need to expose it, enable [Authentik SSO](authentication.md) and always
serve it over HTTPS (`SESSION_COOKIE_SECURE=true`). See
[SECURITY.md](../SECURITY.md) and the [threat model](threat-model.md).
