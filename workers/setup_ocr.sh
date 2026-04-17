#!/usr/bin/env bash
# One-command OCR environment setup for The Arc Woman
# Run once from the project root: bash workers/setup_ocr.sh
set -euo pipefail

echo "==> Installing system dependencies (Tesseract + Poppler)..."
if command -v brew &>/dev/null; then
  brew install tesseract poppler
elif command -v apt-get &>/dev/null; then
  sudo apt-get update -qq
  sudo apt-get install -y tesseract-ocr tesseract-ocr-eng poppler-utils libgl1
else
  echo "ERROR: Unsupported OS. Install tesseract + poppler manually." >&2
  exit 1
fi

echo "==> Installing Python packages..."
# Use Homebrew Python 3.10 if available (macOS system python3 is 3.9 and uses a separate site-packages)
if command -v python3.10 &>/dev/null; then
  python3.10 -m pip install -r workers/requirements.txt
else
  pip3 install -r workers/requirements.txt
fi

echo "==> Verifying Tesseract..."
tesseract --version

echo "==> Verifying pytesseract..."
python3 -c "import pytesseract; print('pytesseract OK:', pytesseract.get_tesseract_version())"

echo "==> All done. Run the OCR worker with:"
echo "    python3 workers/ocr_processor.py <document_id>"
