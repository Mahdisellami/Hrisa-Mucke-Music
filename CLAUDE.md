# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Music Tool is a full-stack application for managing music tracks downloaded from YouTube. It consists of three main components:
- **Backend (FastAPI)**: REST API for music data management and script execution
- **Mobile App (React Native/Expo)**: Cross-platform mobile interface
- **Python Scripts**: YouTube download and MP3 metadata management tools

The system uses a JSON database (`music.json`) with checksums to track changes to tracks, sources, and destinations.

## Architecture

### Data Persistence Model

**Current Approach: File-Based with Populate Scripts**

The system uses a simple, decentralized model where each user maintains their own music library:

**Data Sources:**
1. **`populate_db.py`** - The "database migration" file
   - Contains Python list of tracks: `[{'u': 'youtube_url', 't': 'title', 'a': 'artist'}, ...]`
   - Users edit this file to add/remove songs
   - Generates `music.json` when run

2. **`music.json`** - Generated database file
   - JSON representation of all tracks with metadata and checksums
   - Created/updated by `populate_db.py`
   - Source of truth for backend API

3. **`data/` folder** - MP3 storage
   - Organized by playlist: `data/music/`, `data/workout/`, etc.
   - Downloaded by `populate_data.py` from YouTube
   - Includes ID3 metadata (artist, album)

**Why This Design:**
- ✅ **Simple**: No database server, no complex setup
- ✅ **Personal**: Each user curates their own library
- ✅ **Portable**: Copy `music.json` + `data/` to backup/restore
- ✅ **Version Control Friendly**: `populate_db.py` can be in git (script, not music)
- ✅ **Zero Hosting Costs**: Everything runs locally
- ✅ **Automatic Setup**: Docker entrypoint runs populate scripts on first launch

**Limitations:**
- ❌ No shared music library between users
- ❌ Adding songs requires editing Python file
- ❌ No collaborative playlists across users
- ❌ Limited dynamic metadata (ratings, play counts stored client-side only)

**Future Migration Path:**

When scaling beyond personal use, consider:
1. **Centralized Database** (PostgreSQL/MongoDB): Shared library, collaborative playlists, user accounts
2. **Hybrid Approach**: One user hosts backend, friends connect (shared library, single admin)
3. **Web-Based Music Addition**: UI for adding songs instead of editing Python

**Current approach is optimal for: < 10 users, personal libraries, rapid iteration**

### Data Flow
1. `populate_db.py` defines tracks (URL, title, artist, album) and writes to `music.json`
2. `populate_data.py` downloads MP3s from YouTube URLs and writes ID3 metadata (artist, album)
3. Backend serves music data via REST API from `music.json`
4. Mobile app fetches and displays tracks, can trigger populate scripts

### Checksum System
Each track has nested checksums:
- Track-level checksum covers entire track object
- Nested checksums for `info`, `src`, and `dest` allow detecting what changed
- When source checksum matches but track checksum differs, existing track is updated (not duplicated)
- This enables editing track info/destination without re-downloading

### File Structure
```
/
├── backend/                    # FastAPI backend
│   ├── main.py                # App entrypoint
│   ├── api/endpoints.py       # REST routes
│   ├── models/schemas.py      # Pydantic models
│   ├── utils/file_ops.py      # JSON database operations
│   └── requirements.txt       # FastAPI, uvicorn, pytubefix, moviepy, mutagen
├── mobile-app/                # React Native/Expo app
│   ├── app/                   # Expo Router file-based routing
│   │   ├── (tabs)/           # Tab navigation screens
│   │   ├── _layout.tsx       # Root layout
│   │   └── modal.tsx         # Modal screen
│   ├── api/client.ts         # Axios client with AsyncStorage backend URL
│   ├── store/musicStore.ts   # Zustand state management (uses audio service)
│   ├── services/audio/       # Platform-specific audio services
│   │   ├── index.ts          # Platform selector and factory
│   │   ├── types.ts          # AudioServiceInterface definition
│   │   ├── MobileAudioService.ts  # react-native-track-player wrapper
│   │   └── WebAudioService.ts     # Web Audio API wrapper (with EQ)
│   ├── components/           # React components
│   │   ├── ui/               # Reusable UI components
│   │   │   ├── Button.tsx    # Button library (Primary, Secondary, Icon, etc.)
│   │   │   └── Icon.tsx      # Unified icon component (Ionicons)
│   └── constants/            # Design system
│       └── DesignTokens.ts   # Colors, typography, spacing, etc.
├── data/                      # Downloaded MP3 files (organized by playlist)
├── music.json                 # JSON database (track metadata)
├── populate_db.py            # Creates/updates track entries in music.json
├── populate_data.py          # Downloads MP3s and writes ID3 metadata
├── utils.py                  # Checksum utility (MD5 hash)
└── docker-compose.yml        # Multi-service orchestration
```

