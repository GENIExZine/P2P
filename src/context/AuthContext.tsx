import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserStatus, Gender } from '../types';
import { KeyPair, generateIdentityKeyPair, getShortFingerprint } from '../services/crypto/e2ee';
import { LocalStorage } from '../services/storage/localStorage';

interface AuthContextType {
  profile: UserProfile | null;
  keyPair: KeyPair | null;
  isLoading: boolean;
  isOnboarded: boolean;
  createProfile: (data: { displayName: string; avatar: string; gender: Gender; bio?: string }) => Promise<UserProfile>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateStatus: (status: UserStatus) => Promise<void>;
  resetAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  keyPair: null,
  isLoading: true,
  isOnboarded: false,
  createProfile: async () => { throw new Error('Not implemented'); },
  updateProfile: async () => {},
  updateStatus: async () => {},
  resetAccount: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocalIdentity();
  }, []);

  const loadLocalIdentity = async () => {
    try {
      const storedProfile = await LocalStorage.getUserProfile();
      let storedKeyPair = await LocalStorage.getKeyPair();

      if (storedProfile && storedKeyPair) {
        setProfile(storedProfile);
        setKeyPair(storedKeyPair);
      }
    } catch (e) {
      console.error('Failed to load local identity:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async (data: { displayName: string; avatar: string; gender: Gender; bio?: string }): Promise<UserProfile> => {
    // Generate fresh Curve25519 identity keypair locally
    const newKeyPair = generateIdentityKeyPair();
    const fingerprint = getShortFingerprint(newKeyPair.publicKey);
    const userId = 'usr_' + Math.random().toString(36).substring(2, 9);

    const initialStatus: UserStatus = {
      availability: 'free',
      emoji: '🟢',
      customText: 'Free to chat on P2P mesh',
      updatedAt: Date.now(),
    };

    const newProfile: UserProfile = {
      id: userId,
      displayName: data.displayName.trim(),
      avatar: data.avatar,
      gender: data.gender,
      bio: data.bio?.trim() || '',
      status: initialStatus,
      publicKey: newKeyPair.publicKey,
      fingerprint,
      createdAt: Date.now(),
    };

    await LocalStorage.saveKeyPair(newKeyPair);
    await LocalStorage.saveUserProfile(newProfile);

    setKeyPair(newKeyPair);
    setProfile(newProfile);

    return newProfile;
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    await LocalStorage.saveUserProfile(updated);
    setProfile(updated);
  };

  const updateStatus = async (status: UserStatus) => {
    if (!profile) return;
    const updated = { ...profile, status };
    await LocalStorage.saveUserProfile(updated);
    setProfile(updated);
  };

  const resetAccount = async () => {
    await LocalStorage.clearAll();
    setProfile(null);
    setKeyPair(null);
  };

  const isOnboarded = Boolean(profile && profile.displayName && profile.avatar && profile.gender);

  return (
    <AuthContext.Provider
      value={{
        profile,
        keyPair,
        isLoading,
        isOnboarded,
        createProfile,
        updateProfile,
        updateStatus,
        resetAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
