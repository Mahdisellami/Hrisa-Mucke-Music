from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from fastapi.responses import FileResponse
from utils.file_ops import read_data, write_data
from models.schemas import Song
from utils.database import get_db
from sqlalchemy.orm import Session
from models.db_models import Song as DBSong
import subprocess
from pathlib import Path
from pytubefix import YouTube, Search

router = APIRouter()

@router.get("/music")
def get_music(db: Session = Depends(get_db)):
    """Get all songs from database with IDs"""
    try:
        songs = db.query(DBSong).all()

        result = []
        for song in songs:
            result.append({
                "id": song.id,
                "title": song.title,
                "artist": song.artist,
                "album": song.album,
                "duration": song.duration,
                "audioUrl": f"/audio/{song.file_path}",
                "file_path": song.file_path,
                "youtube_url": song.youtube_url,
            })

        return result
    except Exception as e:
        # Fallback to old music.json format if database not initialized
        print(f"Database error, falling back to music.json: {e}")
        return read_data()


@router.get("/audio/{file_path:path}")
def get_audio(file_path: str):
    """Serve MP3 files from the data directory"""
    audio_path = Path(f"/app/{file_path}")

    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    if not audio_path.suffix.lower() == ".mp3":
        raise HTTPException(status_code=400, detail="Only MP3 files are supported")

    return FileResponse(
        path=str(audio_path),
        media_type="audio/mpeg",
        filename=audio_path.name
    )


@router.get("/lyrics/{file_path:path}")
def get_lyrics(file_path: str):
    """Serve lyrics files (.txt or .lrc) from the data directory"""
    lyrics_path = Path(f"/app/{file_path}")

    if not lyrics_path.exists():
        raise HTTPException(status_code=404, detail="Lyrics file not found")

    suffix = lyrics_path.suffix.lower()
    if suffix not in [".txt", ".lrc"]:
        raise HTTPException(status_code=400, detail="Only .txt and .lrc files are supported")

    # Determine media type
    media_type = "text/plain" if suffix == ".txt" else "application/x-lrc"

    return FileResponse(
        path=str(lyrics_path),
        media_type=media_type,
        filename=lyrics_path.name
    )


@router.post("/populate/db/sync")
def populate_db():
    script_path = Path("/app/root/populate_db.py")

    if not script_path.exists():
        return {"error": "Script not found"}

    try:
        result = subprocess.run(
            ["python", str(script_path)],
            cwd="/app/root",
            capture_output=True,
            text=True,
            check=True
        )
        return {"stdout": result.stdout, "stderr": result.stderr}
    except subprocess.CalledProcessError as e:
        return {"error": str(e), "stdout": e.stdout, "stderr": e.stderr}


@router.post("/populate/db/async")
def populate_db_bg(background_tasks: BackgroundTasks):
    script_path = Path("/app/root/populate_db.py")

    if not script_path.exists():
        return {"error": "Script not found"}

    # Run asynchronously in background
    def run():
        subprocess.run(
            ["python", str(script_path)],
            cwd="/app/root",
            capture_output=True,
            text=True,
            check=True
        )

    background_tasks.add_task(run)
    return {"status": f"populate_db.py is running in background"}


@router.post("/populate/data/sync")
def populate_data():
    script_path = Path("/app/root/populate_data.py")

    if not script_path.exists():
        return {"error": "Script not found"}

    try:
        result = subprocess.run(
            ["python", str(script_path)],
            cwd="/app/root",
            capture_output=True,
            text=True,
            check=True
        )
        return {"stdout": result.stdout, "stderr": result.stderr}
    except subprocess.CalledProcessError as e:
        return {"error": str(e), "stdout": e.stdout, "stderr": e.stderr}


@router.post("/populate/data/async")
def populate_data_bg(background_tasks: BackgroundTasks):
    script_path = Path("/app/root/populate_data.py")

    if not script_path.exists():
        return {"error": "Script not found"}

    # Run asynchronously in background
    def run():
        subprocess.run(
            ["python", str(script_path)],
            cwd="/app/root",
            capture_output=True,
            text=True,
            check=True
        )

    background_tasks.add_task(run)
    return {"status": f"populate_data.py is running in background"}


