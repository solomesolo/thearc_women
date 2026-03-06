#!/usr/bin/env python3
"""
Read engine input JSON from stdin; run engine; print engine output JSON to stdout.
Used by GET /api/dashboard to compute results from saved survey data.
"""
import json
import sys

# Run from repo root with PYTHONPATH=. so engine and tests are importable
from engine.config import DEFAULT_CONFIG
from engine.run import run_engine
from engine.serialize import engine_output_to_dict
from tests.golden.helpers import engine_input_from_fixture


def main() -> None:
    try:
        raw = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        sys.stderr.write(f"Invalid JSON: {e}\n")
        sys.exit(2)
    try:
        inp = engine_input_from_fixture(raw)
        out = run_engine(inp, DEFAULT_CONFIG)
        d = engine_output_to_dict(out)
        json.dump(d, sys.stdout, separators=(",", ":"), default=str)
    except Exception as e:
        sys.stderr.write(f"Engine run failed: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
