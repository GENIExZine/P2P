import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { PeerDevice } from '../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onOpenRadar?: () => void;
  onOpenStatus?: () => void;
  onOpenSettings?: () => void;
  onOpenSafetyNumber?: () => void;
  isScanning?: boolean;
  peer?: PeerDevice | null;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  onOpenRadar,
  onOpenStatus,
  onOpenSettings,
  onOpenSafetyNumber,
  isScanning,
  peer,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.leftRow}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onOpenSettings} style={styles.iconBtn}>
            <Ionicons name="menu" size={26} color={colors.text} />
          </TouchableOpacity>
        )}

        <View style={styles.titleWrapper}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <View style={styles.subtitleRow}>
              {peer && (
                <View
                  style={[
                    styles.onlineDot,
                    { backgroundColor: peer.isOnline ? colors.onlineBadge : colors.textMuted },
                  ]}
                />
              )}
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightRow}>
        {/* Active scan indicator */}
        {isScanning && (
          <View style={styles.scanIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {/* Safety Number Button (in 1-on-1 chats) */}
        {onOpenSafetyNumber && (
          <TouchableOpacity onPress={onOpenSafetyNumber} style={styles.iconBtn}>
            <Ionicons name="shield-checkmark" size={20} color="#4FAE4E" />
          </TouchableOpacity>
        )}

        {/* Status Broadcast Button */}
        {onOpenStatus && (
          <TouchableOpacity onPress={onOpenStatus} style={styles.iconBtn}>
            <Ionicons name="radio-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Radar Button */}
        {onOpenRadar && (
          <TouchableOpacity onPress={onOpenRadar} style={styles.iconBtn}>
            <Ionicons name="compass-outline" size={23} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  subtitle: {
    fontSize: 12,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  scanIndicator: {
    paddingHorizontal: 6,
  },
});
