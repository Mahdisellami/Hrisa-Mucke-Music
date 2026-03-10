import os
import json
import shutil
import sys

from pytubefix import YouTube
from pytubefix.cli import on_progress
import moviepy

#from mutagen.id3 import ID3 # doc: https://id3.org/id3v2.4.0-frames
from mutagen.id3 import ID3, TPE1, TALB

# Import lyrics fetcher
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'utils'))
from lyrics_fetcher import fetch_lyrics_for_track

def download_from_youtube(url : str, filename : str, dest_path : str):
    # download the mp4 file from YouTube
    yt = YouTube(url, on_progress_callback = on_progress)
    ys = yt.streams.get_highest_resolution()
    temp_mp4 = "download.mp4"
    ys.download(filename = temp_mp4)
    # load the mp4 file
    video = moviepy.VideoFileClip(temp_mp4)
    # extract the audio from video
    video.audio.write_audiofile(dest_path + filename + ".mp3")
    # delete the mp4 file
    if os.path.exists(temp_mp4): os.remove(temp_mp4)

    # Return thumbnail URL
    return yt.thumbnail_url

def edit_metadata(file : str, artist = None, album = None):
    # doc:
    # * https://id3.org/id3v2.4.0-frames
    # * https://mutagen.readthedocs.io/en/latest/user/id3.html
    audio = ID3(file)
    change = False
    if artist != None and type(artist) == str:
        audio.add(TPE1(encoding=3, text=artist))
        change = True
    if album != None and type(album) == str:
        audio.add(TALB(encoding=3, text=album))
        change = True
    if change: audio.save()

    # import mutagen
    # print(mutagen.File(file))

# load database
database_file = "music.json"
with open(database_file) as file:
    db = json.loads(file.read())

# Track which URLs have been downloaded to avoid re-downloading
downloaded_urls = {}
successful_downloads = 0
failed_downloads = 0
copied_files = 0
skipped_existing = 0
lyrics_fetched = 0
lyrics_failed = 0

# download missing mp3 files
print(f"\n{'='*60}")
print(f"Starting to process {len(db)} tracks...")
print(f"{'='*60}\n")

