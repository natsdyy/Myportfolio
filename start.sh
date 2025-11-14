#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}/portfolio"

echo "Installing dependencies..."
npm install

echo "Building app..."
npm run build

PORT_VALUE="${PORT:-4173}"
echo "Starting preview server on port ${PORT_VALUE}..."
npm run preview -- --host 0.0.0.0 --port "${PORT_VALUE}"