import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PeerDevice } from '../types';
import { useTheme } from '../context/ThemeContext';
import { AVATAR_PRESETS } from '../constants/presets';
import { StatusBadge } from './StatusBadge';

interface PeerRadarCardProps {
  peer: PeerDevice;
  onSelectPeer: (peer: PeerDevice) => void;
  onViewSafetyNumber?: (peer: PeerDevice) => void;
}

export const PeerRadarCard: React.FC<PeerRadarCardProps> = ({ 
  peer, 
  onSelectPeer, 
  onViewSafetyNumber 
}) => {
  const { colors, isDark } = useTheme();

  const avatarInfo = AVATAR_PRESETS.find(a => a.id === peer.avatar) || AVATAR_PRESETS[0];

  const getProximityColor = () => {
    switch (peer.proximity) {
      case 'immediate': return '#4FAE4E';
      case 'near': return colors.primary;
      case 'far': return '#FB8C00';
    }
  };

  const getTransportLabel = () => {
    switch (peer.connectionType) {
      case 'ble': return 'BLE Mesh';
      case 'wifi_direct': return 'Wi-Fi Direct';
      case 'mesh_relay': return `Relay (${peer.hopCount} hop)`;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarInfo.color }]}>
            <Text style={styles.avatarEmoji}>{avatarInfo.icon}</Text>
          </View>
          <View style={[styles.onlinePill, { backgroundColor: peer.isOnline ? colors.onlineBadge : colors.textMuted }]} />
        </View>

        <View style={styles.mainInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {peer.displayName}
            </Text>
            <View style={[styles.proximityTag, { backgroundColor: getProximityColor() + '20', borderColor: getProximityColor() }]}>
              <Text style={[styles.proximityText, { color: getProximityColor() }]}>
                {peer.proximity.toUpperCase()} ({peer.rssi} dBm)
              </Text>
            </View>
          </View>

          {/* Broadcast Mood & Activity */}
          <View style={styles.statusRow}>
            <StatusBadge status={peer.status} />
          </View>
        </View>
      </View>

      {/* Hardware Transport & Battery Metrics */}
      <View style={[styles.metricsRow, { borderTopColor: colors.border }]}>
        <View style={styles.metricItem}>
          <Ionicons 
            name={peer.connectionType === 'wifi_direct' ? 'wifi' : (peer.connectionType === 'ble' ? 'bluetooth' : 'git-network')} 
            size={14} 
            color={colors.primary} 
          />
          <Text style={[styles.metricText, { color: colors.textSecondary }]}>
            {getTransportLabel()}
          </Text>
        </View>

        {peer.batteryLevel !== undefined && (
          <View style={styles.metricItem}>
            <Ionicons name="battery-charging" size={14} color="#4FAE4E" />
            <Text style={[styles.metricText, { color: colors.textSecondary }]}>
              {peer.batteryLevel}% battery
            </Text>
          </View>
        )}

        <View style={styles.actionsGroup}>
          {onViewSafetyNumber && (
            <TouchableOpacity 
              style={[styles.smallBtn, { borderColor: colors.border }]} 
              onPress={() => onViewSafetyNumber(peer)}
            >
              <Ionicons name="shield-outline" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.chatBtn, { backgroundColor: colors.primary }]} 
            onPress={() => onSelectPeer(peer)}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses" size={14} color="#FFF" />
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  onlinePill: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  mainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  proximityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 6,
  },
  proximityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusRow: {
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chatBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
