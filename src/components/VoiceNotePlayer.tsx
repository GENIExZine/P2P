import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface VoiceNotePlayerProps {
  durationSec?: number;
  isOutgoing: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ durationSec = 8, isOutgoing }) => {
  const { colors, isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, (durationSec * 1000) / 10);
    }
    return () => clearInterval(timer);
  }, [isPlaying, durationSec]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (playbackProgress >= 1) setPlaybackProgress(0);
      setIsPlaying(true);
    }
  };

  // Generate realistic pseudo waveform heights
  const bars = [14, 22, 10, 28, 18, 30, 24, 16, 20, 26, 32, 18, 22, 12, 19, 27, 15, 23, 29, 14];

  const iconColor = isOutgoing 
    ? (isDark ? colors.text : colors.primary)
    : colors.primary;

  const activeBarColor = isOutgoing
    ? (isDark ? '#FFFFFF' : colors.primary)
    : colors.primary;

  const inactiveBarColor = isOutgoing
    ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)')
    : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)');

  const timeColor = isOutgoing ? colors.bubbleTimeOut : colors.bubbleTimeIn;

  const currentSeconds = Math.round(playbackProgress * durationSec);
  const formattedTime = `0:${currentSeconds < 10 ? '0' : ''}${currentSeconds} / 0:${durationSec < 10 ? '0' : ''}${durationSec}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.playButton, { backgroundColor: isOutgoing ? 'rgba(255,255,255,0.2)' : colors.primary + '20' }]} 
        onPress={togglePlay}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={isPlaying ? 'pause' : 'play'} 
          size={18} 
          color={iconColor} 
          style={{ marginLeft: isPlaying ? 0 : 2 }}
        />
      </TouchableOpacity>

      <View style={styles.waveformWrapper}>
        <View style={styles.waveformContainer}>
          {bars.map((height, idx) => {
            const barFraction = idx / bars.length;
            const isPlayed = barFraction <= playbackProgress;
            return (
              <View
                key={idx}
                style={[
                  styles.bar,
                  {
                    height: height * 0.7,
                    backgroundColor: isPlayed ? activeBarColor : inactiveBarColor,
                  },
                ]}
              />
            );
          })}
        </View>
        <Text style={[styles.durationText, { color: timeColor }]}>{formattedTime}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 190,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  waveformWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 2,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  durationText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
});
