import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserStatus, AvailabilityStatus } from '../types';
import { STATUS_PRESETS } from '../constants/presets';
import { useTheme } from '../context/ThemeContext';
import { useP2P } from '../context/P2PContext';
import { useAuth } from '../context/AuthContext';

interface StatusBroadcastModalProps {
  visible: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['🟢', '🔴', '💼', '💪', '✈️', '🌙', '☕', '🎮', '📚', '🔥', '🏖️', '💻', '🎧', '🚀'];

export const StatusBroadcastModal: React.FC<StatusBroadcastModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const { broadcastStatus } = useP2P();

  const currentStatus = profile?.status;
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityStatus>(
    currentStatus?.availability || 'free'
  );
  const [selectedEmoji, setSelectedEmoji] = useState(currentStatus?.emoji || '🟢');
  const [customText, setCustomText] = useState(currentStatus?.customText || '');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleSelectPreset = (availability: AvailabilityStatus, emoji: string, defaultText: string) => {
    setSelectedAvailability(availability);
    setSelectedEmoji(emoji);
    if (!customText || customText === currentStatus?.customText) {
      setCustomText(defaultText);
    }
  };

  const handleBroadcast = async () => {
    setIsBroadcasting(true);
    const newStatus: UserStatus = {
      availability: selectedAvailability,
      emoji: selectedEmoji,
      customText: customText.trim(),
      updatedAt: Date.now(),
    };

    await broadcastStatus(newStatus);
    setIsBroadcasting(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[styles.modalCard, { backgroundColor: colors.surface, borderTopColor: colors.border }]} 
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.dragBar} />

          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="radio" size={22} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Offline Broadcast Status</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Synced instantly over local BLE & Wi-Fi Direct beacons. No internet required.
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Presets Grid */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>AVAILABILITY PRESET</Text>
            <View style={styles.presetGrid}>
              {STATUS_PRESETS.map((preset) => {
                const isSelected = selectedAvailability === preset.availability;
                return (
                  <TouchableOpacity
                    key={preset.availability}
                    style={[
                      styles.presetItem,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + '25'
                          : (isDark ? colors.background : colors.surfaceElevated),
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectPreset(preset.availability, preset.emoji, preset.label)}
                  >
                    <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                    <Text
                      style={[
                        styles.presetLabel,
                        { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Emoji Picker */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MOOD / ACTIVITY EMOJI</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
              <View style={styles.emojiRow}>
                {EMOJI_OPTIONS.map((emoji) => {
                  const isSelected = selectedEmoji === emoji;
                  return (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiBtn,
                        {
                          backgroundColor: isSelected
                            ? colors.primary + '30'
                            : (isDark ? colors.background : colors.surfaceElevated),
                          borderColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                      onPress={() => setSelectedEmoji(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Custom Status Text Input */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CUSTOM ACTIVITY DESCRIPTION</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? colors.background : colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={styles.inputEmojiPreview}>{selectedEmoji}</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="What are you doing? (e.g., Coding, Reading)"
                placeholderTextColor={colors.textMuted}
                value={customText}
                onChangeText={setCustomText}
                maxLength={45}
              />
            </View>

            {/* Live Beacon Preview */}
            <View style={[styles.previewBox, { backgroundColor: isDark ? colors.background : colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.previewLabel, { color: colors.textMuted }]}>PEER RADAR PREVIEW:</Text>
              <View style={styles.previewContent}>
                <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
                <View>
                  <Text style={[styles.previewName, { color: colors.text }]}>{profile?.displayName || 'You'}</Text>
                  <Text style={[styles.previewStatusText, { color: colors.textSecondary }]}>
                    {customText || 'Available to chat'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Broadcast Action Button */}
            <TouchableOpacity
              style={[styles.broadcastBtn, { backgroundColor: colors.primary }]}
              onPress={handleBroadcast}
              disabled={isBroadcasting}
              activeOpacity={0.8}
            >
              <Ionicons name="radio-outline" size={20} color="#FFFFFF" />
              <Text style={styles.broadcastBtnText}>
                {isBroadcasting ? 'Updating Beacon...' : 'Broadcast to Nearby Mesh'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150,150,150,0.4)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetEmoji: {
    fontSize: 18,
  },
  presetLabel: {
    fontSize: 13,
  },
  emojiScroll: {
    marginBottom: 6,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  emojiText: {
    fontSize: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputEmojiPreview: {
    fontSize: 20,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
  },
  previewBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewEmoji: {
    fontSize: 22,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewStatusText: {
    fontSize: 12,
    marginTop: 1,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 10,
  },
  broadcastBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