## Development Commands

### Docker (Recommended)
Start all services (backend + web app):
```bash
docker-compose up -d   # Start in detached mode
```

Start specific service:
```bash
docker-compose up backend  # Backend on port 8000
docker-compose up web-app  # Web app on port 8081
```

View logs:
```bash
docker-compose logs -f
```

Stop services:
```bash
docker-compose down
```

### Backend (FastAPI)
Local development:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs on `http://localhost:8000`

### Mobile App (Expo)
Local development:
```bash
cd mobile-app
npm install
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run in browser
npm run lint           # Run ESLint
```

Expo dev server runs on port 8081

### Python Scripts (Standalone)
Run directly in project root:
```bash
# Setup virtual environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Populate database
python populate_db.py

# Download tracks and write metadata
python populate_data.py
```

## Backend API Endpoints

- **GET `/music`** - Returns all tracks from music.json
- **POST `/populate/db/sync`** - Runs populate_db.py synchronously
- **POST `/populate/db/async`** - Runs populate_db.py in background
- **POST `/populate/data/sync`** - Runs populate_data.py synchronously
- **POST `/populate/data/async`** - Runs populate_data.py in background

## Key Implementation Details

### Mobile App API Client
The API client is in `mobile-app/api/client.ts` with a **default backend URL** (`http://192.168.2.155:8000`). Users can configure this at runtime via the **Connection tab** in the mobile app:
- Backend URL is stored in AsyncStorage (`@backend_url` key)
- Connection tab allows users to enter custom backend URL
- Test connection button validates before saving
- No code editing required for different network environments

### State Management
Mobile app uses Zustand (`mobile-app/store/musicStore.ts`) for global state. The store fetches songs and transforms the nested JSON structure into a flat `{title, artist, album}` format.

### Database Location
Backend expects `music.json` at `/app/root/music.json` (inside container) which maps to project root via volume mount. Scripts also run from `/app/root/` in container context.

### Volume Mounts
Docker Compose configuration:
- `./data:/app/data` - Persistent MP3 storage
- `./backend:/app` - Backend hot reload
- `./:/app/root` - Scripts and music.json access
- `./mobile-app:/app` - Mobile app hot reload

### File Organization
Downloaded MP3s are stored in `data/{playlist}/` folders (e.g., `data/music/`, `data/workout/`) as defined in the track's destination path.

## Adding New Tracks

1. Edit `populate_db.py` and add entries to `track_li` array
2. Run `populate_db.py` to update `music.json`
3. Run `populate_data.py` to download MP3s and write metadata
4. Alternatively, trigger via API: POST to `/populate/db/sync` then `/populate/data/sync`

## Recent Major Updates

### ✅ UI Redesign Complete (December 2024)

