#!/usr/bin/env bash
set -euo pipefail

if ! command -v npm >/dev/null 2>&1; then
  echo 'npm not found. Installing Node.js 20...'
  if ! command -v curl >/dev/null 2>&1; then
    echo 'curl not found. Installing curl...'
    apt-get update
    apt-get install -y curl
  fi
  export DEBIAN_FRONTEND=noninteractive
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get update
  apt-get install -y nodejs
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}/portfolio"

echo 'Installing dependencies...'
npm install --production

echo 'Building app...'
npm run build

PORT_VALUE="${PORT:-4173}"
echo "Starting preview server on port ${PORT_VALUE}..."
npm run preview -- --host 0.0.0.0 --port "${PORT_VALUE}"
