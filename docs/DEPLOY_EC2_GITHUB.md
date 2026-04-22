# Deploy to EC2 from GitHub (master only)

After a **push to `master`** (including PR merge into `master`), [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs **CI** (typecheck, lint, test, build), then **Deploy to EC2** if the following secrets are set in the repository.

## GitHub secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Example | Description |
|--------|---------|-------------|
| `EC2_HOST` | `16.170.212.41` | Public IP or DNS of the instance |
| `EC2_USER` | `ubuntu` | SSH login user (Amazon Linux: `ec2-user`) |
| `EC2_SSH_KEY` | *(PEM contents)* | Private key matching a public key in `~/.ssh/authorized_keys` on the instance |
| `EC2_APP_DIR` | `/home/ubuntu/wikinTich` | Absolute path to the **git clone** of this repo on the server |

Optional: custom SSH port — add a `port:` line to the `appleboy/ssh-action` step in the workflow (default is 22).

## One-time setup on the EC2 instance

1. Install **Git**, **Docker**, and **Docker Compose v2** (`docker compose`).
2. **Clone** this repository (same URL GitHub Actions uses) into `EC2_APP_DIR`.
3. Create **`.env`** (and/or `.env.local`) next to `docker-compose.yml` with `NEXT_PUBLIC_*`, `SUPABASE_*`, `CSRF_SECRET`, `SESSION_SECRET`, etc., as in [`.env.example`](../.env.example). The deploy step does **not** copy env from GitHub; the server files are the source of truth for production secrets.
4. **Security group (inbound):** allow **HTTP (80)** from the internet (e.g. `0.0.0.0/0`) for the site. **Do not** expose host port **3000** — the app listens only on the Docker network; **Caddy** serves **:80** and proxies to the app. **Port 443** in AWS is optional until you add a **domain** and enable TLS in [`Caddyfile`](../Caddyfile). Restrict **SSH (22)** to your IP when possible. GitHub Actions has no fixed public IP; use a self-hosted runner, SSM, or keep 22 open with key-only auth if you use automated SSH deploys.
5. **CORS:** Set `PRODUCTION_URL=http://<public-ip>` or `ADDITIONAL_ALLOWED_ORIGINS` in the server `.env` so `lib/cors-config.ts` allows the browser `Origin` for `http://<ip>` (port 80 default, no port in the URL). See [`.env.example`](../.env.example).

## What the deploy step does

1. SSH to the instance.
2. `export GIT_SHA=<current commit sha>` (for Docker build args).
3. `cd EC2_APP_DIR` → `git fetch` + `git reset --hard origin/master` (server matches `origin/master` exactly).
4. `docker compose up -d --build`.

## Skipping deploy

- Do **not** set the four secrets until the server is ready; the deploy job will **fail** on every `master` push. Either add secrets when ready, or temporarily comment out the `deploy-ec2` job in the workflow.
- Pushes to **`dev`** do not run the deploy job (only `master`).
