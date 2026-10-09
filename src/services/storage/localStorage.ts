import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, ChatSession, ChatMessage, PeerDevice, ThemeMode, ScanMode } from '../../types';
import { KeyPair } from '../crypto/e2ee';

const KEYS = {
  USER_PROFILE: '@p2p_user_profile',
  KEY_PAIR: '@p2p_identity_keypair',
  CHATS: '@p2p_chat_sessions',
  MESSAGES_PREFIX: '@p2p_messages_',
  THEME_MODE: '@p2p_theme_mode',
  SCAN_MODE: '@p2p_scan_mode',
  PEERS_CACHE: '@p2p_cached_peers',
  OUTBOX_QUEUE: '@p2p_outbox_queue',
};

export const LocalStorage = {
  // User Profile
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading user profile', e);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  // KeyPair (strictly stored on-device)
  async getKeyPair(): Promise<KeyPair | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.KEY_PAIR);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading keypair', e);
      return null;
    }
  },

  async saveKeyPair(keyPair: KeyPair): Promise<void> {
    await AsyncStorage.setItem(KEYS.KEY_PAIR, JSON.stringify(keyPair));
  },

  // Chat Sessions
  async getChatSessions(): Promise<ChatSession[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHATS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading chat sessions', e);
      return [];
    }
  },

  async saveChatSessions(chats: ChatSession[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.CHATS, JSON.stringify(chats));
  },

  // Messages per Chat
  async getMessages(chatId: string): Promise<ChatMessage[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MESSAGES_PREFIX + chatId);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading messages for ' + chatId, e);
      return [];
    }
  },

  async saveMessages(chatId: string, messages: ChatMessage[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.MESSAGES_PREFIX + chatId, JSON.stringify(messages));
  },

  // Discovered Peers
  async getCachedPeers(): Promise<PeerDevice[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PEERS_CACHE);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async saveCachedPeers(peers: PeerDevice[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.PEERS_CACHE, JSON.stringify(peers));
  },

  // Outbox Mesh Queue
  async getOutboxQueue(): Promise<ChatMessage[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.OUTBOX_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async saveOutboxQueue(queue: ChatMessage[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.OUTBOX_QUEUE, JSON.stringify(queue));
  },

  // App Settings
  async getThemeMode(): Promise<ThemeMode> {
    const mode = await AsyncStorage.getItem(KEYS.THEME_MODE);
    return (mode as ThemeMode) || 'system';
  },

  async saveThemeMode(mode: ThemeMode): Promise<void> {
    await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
  },

  async getScanMode(): Promise<ScanMode> {
    const mode = await AsyncStorage.getItem(KEYS.SCAN_MODE);
    return (mode as ScanMode) || 'balanced';
  },

  async saveScanMode(mode: ScanMode): Promise<void> {
    await AsyncStorage.setItem(KEYS.SCAN_MODE, mode);
  },

  // Clear data (Factory Reset)
  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
  },
};