for track in db:
    try:
        # create the playlist folder if it doesn't exist yet
        path_to_playlist_folder = track["data"]["dest"]["data"]["path"]
        if not os.path.exists(path_to_playlist_folder):
            os.makedirs(path_to_playlist_folder)

        path_to_mp3_file = track["data"]["dest"]["data"]["path"] + track["data"]["dest"]["data"]["filename"] + '.mp3'
        url = track["data"]["src"]["data"]["url"]
        title = track["data"]["info"]["data"]["title"]

        # Check if file exists or if we've already downloaded this URL
        thumbnail_url = None
        if not os.path.exists(path_to_mp3_file):
            if url in downloaded_urls:
                # Copy from the already downloaded location
                source_file, thumbnail = downloaded_urls[url]
                print(f"✓ Copying '{title}' from {source_file}")
                shutil.copy2(source_file, path_to_mp3_file)
                thumbnail_url = thumbnail
                copied_files += 1
            else:
                # download track
                print(f"↓ Downloading '{title}' from {url}")
                try:
                    thumbnail_url = download_from_youtube(
                        url         = url,
                        filename    = track["data"]["dest"]["data"]["filename"],
                        dest_path   = track["data"]["dest"]["data"]["path"]
                    )
                    # Track this URL as downloaded along with thumbnail
                    downloaded_urls[url] = (path_to_mp3_file, thumbnail_url)
                    print(f"✓ Downloaded '{title}' successfully")
                    print(f"  Thumbnail: {thumbnail_url}")
                    successful_downloads += 1
                except Exception as download_error:
                    print(f"✗ Failed to download '{title}': {str(download_error)}")
                    print(f"  Skipping this track and continuing...")
                    failed_downloads += 1
                    continue
        else:
            # File already exists, track it
            print(f"✓ '{title}' already exists, skipping download")
            skipped_existing += 1
            # Try to get thumbnail even for existing files
            if url not in downloaded_urls:
                try:
                    from pytubefix import YouTube
                    yt = YouTube(url)
                    thumbnail_url = yt.thumbnail_url
                    downloaded_urls[url] = (path_to_mp3_file, thumbnail_url)
                    print(f"  Fetched thumbnail: {thumbnail_url}")
                except Exception as e:
                    print(f"  Could not fetch thumbnail: {str(e)}")
                    downloaded_urls[url] = (path_to_mp3_file, None)

        # Update metadata if file exists
        if os.path.exists(path_to_mp3_file):
            try:
                edit_metadata(
                    file    = path_to_mp3_file,
                    artist  = track["data"]["info"]["data"]["artist"],
                    album   = track["data"]["info"]["data"]["album"]
                )
            except Exception as metadata_error:
                print(f"✗ Failed to update metadata for '{title}': {str(metadata_error)}")

        # Store thumbnail URL in music.json if we have one
        if thumbnail_url and "thumbnail" not in track["data"]["info"]["data"]:
            track["data"]["info"]["data"]["thumbnail"] = thumbnail_url
            # Update the database file with the new thumbnail info
            with open(database_file, 'w') as file:
                json.dump(db, file, indent=4)
            print(f"  ✓ Stored thumbnail URL in database")

        # Fetch and save lyrics as separate files
        lyrics_base_path = track["data"]["dest"]["data"]["path"] + track["data"]["dest"]["data"]["filename"]
        lyrics_txt_file = lyrics_base_path + ".txt"
        lyrics_lrc_file = lyrics_base_path + ".lrc"

        # Only fetch if lyrics files don't exist
        if not os.path.exists(lyrics_txt_file) and not os.path.exists(lyrics_lrc_file):
            try:
                print(f"♪ Fetching lyrics for '{title}'...")
                lyrics = fetch_lyrics_for_track(
                    title=title,
                    artist=track["data"]["info"]["data"]["artist"],
                    album=track["data"]["info"]["data"]["album"]
                )
                if lyrics:
                    # Save plain lyrics as .txt
                    if lyrics.get("plain"):
                        with open(lyrics_txt_file, 'w', encoding='utf-8') as f:
                            f.write(lyrics["plain"])
                        print(f"  ✓ Saved plain lyrics to {lyrics_txt_file}")

                    # Save synced lyrics as .lrc
                    if lyrics.get("synced"):
                        with open(lyrics_lrc_file, 'w', encoding='utf-8') as f:
                            f.write(lyrics["synced"])
                        print(f"  ✓ Saved synced lyrics to {lyrics_lrc_file}")

                    lyrics_fetched += 1
                else:
                    print(f"  No lyrics found for '{title}'")
                    lyrics_failed += 1
            except Exception as lyrics_error:
                print(f"✗ Failed to fetch lyrics for '{title}': {str(lyrics_error)}")
                lyrics_failed += 1
        else:
            print(f"✓ Lyrics files already exist for '{title}', skipping")

    except Exception as track_error:
        print(f"✗ Error processing track: {str(track_error)}")
        print(f"  Continuing with next track...")
        failed_downloads += 1
        continue

# Print summary
print(f"\n{'='*60}")
print(f"SUMMARY")
print(f"{'='*60}")
print(f"✓ Successfully downloaded: {successful_downloads}")
print(f"✓ Copied (duplicates):     {copied_files}")
print(f"✓ Already existed:         {skipped_existing}")
print(f"✗ Failed:                  {failed_downloads}")
print(f"")
print(f"♪ Lyrics fetched:          {lyrics_fetched}")
print(f"✗ Lyrics not found:        {lyrics_failed}")
print(f"{'='*60}")
print(f"Total processed:           {len(db)}")
print(f"{'='*60}\n")


