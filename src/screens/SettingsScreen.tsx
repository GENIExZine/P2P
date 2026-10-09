import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useP2P } from '../context/P2PContext';
import { Header } from '../components/Header';
import { AVATAR_PRESETS, SCAN_DUTY_CYCLES } from '../constants/presets';
import { ThemeMode, ScanMode } from '../types';
import { P2PManager } from '../services/p2p/p2pManager';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { colors, themeMode, setThemeMode, isDark } = useTheme();
  const { profile, keyPair, resetAccount } = useAuth();
  const { scanMode, setScanMode } = useP2P();

  const simulator = P2PManager.getInstance().getSimulator();
  const [simulationEnabled, setSimulationEnabled] = useState(simulator.getIsEnabled());

  const avatarInfo = AVATAR_PRESETS.find(a => a.id === profile?.avatar) || AVATAR_PRESETS[0];

  const handleToggleSimulation = (value: boolean) => {
    setSimulationEnabled(value);
    simulator.setEnabled(value);
  };

  const handleClearData = () => {
    Alert.alert(
      'Reset Local Identity',
      'This will erase your local Curve25519 identity keys and all offline chat history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Erase Everything', 
          style: 'destructive', 
          onPress: async () => {
            await resetAccount();
          } 
        },
      ]
    );
  };

  const themeOptions: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'system', label: 'System Default', icon: 'phone-portrait-outline' },
    { key: 'dark', label: 'Dark Mode', icon: 'moon-outline' },
    { key: 'light', label: 'Light Mode', icon: 'sunny-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Settings"
        subtitle="Security, Theme & Network"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarInfo.color }]}>
            <Text style={styles.avatarEmoji}>{avatarInfo.icon}</Text>
          </View>

          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, { color: colors.text }]}>{profile?.displayName}</Text>
            <Text style={[styles.profileGender, { color: colors.textSecondary }]}>
              Gender: {profile?.gender}
            </Text>
            <Text style={[styles.profileStatus, { color: colors.primary }]}>
              {profile?.status.emoji} {profile?.status.customText || 'Available'}
            </Text>
          </View>
        </View>

        {/* Cryptographic Identity Fingerprint */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="key" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>LOCAL CRYPTOGRAPHIC IDENTITY</Text>
          </View>

          <View style={[styles.fpBox, { backgroundColor: isDark ? colors.background : colors.surfaceElevated }]}>
            <Text style={[styles.fpLabel, { color: colors.textMuted }]}>Curve25519 Public Key:</Text>
            <Text style={[styles.fpCode, { color: colors.text }]} numberOfLines={2} selectable>
              {profile?.publicKey || 'No key loaded'}
            </Text>
          </View>

          <View style={[styles.shieldRow, { borderTopColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={16} color="#4FAE4E" />
            <Text style={[styles.shieldDesc, { color: colors.textSecondary }]}>
              Private keys are kept strictly in device secure storage and never leave this phone.
            </Text>
          </View>
        </View>

        {/* Theme Settings (System Adaptation & Override) */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="color-palette" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>INTERFACE THEME</Text>
          </View>

          <View style={styles.themeOptionsGrid}>
            {themeOptions.map((opt) => {
              const isSelected = themeMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.themeOptionBtn,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : (isDark ? colors.background : colors.surfaceElevated),
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setThemeMode(opt.key)}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themeOptionLabel,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Battery Optimization & Mesh Scan Modes */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="battery-charging" size={18} color="#4FAE4E" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>SCANNING & BATTERY OPTIMIZATION</Text>
          </View>

          {(['active', 'balanced', 'battery_saver', 'manual'] as ScanMode[]).map((mode) => {
            const isSelected = scanMode === mode;
            const config = SCAN_DUTY_CYCLES[mode];
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.scanOptionRow,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + '18'
                      : 'transparent',
                    borderColor: isSelected ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => setScanMode(mode)}
              >
                <View style={styles.scanOptionRadio}>
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: isSelected ? colors.primary : colors.border },
                    ]}
                  >
                    {isSelected && (
                      <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                </View>

                <View style={styles.scanOptionDetails}>
                  <Text style={[styles.scanOptionLabel, { color: colors.text }]}>{config.label}</Text>
                  <Text style={[styles.scanOptionDesc, { color: colors.textSecondary }]}>
                    {config.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mesh Simulator Toggle */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <View style={styles.cardHeader}>
                <Ionicons name="hardware-chip-outline" size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>PEER MESH SIMULATOR</Text>
              </View>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>
                Simulates nearby active peers (Alice, Bob, Charlie) with realistic Curve25519 handshakes and signal drops for testing.
              </Text>
            </View>

            <Switch
              value={simulationEnabled}
              onValueChange={handleToggleSimulation}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Factory Reset */}
        <TouchableOpacity
          style={[styles.dangerBtn, { borderColor: colors.danger }]}
          onPress={handleClearData}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={[styles.dangerBtnText, { color: colors.danger }]}>
            Erase Local Keys & Reset Account
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
    gap: 14,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 30,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileGender: {
    fontSize: 12,
    marginTop: 2,
  },
  profileStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  fpBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  fpLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  fpCode: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  shieldDesc: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  themeOptionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOptionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  themeOptionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  scanOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  scanOptionRadio: {
    marginRight: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scanOptionDetails: {
    flex: 1,
  },
  scanOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  scanOptionDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    paddingRight: 12,
  },
  switchDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  dangerBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
