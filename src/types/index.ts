export type Gender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';

export type AvailabilityStatus = 
  | 'free'        // Free to chat
  | 'busy'        // Busy
  | 'work'        // At work
  | 'gym'         // Gym
  | 'traveling'   // Traveling
  | 'sleeping'    // Sleeping
  | 'custom';     // Custom user status

export interface UserStatus {
  availability: AvailabilityStatus;
  emoji: string;
  customText: string;
  updatedAt: number;
}

export interface UserProfile {
  id: string; // Unique peer ID (derived from public key hash)
  displayName: string;
  avatar: string; // Avatar identifier or data URI
  gender: Gender;
  bio?: string;
  status: UserStatus;
  publicKey: string; // Curve25519 Base64
  fingerprint: string; // Safety fingerprint
  createdAt: number;
}

export type ScanMode = 'active' | 'balanced' | 'battery_saver' | 'manual';

export interface ScanDutyCycleConfig {
  scanWindowMs: number;
  scanIntervalMs: number;
  label: string;
  description: string;
}

export interface PeerDevice {
  id: string;
  displayName: string;
  avatar: string;
  gender: Gender;
  status: UserStatus;
  publicKey: string;
  fingerprint: string;
  rssi: number; // Signal strength in dBm (-30 to -95)
  proximity: 'immediate' | 'near' | 'far'; // <1m, 1-5m, >5m
  connectionType: 'ble' | 'wifi_direct' | 'mesh_relay';
  hopCount: number; // 0 = direct neighbor, 1+ = multi-hop relay
  batteryLevel?: number;
  lastSeen: number;
  isOnline: boolean;
}

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'system';

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUri?: string; // base64 payload or local cache uri
  sha256: string;
  chunksTotal?: number;
  chunksReceived?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string; // User ID or Group ID
  isGroup: boolean;
  content: string; // Decrypted plaintext content
  type: MessageType;
  file?: FileMetadata;
  voiceDurationSec?: number;
  timestamp: number;
  status: MessageStatus;
  hopCount: number;
  isOutgoing: boolean;
  deliveredTo?: string[];
  readBy?: string[];
}

export interface ChatSession {
  id: string; // Peer ID or Group ID
  name: string;
  avatar: string;
  isGroup: boolean;
  participantIds: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isOnline: boolean;
  userStatus?: UserStatus;
  updatedAt: number;
}

// Low-level Mesh Network Packet
export interface MeshPacket {
  id: string;
  type: 'MSG' | 'ACK' | 'READ' | 'BEACON' | 'FILE_CHUNK' | 'RELAY';
  senderId: string;
  senderPublicKey: string;
  recipientId: string; // or '*' for broadcast beacon
  ttl: number; // Max hops remaining (default: 5)
  hopCount: number;
  timestamp: number;
  encryptedPayload: string; // Base64 ciphertext
  nonce: string; // Base64 nonce
  authTag?: string; // Signature/HMAC
}

export interface FileChunkPayload {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkIndex: number;
  totalChunks: number;
  chunkData: string; // Base64
  sha256: string;
}

export type ThemeMode = 'system' | 'dark' | 'light';
