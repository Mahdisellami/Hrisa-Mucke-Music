# Music Tool

A full-stack application for managing and organizing music tracks downloaded from YouTube. Download, organize, and manage your music library with automated metadata tagging.

## Features

### Core Features
- **YouTube to MP3**: Download audio from YouTube videos
- **Metadata Management**: Automatic ID3 tag writing (artist, album)
- **REST API**: FastAPI backend for music data and operations
- **Mobile App**: React Native/Expo cross-platform interface
- **Playlist Organization**: Organize tracks into playlists/folders
- **Checksum Tracking**: Smart duplicate detection and update handling

### Mobile App Features
- **Music Player**: Full-featured playback with queue management
  - Play, pause, next, previous controls
  - Shuffle and repeat modes (off/one/all)
  - Playback speed control (0.5x - 2.0x)
  - Sleep timer (5-60 minutes)
  - Progress bar with seek functionality
  - Platform-specific audio (native on mobile, Web Audio API on web)
  - Background playback and lock screen controls (mobile)
- **Equalizer**: 3-band EQ with 8 presets
  - Presets: Off, Bass Boost, Treble Boost, Vocal, Rock, Jazz, Classical, Electronic
  - Custom EQ: Bass, Mid, Treble (-12 to +12 dB)
  - Settings persisted across sessions
- **Playlist Management**:
  - Browse and play custom playlists
  - Create, edit, and delete playlists
  - Add/remove songs from playlists
  - Sort by title, artist, album, or recently played
- **Share Features**: Share songs and playlists in multiple formats
  - Text format (with titles, artists, and source URLs)
  - M3U playlist files (standard format)
  - JSON export (full metadata)
- **Song Management**:
  - YouTube search integration (search and add songs directly)
  - Delete songs from library
  - Edit song metadata (title, artist, album)
  - Long-press menu for quick actions
- **Modern UI Design**:
  - Professional dark theme (Spotify-inspired)
  - Consistent design system with proper icon library
  - Smooth animations and transitions
  - Responsive layouts for mobile and web

## Quick Start

### Prerequisites

- Docker and Docker Compose (for backend)
- Python 3.8+ (for scripts)
- Node.js 18+ and npm (for mobile app)
- Android Studio (optional, for Android builds)
- iOS device with Expo Go app (for iOS testing)

### Run with Docker

```bash
# Start both backend and web app in detached mode
docker-compose up -d

# Backend will be available at http://localhost:8000
# Web app will be available at http://localhost:8081

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Run Locally

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Mobile App:**
```bash
cd mobile-app
npm install
npm start
```

**Python Scripts:**
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python populate_db.py    # Add tracks to database
python populate_data.py  # Download MP3s
```

## Project Structure

```
music-tool/
├── backend/           # FastAPI REST API
├── mobile-app/        # React Native/Expo app
├── data/              # Downloaded MP3 files
├── music.json         # Track database
├── populate_db.py     # Database population script
├── populate_data.py   # MP3 download script
└── docker-compose.yml # Multi-service orchestration
```

## Usage

### Adding New Tracks

1. Edit `populate_db.py` and add track entries to the `track_li` array:
   ```python
   {'playlist': 'music', 'u': 'https://youtu.be/...', 't': 'Song Title', 'a': 'Artist Name'}
   ```

2. Run the database script:
   ```bash
   python populate_db.py
   ```

3. Download the MP3 files:
   ```bash
   python populate_data.py
   ```

### API Endpoints

**Music Data:**
- `GET /music` - Fetch all tracks with full metadata

**Database Operations:**
- `POST /populate/db/sync` - Update database (sync)
- `POST /populate/db/async` - Update database (background)

**Download Operations:**
- `POST /populate/data/sync` - Download tracks (sync)
- `POST /populate/data/async` - Download tracks (background)

**Audio Serving:**
- `GET /audio/{file_path}` - Stream audio files

## Tech Stack

