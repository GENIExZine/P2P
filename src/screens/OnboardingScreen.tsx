import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AVATAR_PRESETS } from '../constants/presets';
import { Gender } from '../types';

export const OnboardingScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { createProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');
  const [gender, setGender] = useState<Gender>('prefer-not-to-say');
  const [bio, setBio] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const genderOptions: { key: Gender; label: string }[] = [
    { key: 'male', label: 'Male' },
    { key: 'female', label: 'Female' },
    { key: 'non-binary', label: 'Non-binary' },
    { key: 'prefer-not-to-say', label: 'Prefer not to say' },
  ];

  const handleCompleteSetup = async () => {
    if (!displayName.trim()) {
      setErrorMessage('Please enter your Display Name');
      return;
    }
    setErrorMessage('');
    setIsCreating(true);

    try {
      await createProfile({
        displayName: displayName.trim(),
        avatar: selectedAvatar,
        gender,
        bio: bio.trim(),
      });
    } catch (e) {
      console.error(e);
      setErrorMessage('Failed to generate identity keys. Please try again.');
      setIsCreating(false);
    }
  };

  const currentAvatarInfo = AVATAR_PRESETS.find(a => a.id === selectedAvatar) || AVATAR_PRESETS[0];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Branding */}
        <View style={styles.brandingHeader}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="radio" size={36} color="#FFFFFF" />
          </View>
          <Text style={[styles.appTitle, { color: colors.text }]}>P2P Mesh Messenger</Text>
          <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
            Secure, serverless peer-to-peer communication over BLE & local Wi-Fi Direct.
          </Text>
        </View>

        {/* Security / Privacy Banner */}
        <View style={[styles.securityNotice, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
          <Ionicons name="shield-checkmark" size={20} color="#4FAE4E" />
          <Text style={[styles.securityNoticeText, { color: colors.textSecondary }]}>
            Zero cloud servers or phone numbers. Your identity is backed by local Curve25519 (libsodium) cryptography.
          </Text>
        </View>

        {/* Form Container */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>MANDATORY PROFILE SETUP</Text>

          {/* Active Avatar Preview */}
          <View style={styles.avatarPreviewWrapper}>
            <View style={[styles.largeAvatarCircle, { backgroundColor: currentAvatarInfo.color }]}>
              <Text style={styles.largeAvatarEmoji}>{currentAvatarInfo.icon}</Text>
            </View>
            <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>Choose your mesh avatar</Text>
          </View>

          {/* Avatar Selector Grid */}
          <View style={styles.avatarGrid}>
            {AVATAR_PRESETS.map((item) => {
              const isSelected = selectedAvatar === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.avatarChoice,
                    {
                      backgroundColor: item.color,
                      borderColor: isSelected ? '#FFFFFF' : 'transparent',
                      borderWidth: isSelected ? 3 : 0,
                    },
                  ]}
                  onPress={() => setSelectedAvatar(item.id)}
                >
                  <Text style={styles.avatarChoiceEmoji}>{item.icon}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Display Name Input */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>DISPLAY NAME *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? colors.background : colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="e.g. Alex Hunter"
            placeholderTextColor={colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={30}
          />

          {/* Gender Selector */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>GENDER *</Text>
          <View style={styles.genderRow}>
            {genderOptions.map((g) => {
              const isSelected = gender === g.key;
              return (
                <TouchableOpacity
                  key={g.key}
                  style={[
                    styles.genderChip,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : (isDark ? colors.background : colors.surfaceElevated),
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setGender(g.key)}
                >
                  <Text
                    style={[
                      styles.genderChipText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Optional Bio */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ABOUT / BIO (OPTIONAL)</Text>
          <TextInput
            style={[
              styles.input,
              styles.bioInput,
              {
                backgroundColor: isDark ? colors.background : colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Available nearby for offline mesh chat..."
            placeholderTextColor={colors.textMuted}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={80}
          />

          {errorMessage.length > 0 && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleCompleteSetup}
            disabled={isCreating}
            activeOpacity={0.8}
          >
            <Ionicons name="key" size={20} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>
              {isCreating ? 'Generating Cryptographic Keys...' : 'Generate Keys & Join Mesh'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  brandingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  avatarPreviewWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  largeAvatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  largeAvatarEmoji: {
    fontSize: 36,
  },
  avatarHint: {
    fontSize: 12,
    marginTop: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  avatarChoice: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChoiceEmoji: {
    fontSize: 22,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
  },
  bioInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  genderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  genderChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF5350',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
