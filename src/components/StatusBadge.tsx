import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserStatus } from '../types';
import { STATUS_PRESETS } from '../constants/presets';
import { useTheme } from '../context/ThemeContext';

interface StatusBadgeProps {
  status?: UserStatus;
  compact?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, compact = false }) => {
  const { colors } = useTheme();

  if (!status) return null;

  const preset = STATUS_PRESETS.find(p => p.availability === status.availability);
  const color = preset ? preset.color : colors.primary;

  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: color + '22', borderColor: color }]}>
        <Text style={styles.compactEmoji}>{status.emoji || '🟢'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: color + '1A', borderColor: color + '40' }]}>
      <Text style={styles.emoji}>{status.emoji || '🟢'}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
        {status.customText || preset?.label || 'Available'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 180,
  },
  compactBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  compactEmoji: {
    fontSize: 11,
  },
  emoji: {
    fontSize: 12,
    marginRight: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
