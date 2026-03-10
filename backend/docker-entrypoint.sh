#!/bin/bash
set -e

echo "================================"
echo "Music Tool Backend - Starting..."
echo "================================"

# Check if music.json exists
if [ ! -f "/app/root/music.json" ]; then
    echo "📦 No music.json found. Running initial setup..."
    echo ""

    # Run populate_db.py to create music.json
    echo "1️⃣ Creating database (music.json)..."
    cd /app/root && python3 populate_db.py
    echo "✅ Database created!"
    echo ""

    # Run populate_data.py to download MP3s
    echo "2️⃣ Downloading MP3 files (this may take a while)..."
    cd /app/root && python3 populate_data.py
    echo "✅ MP3s downloaded!"
    echo ""
else
    echo "✅ music.json already exists, skipping initial setup"
    echo ""
fi

echo "🚀 Starting FastAPI server on http://0.0.0.0:8000"
echo "================================"
echo ""

# Start FastAPI server
cd /app
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
