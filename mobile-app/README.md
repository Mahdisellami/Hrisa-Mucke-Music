# Music Tool Mobile App

React Native/Expo mobile application for the Music Tool project. A full-featured music player with YouTube integration, playlist management, and sharing capabilities.

## Features

### Music Playback
- **Audio Player**: Full playback controls with progress bar
  - Play, pause, skip forward/backward
  - Seek to any position in the track
  - Queue management with badge counter
  - Shuffle and repeat modes (off/one/all)
- **Mini Player**: Persistent bottom player with quick controls
- **Now Playing Screen**: Full-screen player interface with album art

### Playlist Management
- **Browse Playlists**: View all playlists and songs
- **Custom Playlists**: Create, edit, and delete custom playlists
- **Playlist Editing**: Add/remove songs, reorder tracks
- **Smart Organization**: Automatic playlist categorization

### Share Features
Share songs and playlists in multiple formats:
- **Text Format**: Formatted list with titles, artists, albums, source URLs, and MP3 URLs
- **M3U Files**: Standard playlist format compatible with most players
- **JSON Export**: Complete metadata export for backup/import

### Song Management
- **Add from YouTube**: Paste YouTube URL to add songs directly from the app
- **Edit Metadata**: Update title, artist, and album information
- **Delete Songs**: Remove songs from your library
- **Quick Actions**: Long-press menu for common operations

### Settings
- **Playback Speed**: Adjust speed from 0.5x to 2.0x
- **Crossfade**: Enable smooth transitions between songs
- **Sleep Timer**: Auto-stop playback after 5-60 minutes
- **Audio Quality**: Display of current quality settings
- **Theme**: Dark mode interface (light mode coming soon)

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **Expo Router** - File-based navigation
- **Expo AV** - Audio playback engine
- **Zustand** - State management
- **Axios** - HTTP client for API requests
- **TypeScript** - Type-safe JavaScript
- **expo-file-system** - File operations for export
- **expo-sharing** - Native share dialog integration

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (installed automatically)
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on your platform:
   ```bash
   npm run android  # Android emulator/device
   npm run ios      # iOS simulator/device
   npm run web      # Web browser
   ```

### Configuration

Update the API endpoint in `api/client.ts` to match your backend URL:
```typescript
const apiClient = axios.create({
  baseURL: "http://YOUR_IP:8000",
  timeout: 300000,
});
```

## Project Structure

```
mobile-app/
├── app/                      # Expo Router file-based routing
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Home/Music screen
│   │   ├── tools.tsx        # Toolbox screen
│   │   └── settings.tsx     # Settings screen
│   ├── playlist/            # Playlist detail screens
│   ├── custom-playlist/     # Custom playlist screens
│   ├── now-playing.tsx      # Full-screen player
│   └── _layout.tsx          # Root layout
├── components/              # Reusable components
│   ├── MiniPlayer.tsx       # Bottom mini player
│   ├── AudioPlayer.tsx      # Audio playback logic
│   ├── SongCard.tsx         # Song list item
│   ├── ShareModal.tsx       # Share format selector
│   └── ProgressBar.tsx      # Playback progress
├── store/                   # State management
│   └── musicStore.ts        # Zustand store
├── api/                     # API client
│   └── client.ts            # Axios configuration
└── utils/                   # Utility functions
    └── shareUtils.ts        # Share functionality
```

## Development

### Running Tests
```bash
npm run lint
```

### Building
```bash
npm run build
```

### Debugging
Enable React Native Debugger or use Expo Dev Tools:
```bash
npm start
# Press 'j' to open debugger
```

## API Integration

The app connects to the FastAPI backend for:
- Fetching music library (`GET /music`)
- Triggering downloads (`POST /populate/data/sync`)
- Streaming audio files (`GET /audio/{file_path}`)

See the main project [README](../README.md) for backend API documentation.

## Deployment for Friends

### iOS Users (via Expo Go - Free)

1. **One-time setup**:
   ```bash
   cd mobile-app
   npx expo publish
   ```

2. **Share with friends**:
   - They download "Expo Go" from App Store
   - Send them the QR code or link from expo publish
   - They scan and run the app in Expo Go

3. **Note**: Make sure backend is accessible from network (update `api/client.ts` with network IP)

### Android Users (via APK - Free)

1. **Build APK**:
   ```bash
   # From project root
   make android

   # Or manually
   cd mobile-app
   npx expo run:android --variant release
   ```

2. **Share with friends**:
   - Send them the `.apk` file (located at `android/app/build/outputs/apk/release/`)
   - They enable "Install from Unknown Sources" in Android settings
   - They tap the APK to install

3. **Requirements**: Android Studio must be installed on your machine

For more deployment options, see the main [README](../README.md#deployment).

## Known Issues

- Share dialog may not appear immediately on iOS (modal timing issue)
- Backend IP address is hardcoded in `api/client.ts`
- Network connectivity required for streaming (no offline mode yet)
- Expo AV deprecated (will migrate to expo-audio/expo-video in future)

## Future Improvements

See [CLAUDE.md](../CLAUDE.md#future-work) for detailed UI/UX improvement plans, including:
- UI redesign to match Settings screen aesthetic
- Proper icon system (replace emoji controls)
- Light theme implementation
- Enhanced playlist management interface

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

## License

See [LICENSE](../LICENSE) file for details.
