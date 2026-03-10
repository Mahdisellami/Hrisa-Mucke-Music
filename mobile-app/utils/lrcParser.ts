export interface LyricLine {
  time: number; // Time in milliseconds
  text: string;
}

/**
 * Parse LRC format lyrics
 * Format: [mm:ss.xx]Lyric text
 * Example: [00:12.00]First line of lyrics
 */
export function parseLRC(lrcContent: string): LyricLine[] {
  const lines = lrcContent.split('\n');
  const lyrics: LyricLine[] = [];

  for (const line of lines) {
    // Match timestamp pattern [mm:ss.xx] or [mm:ss]
    const match = line.match(/\[(\d{2}):(\d{2})\.?(\d{2})?\](.*)/);

    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centiseconds = match[3] ? parseInt(match[3], 10) : 0;
      const text = match[4].trim();

      // Convert to milliseconds
      const time = (minutes * 60 + seconds) * 1000 + centiseconds * 10;

      if (text) {
        lyrics.push({ time, text });
      }
    }
  }

  // Sort by time (should already be sorted, but just in case)
  lyrics.sort((a, b) => a.time - b.time);

  return lyrics;
}

/**
 * Get the current lyric line index based on playback position
 */
export function getCurrentLyricIndex(
  lyrics: LyricLine[],
  position: number
): number {
  if (lyrics.length === 0) return -1;

  // Find the last lyric line that has passed
  let currentIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (position >= lyrics[i].time) {
      currentIndex = i;
    } else {
      break;
    }
  }

  return currentIndex;
}

/**
 * Format time in milliseconds to mm:ss
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