**Backend:**
- FastAPI
- Pydantic
- pytubefix (YouTube downloader)
- moviepy (audio extraction)
- mutagen (ID3 metadata)

**Mobile App:**
- React Native
- Expo (with Expo Router for navigation)
- Platform-specific audio services:
  - react-native-track-player (iOS/Android native playback)
  - Web Audio API (browser-based playback with EQ)
- Zustand (state management)
- Axios (API client)
- Expo Vector Icons (Ionicons - unified icon system)
- expo-file-system (file operations)
- expo-sharing (native share dialogs)
- Design system with centralized tokens (colors, typography, spacing)

## Setup for Friends 👥

**Quick setup guide for non-technical users:**

1. **Get the App**:
   - Android: Install the `.apk` file sent to you
   - iOS: Download "Expo Go" from App Store, scan QR code

2. **Start Backend on Your Computer**:
   ```bash
   # Option 1: With Docker (easiest)
   docker-compose up

   # Option 2: Without Docker
   make backend
   ```
   - First time: Automatically downloads music (may take time)
   - Creates your personal music library

3. **Connect App to Backend**:
   - Open app → Go to "Connection" tab
   - Find your computer's IP:
     ```bash
     make network-ip
     ```
   - Enter `http://[YOUR-IP]:8000` in the app
   - Tap "Test" then "Save"

4. **Enjoy**! 🎵
   - Keep backend running while using the app
   - Same Wi-Fi network required

## Deployment

This app is designed for personal use and small groups (not public app store distribution).

### Quick Commands

We provide a `Makefile` for common operations (compatible with macOS and Linux):

```bash
make help          # Show all available commands

# Development
make backend       # Start FastAPI backend
make mobile        # Start Expo dev server
make docker-up     # Start all services with Docker

# Database
make db            # Populate music.json
make data          # Download MP3s
make db-data       # Both operations

# Production Builds
make android       # Build Android APK (for sideloading)
make android-eas   # Build Android APK using EAS (cloud)
make ios-expo      # Start dev server for iOS (free, same Wi-Fi needed)
make ios-build     # Build permanent iOS app (requires Apple Developer $99/year)
make ios-update    # Push updates to existing iOS build

# Utilities
make clean         # Clean build artifacts
make network-ip    # Show network IP for testing
```

### Distribution Strategy

**Android** (Free):
- Build APK locally: `make android` (requires Android Studio)
- Or use cloud build: `make android-eas` (requires free Expo account)
- Share `.apk` file with users
- Users enable "Install from Unknown Sources" and install

**iOS** - Two Options:

*Option 1: Free (Development Server)*
- Run: `make ios-expo`
- Friends download Expo Go from App Store
- Friends must be on same Wi-Fi network
- They scan QR code to connect
- Dev server must stay running
- **Limitation**: Not permanent, requires same network

*Option 2: Permanent Build ($99/year)*
- Requires Apple Developer account ($99/year)
- Run: `make ios-build` (one-time)
- Share permanent link with friends
- Push updates: `make ios-update`
- Works across different networks

For more details, see [Deployment Strategy in CLAUDE.md](CLAUDE.md#deployment-strategy).

## Recent Updates

**✅ UI Redesign Complete (December 2024)**
- Eliminated all emoji icons, replaced with professional icon system (Ionicons)
- Established comprehensive design system with centralized tokens
- Modern Spotify-inspired dark theme across all screens
- Consistent typography, spacing, and component styling
- Web platform fully supported and tested

**✅ Platform-Specific Audio Services**
- Native playback on iOS/Android with background support
- Web Audio API implementation with functional 3-band equalizer
- Lock screen controls on mobile devices

## Future Work

For planned features and improvements, see the [Future Work section in CLAUDE.md](CLAUDE.md#future-work).

Potential enhancements:
- Light theme implementation
- Listening statistics and analytics
- Collaborative playlists (requires centralized database)
- Advanced search and filtering

## License

See [LICENSE](LICENSE) file for details.
