import React from 'react';
import { View, StyleSheet } from 'react-native';

interface WebSliderProps {
  style?: any;
  minimumValue: number;
  maximumValue: number;
  value: number;
  onSlidingStart?: () => void;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  step?: number;
}

export const WebSlider: React.FC<WebSliderProps> = ({
  style,
  minimumValue,
  maximumValue,
  value,
  onSlidingStart,
  onValueChange,
  onSlidingComplete,
  minimumTrackTintColor = '#1DB954',
  maximumTrackTintColor = '#444',
  thumbTintColor = '#fff',
  step = 1,
}) => {
  return (
    <View style={[styles.container, style]}>
      <input
        type="range"
        min={minimumValue}
        max={maximumValue}
        value={value}
        step={step}
        onMouseDown={onSlidingStart}
        onTouchStart={onSlidingStart}
        onChange={(e) => onValueChange(Number(e.target.value))}
        onMouseUp={(e) => onSlidingComplete?.(Number(e.currentTarget.value))}
        onTouchEnd={(e) => onSlidingComplete?.(Number(e.currentTarget.value))}
        style={{
          width: '100%',
          height: 8,
          accentColor: minimumTrackTintColor,
        } as any}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
