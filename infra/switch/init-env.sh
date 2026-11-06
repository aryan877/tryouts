#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
if [ -e .env ]; then
  echo ".env already exists; leaving it alone." >&2
  exit 0
fi

secret() { openssl rand -hex 24; }

cat > .env <<EOF
SWITCH_VERSION=0.31.0
DB_NAME=switch
DB_USER=switch_app
DB_PASSWORD=$(secret)
DB_OWNER_USER=postgres
DB_OWNER_PASSWORD=$(secret)
AGENT_REGISTRATION_TOKEN=$(secret)
SECRET_KEYS=local:$(openssl rand -hex 32)
CONTROLLER_TOKEN_SECRET=$(openssl rand -hex 32)
GATEWAY_ADMIN_EMAIL=admin@tryouts.local
GATEWAY_ADMIN_PASSWORD=$(secret)
MATTERMOST_ADMIN_USER=admin
MATTERMOST_ADMIN_PASSWORD=Mm-$(secret)
MATTERMOST_TEAM_NAME=tryouts
MATTERMOST_USER=ops
MATTERMOST_USER_PASSWORD=Mm-$(secret)
EOF
echo "Wrote infra/switch/.env"
