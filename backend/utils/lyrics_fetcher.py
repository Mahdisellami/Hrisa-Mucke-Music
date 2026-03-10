import requests
from typing import Optional, Dict
import time

class LyricsFetcher:
    """Fetch lyrics from multiple sources with fallback"""

    def __init__(self):
        self.lrclib_base = "https://lrclib.net/api"
        self.lyrics_ovh_base = "https://api.lyrics.ovh/v1"

    def fetch_lyrics(self, title: str, artist: str, album: Optional[str] = None) -> Optional[Dict[str, str]]:
        """
        Fetch lyrics from available sources
        Returns dict with 'plain' and optionally 'synced' lyrics
        """
        # Try LRCLib first (has synced lyrics)
        lyrics = self._fetch_from_lrclib(title, artist, album)
        if lyrics:
            return lyrics

        # Fallback to lyrics.ovh
        lyrics = self._fetch_from_lyrics_ovh(title, artist)
        if lyrics:
            return lyrics

        return None

    def _fetch_from_lrclib(self, title: str, artist: str, album: Optional[str] = None) -> Optional[Dict[str, str]]:
        """Fetch from LRCLib (free, synced lyrics)"""
        try:
            params = {
                "track_name": title,
                "artist_name": artist,
            }
            if album:
                params["album_name"] = album

            response = requests.get(
                f"{self.lrclib_base}/search",
                params=params,
                timeout=10
            )

            if response.status_code == 200:
                results = response.json()
                if results and len(results) > 0:
                    result = results[0]  # Take first match
                    lyrics_dict = {}

                    # Plain lyrics
                    if result.get("plainLyrics"):
                        lyrics_dict["plain"] = result["plainLyrics"]

                    # Synced lyrics (LRC format)
                    if result.get("syncedLyrics"):
                        lyrics_dict["synced"] = result["syncedLyrics"]

                    if lyrics_dict:
                        print(f"✓ Found lyrics for '{title}' by {artist} (LRCLib)")
                        return lyrics_dict

            return None

        except Exception as e:
            print(f"LRCLib error for '{title}': {str(e)}")
            return None

    def _fetch_from_lyrics_ovh(self, title: str, artist: str) -> Optional[Dict[str, str]]:
        """Fetch from lyrics.ovh (free, simple)"""
        try:
            response = requests.get(
                f"{self.lyrics_ovh_base}/{artist}/{title}",
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("lyrics"):
                    print(f"✓ Found lyrics for '{title}' by {artist} (lyrics.ovh)")
                    return {"plain": data["lyrics"]}

            return None

        except Exception as e:
            print(f"lyrics.ovh error for '{title}': {str(e)}")
            return None

def fetch_lyrics_for_track(title: str, artist: str, album: Optional[str] = None) -> Optional[Dict[str, str]]:
    """
    Convenience function to fetch lyrics
    Returns dict with 'plain' and optionally 'synced' keys
    """
    fetcher = LyricsFetcher()
    return fetcher.fetch_lyrics(title, artist, album)


if __name__ == "__main__":
    # Test the lyrics fetcher
    print("Testing lyrics fetcher...\n")

    test_songs = [
        {"title": "Numb", "artist": "Linkin Park"},
        {"title": "Shape of You", "artist": "Ed Sheeran"},
    ]

    for song in test_songs:
        print(f"Fetching lyrics for: {song['title']} - {song['artist']}")
        lyrics = fetch_lyrics_for_track(song["title"], song["artist"])
        if lyrics:
            print(f"Success! Found {len(lyrics)} type(s) of lyrics")
            if "synced" in lyrics:
                print("  - Synced lyrics available")
            if "plain" in lyrics:
                print(f"  - Plain lyrics: {len(lyrics['plain'])} characters")
        else:
            print("  No lyrics found")
        print()
        time.sleep(1)  # Be nice to the APIs
