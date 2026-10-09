import { MeshPacket, UserProfile, UserStatus } from '../../types';

export interface BeaconPayload {
  userId: string;
  displayName: string;
  avatar: string;
  gender: string;
  status: UserStatus;
  publicKey: string;
  fingerprint: string;
  batteryLevel?: number;
  timestamp: number;
}

export class P2PProtocol {
  private static seenPacketIds: Map<string, number> = new Map();
  private static readonly DEDUP_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Generates a unique packet identifier
   */
  public static generatePacketId(): string {
    return 'pkt_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  }

  /**
   * Checks if packet has already been seen/processed by this mesh node to prevent infinite loops
   */
  public static isPacketDuplicate(packetId: string): boolean {
    const now = Date.now();
    // Periodically prune stale cache entries
    if (this.seenPacketIds.size > 2000) {
      for (const [id, time] of this.seenPacketIds.entries()) {
        if (now - time > this.DEDUP_CACHE_TTL_MS) {
          this.seenPacketIds.delete(id);
        }
      }
    }

    if (this.seenPacketIds.has(packetId)) {
      return true;
    }

    this.seenPacketIds.set(packetId, now);
    return false;
  }

  /**
   * Packs user profile & live availability status into a compact beacon string
   */
  public static serializeBeacon(profile: UserProfile, batteryLevel: number = 88): string {
    const payload: BeaconPayload = {
      userId: profile.id,
      displayName: profile.displayName,
      avatar: profile.avatar,
      gender: profile.gender,
      status: profile.status,
      publicKey: profile.publicKey,
      fingerprint: profile.fingerprint,
      batteryLevel,
      timestamp: Date.now(),
    };
    return JSON.stringify(payload);
  }

  /**
   * Unpacks a received beacon string
   */
  public static deserializeBeacon(raw: string): BeaconPayload | null {
    try {
      const data = JSON.parse(raw);
      if (data && data.userId && data.publicKey) {
        return data as BeaconPayload;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Creates a mesh packet ready for broadcast or unicast routing
   */
  public static createPacket(params: {
    type: MeshPacket['type'];
    senderId: string;
    senderPublicKey: string;
    recipientId: string;
    encryptedPayload: string;
    nonce: string;
    ttl?: number;
    packetId?: string;
  }): MeshPacket {
    return {
      id: params.packetId || this.generatePacketId(),
      type: params.type,
      senderId: params.senderId,
      senderPublicKey: params.senderPublicKey,
      recipientId: params.recipientId,
      ttl: params.ttl !== undefined ? params.ttl : 5, // 5 mesh hops max
      hopCount: 0,
      timestamp: Date.now(),
      encryptedPayload: params.encryptedPayload,
      nonce: params.nonce,
    };
  }

  /**
   * Processes a mesh packet for forwarding (store-and-forward routing)
   * Returns true if packet should be relayed to neighboring peers
   */
  public static shouldRelay(packet: MeshPacket, myUserId: string): boolean {
    // If it's addressed specifically to me, consume it, do not relay
    if (packet.recipientId === myUserId) {
      return false;
    }

    // If it's from me, do not relay
    if (packet.senderId === myUserId) {
      return false;
    }

    // If TTL is exhausted, drop packet
    if (packet.ttl <= 1) {
      return false;
    }

    return true;
  }

  /**
   * Prepares a packet for the next mesh hop
   */
  public static decrementTtlForRelay(packet: MeshPacket): MeshPacket {
    return {
      ...packet,
      ttl: packet.ttl - 1,
      hopCount: packet.hopCount + 1,
    };
  }
}
