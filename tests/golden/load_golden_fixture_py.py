import json
from pathlib import Path

_GOLDEN_DIR = Path(__file__).resolve().parent
FIXTURES_DIR = _GOLDEN_DIR / "fixtures"


def load_golden_fixture(name: str):
    path = FIXTURES_DIR / f"{name}.json"
    if not path.exists():
        raise FileNotFoundError(f"Golden fixture not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))

