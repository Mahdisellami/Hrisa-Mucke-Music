# Music Tool Backend (FastAPI)

FastAPI backend for the Music Tool app. Provides REST API endpoints for music data management, database population scripts, and audio file streaming.

## Folder Structure

```
backend/
├── Dockerfile             # Docker image for backend
├── main.py                # FastAPI app entrypoint
├── api/
│   └── endpoints.py       # API routes
├── models/
│   └── schemas.py         # Pydantic schemas
├── data/                  # Persistent data storage
├── root/                  # Scripts and initial database files
│   ├── populate_db.py
│   └── populate_data.py
├── utils/
│   └── file_ops.py        # File operations for music.json
├── utils.py               # Optional utility functions
└── requirements.txt       # Python dependencies
```

## Running Locally

1. **Create a virtual environment:**

```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
```

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Run the backend:**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Server will be available at `http://localhost:8000`.

## Running with Docker

A `docker-compose.yml` exists in the parent directory that starts the backend service along with other services.
The backend can also be built and run independently using the provided `Dockerfile`.

## API Endpoints

### Music Data

* **GET `/music`** — Returns all songs from `music.json` with full metadata including:
  - Track information (title, artist, album)
  - Source data (YouTube URL)
  - Destination paths
  - Checksums for change tracking

### Audio Streaming

* **GET `/audio/{file_path}`** — Streams MP3 audio files from the data directory.
  - Supports range requests for seeking
  - Returns proper Content-Type headers

### Database Population

Scripts can populate the database synchronously or asynchronously.

#### Synchronous (Blocking)

* **POST `/populate/db/sync`** — Runs `populate_db.py` and returns result.
* **POST `/populate/data/sync`** — Runs `populate_data.py` and returns result.

#### Asynchronous (Background)

* **POST `/populate/db/async`** — Runs `populate_db.py` in the background.
* **POST `/populate/data/async`** — Runs `populate_data.py` in the background.

> Scripts are expected to be in `/app/root/` inside the container.
> `music.json` is created automatically if it does not exist.

## Features

- **Checksum-based Change Detection**: Tracks modifications to track metadata, sources, and destinations
- **Smart Updates**: Detects what changed (info/source/destination) to avoid redundant downloads
- **Background Processing**: Run download scripts asynchronously without blocking API requests
- **Audio Streaming**: Efficient file serving with range request support
- **CORS Enabled**: Configured for cross-origin requests from mobile app

## Dependencies

Key Python packages (see `requirements.txt` for full list):
- **FastAPI** - Modern web framework
- **uvicorn** - ASGI server
- **pytubefix** - YouTube video/audio downloader
- **moviepy** - Audio extraction from video
- **mutagen** - ID3 metadata writing for MP3 files
- **pydantic** - Data validation and schemas