import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useP2P } from '../context/P2PContext';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { PeerRadarCard } from '../components/PeerRadarCard';
import { SCAN_DUTY_CYCLES } from '../constants/presets';
import { PeerDevice, ScanMode } from '../types';

interface RadarScreenProps {
  onBack: () => void;
  onSelectPeer: (peer: PeerDevice) => void;
}

export const RadarScreen: React.FC<RadarScreenProps> = ({ onBack, onSelectPeer }) => {
  const { colors, isDark } = useTheme();
  const { 
    peers, 
    scanMode, 
    isScanning, 
    setScanMode, 
    triggerManualScan 
  } = useP2P();

  const scanModesList: ScanMode[] = ['active', 'balanced', 'battery_saver', 'manual'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Nearby Mesh Radar"
        subtitle={`${peers.length} active peers detected nearby`}
        onBack={onBack}
        isScanning={isScanning}
      />

      {/* Radar Animation / Status Section */}
      <View style={[styles.radarHero, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.radarVisualContainer}>
          <View style={[styles.radarOuterRing, { borderColor: colors.primary + '30' }]}>
            <View style={[styles.radarMiddleRing, { borderColor: colors.primary + '60' }]}>
              <View style={[styles.radarCenterCircle, { backgroundColor: colors.primary }]}>
                {isScanning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="radio" size={24} color="#FFFFFF" />
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.radarHeroText}>
          <Text style={[styles.radarHeroTitle, { color: colors.text }]}>
            {isScanning ? 'Scanning Mesh Channels...' : 'Mesh Discovery Ready'}
          </Text>
          <Text style={[styles.radarHeroDesc, { color: colors.textSecondary }]}>
            Advertising & listening over Bluetooth Low Energy & local Wi-Fi Direct.
          </Text>

          <TouchableOpacity
            style={[styles.manualScanBtn, { backgroundColor: colors.primary }]}
            onPress={triggerManualScan}
            disabled={isScanning}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color="#FFF" />
            <Text style={styles.manualScanBtnText}>
              {isScanning ? 'Scanning In Progress...' : 'Scan Now (Manual)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Battery Optimization / Duty Cycle Switcher */}
      <View style={[styles.dutyCycleSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.dutyCycleHeader}>
          <Ionicons name="battery-charging" size={16} color="#4FAE4E" />
          <Text style={[styles.dutyCycleTitle, { color: colors.text }]}>
            BATTERY SCANNING DUTY CYCLE
          </Text>
        </View>

        <View style={styles.tabRow}>
          {scanModesList.map((mode) => {
            const isSelected = scanMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : (isDark ? colors.background : colors.surfaceElevated),
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setScanMode(mode)}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {mode === 'battery_saver' ? 'Eco' : mode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.dutyDesc, { color: colors.textSecondary }]}>
          {SCAN_DUTY_CYCLES[scanMode].description}
        </Text>
      </View>

      {/* Discovered Peers List */}
      <View style={styles.listHeader}>
        <Text style={[styles.listHeaderTitle, { color: colors.textSecondary }]}>
          NEARBY ACTIVE PEERS ({peers.length})
        </Text>
      </View>

      <FlatList
        data={peers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PeerRadarCard
            peer={item}
            onSelectPeer={onSelectPeer}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Ionicons name="search" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyListTitle, { color: colors.text }]}>No Peers Detected</Text>
            <Text style={[styles.emptyListDesc, { color: colors.textSecondary }]}>
              Make sure nearby devices have Bluetooth turned on and the P2P app open.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  radarHero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  radarVisualContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarOuterRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarMiddleRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCenterCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarHeroText: {
    flex: 1,
  },
  radarHeroTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  radarHeroDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  manualScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  manualScanBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dutyCycleSection: {
    margin: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  dutyCycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dutyCycleTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dutyDesc: {
    fontSize: 11,
    marginTop: 8,
    lineHeight: 15,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyList: {
    alignItems: 'center',
    padding: 30,
    gap: 8,
  },
  emptyListTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyListDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
});
