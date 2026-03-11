import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { WebSlider as Slider } from "@/components/ui/WebSlider";
import { useMusicStore } from "@/store/musicStore";

export const ProgressBar: React.FC = () => {
  const { position, duration, seekToPosition } = useMusicStore();
  const [isSeeking, setIsSeeking] = useState(false);
  const [localPosition, setLocalPosition] = useState(0);
  const [pendingSeek, setPendingSeek] = useState<number | null>(null);

  // Update local position when store position changes, but not while seeking
  useEffect(() => {
    if (!isSeeking && pendingSeek === null) {
      setLocalPosition(position);
    }
  }, [position, isSeeking, pendingSeek]);

  // Handle pending seek
  useEffect(() => {
    if (pendingSeek !== null) {
      const timer = setTimeout(async () => {
        await seekToPosition(pendingSeek);
        setPendingSeek(null);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [pendingSeek, seekToPosition]);

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const currentTime = formatTime(localPosition);
  const totalTime = formatTime(duration);

  const handleSlidingStart = () => {
    setIsSeeking(true);
    setPendingSeek(null);
  };

  const handleValueChange = (value: number) => {
    setLocalPosition(value);
  };

  const handleSlidingComplete = (value: number) => {
    setIsSeeking(false);
    setPendingSeek(value);
  };

  if (duration === 0) return null;

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration}
        value={localPosition}
        onSlidingStart={handleSlidingStart}
        onValueChange={handleValueChange}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="#444"
        thumbTintColor="#fff"
        tapToSeek={true}
      />
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{currentTime}</Text>
        <Text style={styles.timeText}>{totalTime}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  timeText: {
    color: "#999",
    fontSize: 12,
  },
});
