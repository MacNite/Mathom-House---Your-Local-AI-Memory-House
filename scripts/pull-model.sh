#!/usr/bin/env bash
# Pull the configured Ollama model inside the running stack.
set -euo pipefail

cd "$(dirname "$0")/.."

dotenv_value() {
  local key="$1"
  [[ -f .env ]] || return 0
  sed -n "s/^${key}=//p" .env | tail -1
}

MODEL="${OLLAMA_MODEL:-$(dotenv_value OLLAMA_MODEL)}"
MODEL="${MODEL:-llama3.2}"

echo "Pulling Ollama model: $MODEL"
docker compose -f compose.yaml exec ollama ollama pull "$MODEL"
echo "Done. Mathom will use $MODEL for summaries and chat."

VISION_ENABLED="${MATHOM_VISION_ENABLED:-$(dotenv_value MATHOM_VISION_ENABLED)}"
if [[ "${VISION_ENABLED,,}" =~ ^(1|true|yes|on)$ ]]; then
  VISION_MODEL="${MATHOM_VISION_MODEL:-$(dotenv_value MATHOM_VISION_MODEL)}"
  VISION_MODEL="${VISION_MODEL:-gemma3:4b}"
  echo "Pulling vision model: $VISION_MODEL"
  docker compose -f compose.yaml exec ollama ollama pull "$VISION_MODEL"
  echo "Done. Mathom will use $VISION_MODEL for visual analysis."
fi
