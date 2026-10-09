import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PeerDevice, UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { generateSafetyNumber } from '../services/crypto/e2ee';

interface SafetyNumberModalProps {
  visible: boolean;
  peer: PeerDevice | null;
  myProfile: UserProfile | null;
  onClose: () => void;
}

export const SafetyNumberModal: React.FC<SafetyNumberModalProps> = ({
  visible,
  peer,
  myProfile,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [isVerified, setIsVerified] = useState(false);

  if (!peer || !myProfile) return null;

  const safetyNumber = generateSafetyNumber(myProfile.publicKey, peer.publicKey);
  const blocks = safetyNumber.split(' ');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: '#4FAE4E20' }]}>
              <Ionicons name="shield-checkmark" size={28} color="#4FAE4E" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Safety Number Verification</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              End-to-End Encryption with {peer.displayName}
            </Text>
          </View>

          {/* 60-Digit Cryptographic Safety Number Grid */}
          <View style={[styles.numberCard, { backgroundColor: isDark ? colors.background : colors.surfaceElevated }]}>
            <View style={styles.grid}>
              {blocks.map((block, idx) => (
                <View key={idx} style={styles.blockCell}>
                  <Text style={[styles.blockText, { color: colors.text }]}>{block}</Text>
                </View>
              ))}
            </View>

            <View style={styles.fingerprintRow}>
              <Text style={[styles.fpLabel, { color: colors.textMuted }]}>Peer Curve25519 Fingerprint:</Text>
              <Text style={[styles.fpValue, { color: colors.primary }]}>{peer.fingerprint}</Text>
            </View>
          </View>

          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            If you wish to verify the security of your end-to-end encryption with {peer.displayName}, compare the numbers above with their device in person.
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.verifyBtn, { backgroundColor: isVerified ? '#4FAE4E' : colors.primary }]}
              onPress={() => setIsVerified(!isVerified)}
            >
              <Ionicons name={isVerified ? 'checkmark-circle' : 'finger-print'} size={18} color="#FFF" />
              <Text style={styles.verifyBtnText}>
                {isVerified ? 'Marked as Verified' : 'Mark as Verified'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.closeBtn, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.closeBtnText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  numberCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  blockCell: {
    width: '30%',
    alignItems: 'center',
  },
  blockText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  fingerprintRow: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.3)',
    alignItems: 'center',
  },
  fpLabel: {
    fontSize: 11,
  },
  fpValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'column',
    gap: 8,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