@router.post("/add-song")
def add_song_from_youtube(url: str, title: str, artist: str, playlist: str = "music", album: str = None):
    """Add a new song from YouTube URL"""
    try:
        # Read populate_db.py
        populate_db_path = Path("/app/root/populate_db.py")

        if not populate_db_path.exists():
            return {"success": False, "error": "populate_db.py not found"}

        with open(populate_db_path, 'r') as f:
            content = f.read()

        # Find the track_li array
        import re
        track_li_match = re.search(r'track_li = \[(.*?)\]', content, re.DOTALL)

        if not track_li_match:
            return {"success": False, "error": "Could not find track_li in populate_db.py"}

        # Escape single quotes and backslashes in strings to prevent syntax errors
        def escape_quotes(s):
            if not s:
                return s
            # First escape backslashes, then escape single quotes
            return s.replace("\\", "\\\\").replace("'", "\\'")

        title_escaped = escape_quotes(title)
        artist_escaped = escape_quotes(artist)

        # Create new track entry
        if album:
            album_escaped = escape_quotes(album)
            new_track = f"\n    {{'playlist' : '{playlist}',   'u': '{url}', 't': '{title_escaped}'                    , 'a' : '{artist_escaped}', 'al' : '{album_escaped}'}},"
        else:
            new_track = f"\n    {{'playlist' : '{playlist}',   'u': '{url}', 't': '{title_escaped}'                    , 'a' : '{artist_escaped}'}},"

        # Insert before the closing bracket
        track_li_end = track_li_match.end() - 1  # Position before ]
        new_content = content[:track_li_end] + new_track + content[track_li_end:]

        # Write back
        with open(populate_db_path, 'w') as f:
            f.write(new_content)

        # Run populate_db.py to add to database
        result = subprocess.run(
            ["python", str(populate_db_path)],
            cwd="/app/root",
            capture_output=True,
            text=True,
            check=True
        )

        return {
            "success": True,
            "message": f"Added '{title}' by {artist} to {playlist} playlist",
            "output": result.stdout
        }

    except subprocess.CalledProcessError as e:
        error_msg = f"Failed to run populate_db.py: {e.stderr if e.stderr else str(e)}"
        return {
            "success": False,
            "error": error_msg,
            "output": e.stderr,
            "stdout": e.stdout
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@router.get("/search-youtube")
def search_youtube(query: str, max_results: int = 10):
    """Search YouTube for songs"""
    try:
        search = Search(query)
        results = []

        for video in search.results[:max_results]:
            try:
                # Extract metadata
                results.append({
                    "videoId": video.video_id,
                    "title": video.title,
                    "author": video.author,
                    "duration": video.length,
                    "thumbnail": video.thumbnail_url,
                    "url": f"https://youtu.be/{video.video_id}",
                    "views": video.views,
                })
            except Exception as e:
                print(f"Error processing video: {e}")
                continue

        return {
            "success": True,
            "results": results,
            "count": len(results)
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "results": []
        }


@router.delete("/song/{song_index}")
def delete_song(song_index: int, delete_file: bool = False):
    """Delete a song from the database and optionally delete the MP3 file"""
    try:
        # Read current data
        data = read_data()

        if song_index < 0 or song_index >= len(data):
            raise HTTPException(status_code=404, detail="Song not found")

        song = data[song_index]

        # Get file paths if we need to delete the file
        if delete_file and 'data' in song:
            dest = song['data'].get('dest', {}).get('data', {})
            path = dest.get('path', '')
            filename = dest.get('filename', '')

            if path and filename:
                # Delete MP3
                mp3_path = Path(f"/app/{path}{filename}.mp3")
                if mp3_path.exists():
                    mp3_path.unlink()

                # Delete lyrics files if they exist
                lrc_path = Path(f"/app/{path}{filename}.lrc")
                if lrc_path.exists():
                    lrc_path.unlink()

                txt_path = Path(f"/app/{path}{filename}.txt")
                if txt_path.exists():
                    txt_path.unlink()

        # Remove from data
        deleted_song = data.pop(song_index)

        # Write back to database
        write_data(data)

        return {
            "success": True,
            "message": f"Deleted song: {deleted_song.get('data', {}).get('info', {}).get('data', {}).get('title', 'Unknown')}",
            "deleted_files": delete_file
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/song/{song_index}")
def update_song_metadata(song_index: int, title: str = None, artist: str = None, album: str = None):
    """Update song metadata in the database"""
    try:
        # Read current data
        data = read_data()

        if song_index < 0 or song_index >= len(data):
            raise HTTPException(status_code=404, detail="Song not found")

        song = data[song_index]

        # Update metadata
        if 'data' not in song:
            song['data'] = {}
        if 'info' not in song['data']:
            song['data']['info'] = {'data': {}}
        if 'data' not in song['data']['info']:
            song['data']['info']['data'] = {}

        info = song['data']['info']['data']

        if title is not None:
            info['title'] = title
        if artist is not None:
            info['artist'] = artist
        if album is not None:
            info['album'] = album

        # Write back to database
        write_data(data)

        return {
            "success": True,
            "message": "Song metadata updated successfully",
            "updated": {
                "title": info.get('title'),
                "artist": info.get('artist'),
                "album": info.get('album')
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))