# Hrisa Music API Documentation

Complete API reference for the Hrisa Music backend.

**Base URL**: `http://localhost:8000`

**Version**: 1.0.0

## Table of Contents

1. [Authentication](#authentication)
2. [Search](#search)
3. [Discovery](#discovery)
4. [Recommendations](#recommendations)
5. [Social](#social)
6. [Playlists](#playlists)
7. [Music](#music)

---

## Authentication

### Register User

Create a new user account.

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "display_name": "string" (optional)
}
```

**Response**:
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "display_name": "John Doe",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Login

Authenticate and receive access token.

```http
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=johndoe&password=secret
```

**Response**:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer"
}
```

### Get Current User

Get authenticated user details.

```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response**:
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "display_name": "John Doe",
  "bio": "Music lover",
  "avatar_url": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Search

### Search Tracks

Search for tracks by title, artist, or album.

```http
GET /api/search/tracks?q={query}&genre={genre}&mood={mood}&limit={limit}&offset={offset}
```

**Parameters**:
- `q` (required): Search query
- `genre` (optional): Filter by genre
- `mood` (optional): Filter by mood
- `limit` (optional, default: 20): Results per page
- `offset` (optional, default: 0): Pagination offset

**Response**:
```json
[
  {
    "id": 1,
    "title": "Song Title",
    "artist": "Artist Name",
    "album": "Album Name",
    "genre": "rock",
    "mood": "happy",
    "duration": 210,
    "play_count": 100,
    "created_at": "2024-01-01"
  }
]
```

### Search Artists

```http
GET /api/search/artists?q={query}&limit={limit}
```

**Response**:
```json
[
  {
    "name": "Artist Name",
    "track_count": 15
  }
]
```

### Search Albums

```http
GET /api/search/albums?q={query}&limit={limit}
```

**Response**:
```json
[
  {
    "album": "Album Name",
    "artist": "Artist Name",
    "track_count": 12
  }
]
```

### Search Playlists

```http
GET /api/search/playlists?q={query}&public_only={true|false}&limit={limit}
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "Playlist Name",
    "description": "Description",
    "owner_id": 1,
    "owner_username": "johndoe",
    "is_public": true,
    "track_count": 25,
    "created_at": "2024-01-01"
  }
]
```

### Search Users

```http
GET /api/search/users?q={query}&limit={limit}
```

**Response**:
```json
[
  {
    "id": 1,
    "username": "johndoe",
    "display_name": "John Doe",
    "avatar_url": null
  }
]
```

---

## Discovery

### Get Genres

List all available genres with track counts.

```http
GET /api/discover/genres
```

**Response**:
```json
[
  {
    "genre": "rock",
    "count": 150
  },
  {
    "genre": "pop",
    "count": 120
  }
]
```

### Get Genre Tracks

```http
GET /api/discover/genres/{genre}/tracks?limit={limit}&sort={popular|recent}
```

**Response**: Array of Track objects

### Get Moods

```http
GET /api/discover/moods
```

**Response**:
```json
[
  {
    "mood": "happy",
    "count": 85
  }
]
```

### Get Mood Tracks

```http
GET /api/discover/moods/{mood}/tracks?limit={limit}
```

**Response**: Array of Track objects

### Get Trending

```http
GET /api/discover/trending?timeframe={day|week|month}&limit={limit}
```

**Response**:
```json
[
  {
    "track": { /* Track object */ },
    "recent_plays": 250
  }
]
```

### Get New Releases

```http
GET /api/discover/new-releases?days={30}&limit={limit}
```

**Response**: Array of Track objects

### Get Popular Playlists

```http
GET /api/discover/popular-playlists?limit={limit}
```

**Response**: Array of Playlist objects

---

## Recommendations

### Get Personalized Recommendations

```http
GET /api/recommendations/for-you?limit={limit}&algorithm={hybrid|collaborative|content}
Authorization: Bearer {token}
```

**Response**: Array of Track objects

### Get Similar Tracks

```http
GET /api/recommendations/similar-tracks/{track_id}?limit={limit}
```

**Response**: Array of Track objects

### Get Daily Mix

```http
GET /api/recommendations/daily-mix?limit={limit}
Authorization: Bearer {token}
```

**Response**: Array of Track objects

### Get Discover Weekly

```http
GET /api/recommendations/discover-weekly?limit={limit}
Authorization: Bearer {token}
```

**Response**: Array of Track objects

---

## Social

### Follow User

```http
POST /api/social/follow/{user_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Followed successfully"
}
```

### Unfollow User

```http
DELETE /api/social/unfollow/{user_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Unfollowed successfully"
}
```

### Get Followers

```http
GET /api/social/followers/{user_id}
```

**Response**: Array of User objects

### Get Following

```http
GET /api/social/following/{user_id}
```

**Response**: Array of User objects

### Check Follow Status

```http
GET /api/social/is-following/{user_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "is_following": true
}
```

### Get Activity Feed

Get activity feed from followed users.

```http
GET /api/social/feed?limit={limit}&offset={offset}
Authorization: Bearer {token}
```

**Response**:
```json
[
  {
    "id": 1,
    "user_id": 2,
    "username": "janedoe",
    "display_name": "Jane Doe",
    "avatar_url": null,
    "activity_type": "favorited_track",
    "track_id": 10,
    "track_title": "Song Title",
    "track_artist": "Artist",
    "playlist_id": null,
    "playlist_name": null,
    "target_user_id": null,
    "target_username": null,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**Activity Types**:
- `favorited_track`
- `created_playlist`
- `added_to_playlist`
- `followed_user`
- `shared_playlist`
- `shared_track`

### Get User Activity

```http
GET /api/social/activity/{user_id}?limit={limit}
```

**Response**: Array of Activity objects

### Get User Profile

```http
GET /api/social/profile/{user_id}
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "display_name": "John Doe",
    "bio": "Music lover",
    "avatar_url": null,
    "created_at": "2024-01-01"
  },
  "stats": {
    "playlists": 5,
    "followers": 10,
    "following": 15,
    "total_plays": 250
  }
}
```

### Share Playlist

```http
POST /api/social/share/playlist/{playlist_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "share_url": "/playlist/123",
  "message": "Playlist shared"
}
```

### Share Track

```http
POST /api/social/share/track/{track_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Track shared to feed"
}
```

---

## Playlists

### Get User Playlists

```http
GET /api/playlists/user/{user_id}
Authorization: Bearer {token} (if private)
```

**Response**: Array of Playlist objects

### Get User Public Playlists

```http
GET /api/playlists/user/{user_id}/public
```

**Response**: Array of Playlist objects

### Get Playlist

```http
GET /api/playlists/{playlist_id}
Authorization: Bearer {token} (if private)
```

**Response**:
```json
{
  "id": 1,
  "name": "My Playlist",
  "description": "Description",
  "owner_id": 1,
  "owner_username": "johndoe",
  "is_public": true,
  "tracks": [
    { /* Track object */ }
  ],
  "created_at": "2024-01-01"
}
```

### Create Playlist

```http
POST /api/playlists
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My Playlist",
  "description": "Description",
  "is_public": true
}
```

**Response**: Playlist object

### Update Playlist

```http
PUT /api/playlists/{playlist_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated Description",
  "is_public": false
}
```

**Response**: Updated Playlist object

### Delete Playlist

```http
DELETE /api/playlists/{playlist_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Playlist deleted successfully"
}
```

### Add Track to Playlist

```http
POST /api/playlists/{playlist_id}/tracks
Authorization: Bearer {token}
Content-Type: application/json

{
  "track_id": 10
}
```

**Response**:
```json
{
  "message": "Track added to playlist"
}
```

### Remove Track from Playlist

```http
DELETE /api/playlists/{playlist_id}/tracks/{track_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Track removed from playlist"
}
```

---

## Music

### Get All Tracks

```http
GET /api/music?limit={limit}&offset={offset}
```

**Response**: Array of Track objects

### Get Track

```http
GET /api/music/{track_id}
```

**Response**: Track object

### Add Track to Favorites

```http
POST /api/music/favorites/{track_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Added to favorites"
}
```

### Remove from Favorites

```http
DELETE /api/music/favorites/{track_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Removed from favorites"
}
```

### Get Favorites

```http
GET /api/music/favorites
Authorization: Bearer {token}
```

**Response**: Array of Track objects

### Record Play

```http
POST /api/music/play/{track_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Play recorded"
}
```

### Get Listening History

```http
GET /api/music/history?limit={limit}
Authorization: Bearer {token}
```

**Response**: Array of Track objects with play timestamps

---

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "detail": "Error message"
}
```

**Common Status Codes**:
- `200 OK`: Request successful
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

- **Search endpoints**: 100 requests/minute
- **Social endpoints**: 200 requests/minute
- **Other endpoints**: 300 requests/minute

Exceeded limits return `429 Too Many Requests`.

---

## Pagination

List endpoints support pagination:

**Parameters**:
- `limit`: Items per page (default: 20, max: 100)
- `offset`: Skip N items (default: 0)

**Example**:
```http
GET /api/music?limit=50&offset=100
```

---

## Data Models

### Track
```typescript
{
  id: number
  title: string
  artist: string
  album: string
  genre: string | null
  mood: string | null
  duration: number  // seconds
  play_count: number
  file_path: string
  created_at: string  // ISO 8601
}
```

### User
```typescript
{
  id: number
  username: string
  email: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}
```

### Playlist
```typescript
{
  id: number
  name: string
  description: string | null
  owner_id: number
  owner_username: string
  is_public: boolean
  track_count: number
  created_at: string
}
```

### Activity
```typescript
{
  id: number
  user_id: number
  username: string
  display_name: string | null
  avatar_url: string | null
  activity_type: string
  track_id: number | null
  track_title: string | null
  track_artist: string | null
  playlist_id: number | null
  playlist_name: string | null
  target_user_id: number | null
  target_username: string | null
  created_at: string
}
```

---

## Testing

Use the seed script to create test data:

```bash
cd backend
python scripts/seed_test_data.py --clear

# Test credentials:
# Username: alice, bob, charlie, diana, or eve
# Password: password123
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/anthropics/hrisa-mucke/issues
- Email: support@hrisa-music.example.com