**Comprehensive design system established:**
- **DesignTokens.ts**: Centralized design values
  - Colors: Spotify-inspired dark theme (#121212 background, #1DB954 accent)
  - Typography: 32px h1 → 12px caption scale
  - Spacing: 8px base unit system
  - Border radius: 6px → 20px pill-shaped
  - Shadows: Small/medium/large elevation system

- **Icon.tsx**: Unified icon component using Expo Vector Icons (Ionicons)
  - 50+ icon types (play, pause, heart, shuffle, repeat, etc.)
  - Size system: xs, sm, md, lg, xl
  - Platform-aware (SF Symbols on iOS, Material on Android/Web)

- **Button.tsx**: Reusable button library
  - PrimaryButton (#1DB954), SecondaryButton (#3e3e3e), DangerButton (#ff4444)
  - IconButton with active states and badge support
  - PillButton for toggles

**All screens redesigned:**
- ✅ Now Playing: Replaced 10+ emoji icons, fixed button sizes, standardized controls
- ✅ MiniPlayer: All emoji controls → proper icons with badges
- ✅ SongCard: Complete redesign with icon-based menus
- ✅ Music Home: Updated playlist cards and fetch button
- ✅ Tools: Replaced action card emojis, redesigned modals
- ✅ Queue: Icon-based controls throughout
- ✅ Playlist Screens: Consistent headers and action buttons
- ✅ Manage Playlists: Icon buttons for create/edit/delete
- ✅ YouTube Search: Updated search and add icons
- ✅ Connection: Status indicators with proper icons

**Results:**
- Zero emoji icons remaining across entire app
- Consistent design tokens across all screens
- Professional, modern aesthetic matching Settings screen
- Cross-platform icon support (iOS/Android/Web)

### ✅ Platform-Specific Audio Architecture Complete

**Migration from Expo AV to platform-specific services:**
- **Mobile (iOS/Android)**: react-native-track-player for native background playback
  - Lock screen controls (play/pause, next, previous)
  - Background playback support
  - Better performance and battery life
- **Web**: Web Audio API implementation
  - Browser-based playback
  - Functional 3-band equalizer (Bass, Mid, Treble)
  - 8 presets: Off, Bass Boost, Treble Boost, Vocal, Rock, Jazz, Classical, Electronic
  - Custom EQ: -12 to +12 dB range
- **Unified Interface**: AudioServiceInterface abstracts platform differences
- **Zero Expo AV dependencies** remaining

## Future Work

### Potential Enhancements

**UI/UX:**
- Light theme implementation (infrastructure exists)
- User profile management sidebar (Spotify-style)
- Volume slider in MiniPlayer (challenging on web due to size constraints)

**Features:**
- Listening statistics (most played, total time, etc. - requires user accounts)
- Advanced search and filtering
- Collaborative playlists (requires centralized database)
- Native EQ module for mobile (currently only functional on web)

**Won't Implement:**
- ❌ Audio effects (reverb, echo) - Production tools, not playback features

## Deployment Strategy

### Context
This app is intended for personal use and a small group of friends (< 10 users), not public distribution via app stores. All users primarily have iPhones, but we want to avoid the $99/year Apple Developer account cost.

### Chosen Approach

**Android (Primary):**
- Build APK locally using `make android` or `npx expo run:android --variant release`
- Share APK files directly with users
- Users install via "Unknown Sources" (sideloading)
- **Cost**: Free
- **Pros**: Simple, no accounts needed, unlimited distribution
- **Cons**: Security warnings on install, requires Android Studio setup

**iOS (Temporary):**
- Use Expo Go app for distribution
- Users download Expo Go from App Store
- Share QR code or link after running `npx expo publish`
- **Cost**: Free
- **Pros**: No Apple Developer account needed, instant updates
- **Cons**: Requires Expo Go app, development-like experience, feels less "native"

### Future Considerations

If user base grows or iOS native experience becomes critical:
- **TestFlight via Apple Developer** ($99/year): Professional iOS distribution, up to 100 testers
- **Google Play Internal Testing** ($25 one-time): More official Android distribution
- **EAS Build**: Cloud-based builds for easier APK generation

### Why Not App Stores?

1. **Small user base**: Only friends and acquaintances, not public users
2. **Cost avoidance**: $99/year Apple + $25 Google Play not justified for < 10 users
3. **Development flexibility**: Can iterate quickly without store review delays
4. **Privacy**: No public app listing, private distribution only

### Backend Setup

Each user runs their own backend instance on their local machine. The backend automatically initializes on first run:

1. **Docker** (Recommended):
   ```bash
   docker-compose up
   ```
   - First run: Automatically creates `music.json` and downloads MP3s
   - Subsequent runs: Uses existing data

2. **Native** (Without Docker):
   ```bash
   make backend
   ```

### Mobile App Configuration

The mobile app includes a user-friendly **Connection** tab where non-technical users can:
- Enter their backend IP address (no code editing needed!)
- Test the connection before saving
- Get instructions on finding their IP address
- Reset to default if needed

**For users:**
1. Open app → Go to "Connection" tab
2. Run `make network-ip` on their computer to find IP
3. Enter `http://[IP]:8000` in the app
4. Tap "Test" to verify connection
5. Tap "Save"

### Quick Start Commands

See the `Makefile` in the project root for all available commands:
```bash
make help          # Show all available commands
make android       # Build Android APK
make ios-expo      # Instructions for iOS via Expo Go
make backend       # Start backend server
make mobile        # Start Expo dev server
make network-ip    # Show your IP address for mobile configuration
```
