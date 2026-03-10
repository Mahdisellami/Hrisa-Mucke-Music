import json
from pathlib import Path

# backend_root points to /app/backend
BACKEND_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = BACKEND_ROOT / "root/music.json"

def read_data():
    if not DB_PATH.exists() or DB_PATH.stat().st_size == 0:
        return []  # return empty list if missing or empty
    with open(DB_PATH, "r") as f:
        return json.load(f)

def write_data(data):
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(DB_PATH, "w") as f:
        json.dump(data, f, indent=4)
