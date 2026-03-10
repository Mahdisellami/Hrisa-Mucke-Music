import { Share, Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Song } from "@/store/musicStore";

// Share a single song
export const shareSong = async (song: Song) => {
  try {
    console.log("Sharing single song:", song.title);
    const message = `🎵 ${song.title} by ${song.artist}\n\n${song.audioUrl}`;
    console.log("Song share message:", message);

    await Share.share({
      message,
      title: `${song.title} - ${song.artist}`,
    });

    console.log("Single song share completed");
  } catch (error) {
    console.error("Error sharing song:", error);
    Alert.alert("Error", "Failed to share song");
  }
};

// Share playlist as text
export const sharePlaylistAsText = async (playlistName: string, songs: Song[]) => {
  try {
    console.log("Starting text share...");
    console.log("Playlist name:", playlistName);
    console.log("Number of songs:", songs.length);

    let message = `🎵 ${playlistName} (${songs.length} songs)\n\n`;

    songs.forEach((song, index) => {
      message += `${index + 1}. ${song.title} - ${song.artist}\n`;
      if (song.album) {
        message += `   Album: ${song.album}\n`;
      }
      if (song.sourceUrl) {
        message += `   Source: ${song.sourceUrl}\n`;
      }
      message += `   MP3: ${song.audioUrl}\n\n`;
    });

    console.log("Message to share:", message.substring(0, 200) + "...");

    await Share.share({
      message,
      title: playlistName,
    });

    console.log("Text share completed");
  } catch (error) {
    console.error("Error sharing playlist as text:", error);
    Alert.alert("Error", "Failed to share playlist");
  }
};

// Share playlist as M3U file
export const sharePlaylistAsM3U = async (playlistName: string, songs: Song[]) => {
  try {
    console.log("Starting M3U share...");
    // Generate M3U content
    let m3uContent = "#EXTM3U\n";
    m3uContent += `#PLAYLIST:${playlistName}\n\n`;

    songs.forEach((song) => {
      // Add metadata line
      m3uContent += `#EXTINF:-1,${song.artist} - ${song.title}\n`;
      m3uContent += `${song.audioUrl}\n`;
    });

    // Create file path
    const fileName = `${playlistName.replace(/[^a-z0-9]/gi, '_')}.m3u`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    console.log("File URI:", fileUri);

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, m3uContent);
    console.log("File written successfully");

    // Share file
    const isAvailable = await Sharing.isAvailableAsync();
    console.log("Sharing available:", isAvailable);

    if (isAvailable) {
      console.log("Attempting to share...");
      try {
        const result = await Sharing.shareAsync(fileUri);
        console.log("Share result:", result);
      } catch (shareError) {
        console.error("Share error:", shareError);
        Alert.alert("Share Error", `Failed to open share dialog: ${shareError}`);
      }
    } else {
      Alert.alert("Error", "Sharing is not available on this device");
    }
  } catch (error) {
    console.error("Error sharing playlist as M3U:", error);
    Alert.alert("Error", `Failed to share playlist as M3U: ${error}`);
  }
};

// Share playlist as JSON file
export const sharePlaylistAsJSON = async (playlistName: string, songs: Song[]) => {
  try {
    console.log("Starting JSON share...");
    // Generate JSON content
    const jsonData = {
      name: playlistName,
      count: songs.length,
      created: new Date().toISOString(),
      songs: songs.map((song) => ({
        title: song.title,
        artist: song.artist,
        album: song.album,
        audioUrl: song.audioUrl,
        albumArt: song.albumArt,
      })),
    };

    const jsonContent = JSON.stringify(jsonData, null, 2);

    // Create file path
    const fileName = `${playlistName.replace(/[^a-z0-9]/gi, '_')}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    console.log("JSON File URI:", fileUri);

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, jsonContent);
    console.log("JSON file written successfully");

    // Share file
    const isAvailable = await Sharing.isAvailableAsync();
    console.log("Sharing available:", isAvailable);

    if (isAvailable) {
      console.log("Attempting to share JSON...");
      try {
        const result = await Sharing.shareAsync(fileUri);
        console.log("JSON share result:", result);
      } catch (shareError) {
        console.error("JSON share error:", shareError);
        Alert.alert("Share Error", `Failed to open share dialog: ${shareError}`);
      }
    } else {
      Alert.alert("Error", "Sharing is not available on this device");
    }
  } catch (error) {
    console.error("Error sharing playlist as JSON:", error);
    Alert.alert("Error", `Failed to share playlist as JSON: ${error}`);
  }
};
