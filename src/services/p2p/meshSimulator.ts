import { PeerDevice, MeshPacket } from '../../types';
import { generateIdentityKeyPair, encryptDirectMessage, decryptDirectMessage, KeyPair } from '../crypto/e2ee';
import { P2PProtocol } from './protocol';

export interface SimulatedPeerState {
  device: PeerDevice;
  keyPair: KeyPair;
  autoReply: boolean;
}

export class MeshSimulator {
  private peers: Map<string, SimulatedPeerState> = new Map();
  private isEnabled: boolean = true;
  private onPacketOutCallback?: (packet: MeshPacket) => void;
  private onPeerDiscoveredCallback?: (peer: PeerDevice) => void;
  private rssiTimer: any = null;

  constructor(callbacks?: {
    onPacketOut?: (packet: MeshPacket) => void;
    onPeerDiscovered?: (peer: PeerDevice) => void;
  }) {
    if (callbacks) {
      this.onPacketOutCallback = callbacks.onPacketOut;
      this.onPeerDiscoveredCallback = callbacks.onPeerDiscovered;
    }
    this.initializeSimulatedPeers();
  }

  public setCallbacks(callbacks: {
    onPacketOut: (packet: MeshPacket) => void;
    onPeerDiscovered: (peer: PeerDevice) => void;
  }) {
    this.onPacketOutCallback = callbacks.onPacketOut;
    this.onPeerDiscoveredCallback = callbacks.onPeerDiscovered;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  private initializeSimulatedPeers() {
    // Generate real cryptographic keypairs for realistic E2EE verification
    const kpAlice = generateIdentityKeyPair();
    const kpBob = generateIdentityKeyPair();
    const kpCharlie = generateIdentityKeyPair();

    const alice: PeerDevice = {
      id: 'peer_alice_01',
      displayName: 'Alice Walker',
      avatar: 'avatar_6', // Cat / Pink
      gender: 'female',
      status: {
        availability: 'free',
        emoji: '🟢',
        customText: 'Free to chat! Testing BLE mesh 📶',
        updatedAt: Date.now() - 1000 * 60 * 5,
      },
      publicKey: kpAlice.publicKey,
      fingerprint: kpAlice.publicKey.substring(0, 12),
      rssi: -48,
      proximity: 'immediate',
      connectionType: 'ble',
      hopCount: 0,
      batteryLevel: 94,
      lastSeen: Date.now(),
      isOnline: true,
    };

    const bob: PeerDevice = {
      id: 'peer_bob_02',
      displayName: 'Bob Miller',
      avatar: 'avatar_3', // Rocket / Blue
      gender: 'male',
      status: {
        availability: 'gym',
        emoji: '💪',
        customText: 'Gym workout, check messages periodically',
        updatedAt: Date.now() - 1000 * 60 * 25,
      },
      publicKey: kpBob.publicKey,
      fingerprint: kpBob.publicKey.substring(0, 12),
      rssi: -67,
      proximity: 'near',
      connectionType: 'wifi_direct',
      hopCount: 0,
      batteryLevel: 81,
      lastSeen: Date.now(),
      isOnline: true,
    };

    const charlie: PeerDevice = {
      id: 'peer_charlie_03',
      displayName: 'Charlie Zhao',
      avatar: 'avatar_5', // Wolf / Dark
      gender: 'non-binary',
      status: {
        availability: 'work',
        emoji: '💼',
        customText: 'Coding secure P2P mesh protocols',
        updatedAt: Date.now() - 1000 * 60 * 40,
      },
      publicKey: kpCharlie.publicKey,
      fingerprint: kpCharlie.publicKey.substring(0, 12),
      rssi: -83,
      proximity: 'far',
      connectionType: 'mesh_relay',
      hopCount: 1, // Multi-hop mesh relay node
      batteryLevel: 63,
      lastSeen: Date.now(),
      isOnline: true,
    };

    this.peers.set(alice.id, { device: alice, keyPair: kpAlice, autoReply: true });
    this.peers.set(bob.id, { device: bob, keyPair: kpBob, autoReply: true });
    this.peers.set(charlie.id, { device: charlie, keyPair: kpCharlie, autoReply: true });
  }

  /**
   * Broadcasts all simulated peers to the app discovery engine
   */
  public emitDiscoveryBeacons() {
    if (!this.isEnabled || !this.onPeerDiscoveredCallback) return;

    for (const peerState of this.peers.values()) {
      // Add slight jitter to RSSI for realistic radar display
      const jitter = Math.floor(Math.random() * 5) - 2;
      const updatedRssi = Math.max(-95, Math.min(-35, peerState.device.rssi + jitter));
      
      let proximity: PeerDevice['proximity'] = 'near';
      if (updatedRssi >= -55) proximity = 'immediate';
      else if (updatedRssi <= -78) proximity = 'far';

      const updatedDevice = {
        ...peerState.device,
        rssi: updatedRssi,
        proximity,
        lastSeen: Date.now(),
      };
      peerState.device = updatedDevice;
      this.onPeerDiscoveredCallback(updatedDevice);
    }
  }

  /**
   * Simulates receiving a packet dispatched from the user's app
   */
  public handleOutboundPacket(packet: MeshPacket, myProfileId: string, myPublicKey: string) {
    if (!this.isEnabled) return;

    const targetPeerState = this.peers.get(packet.recipientId);
    if (!targetPeerState) return;

    // Simulate direct network latency (100ms - 400ms)
    setTimeout(() => {
      // 1. Send ACK (Delivered)
      const ackPacket: MeshPacket = {
        id: P2PProtocol.generatePacketId(),
        type: 'ACK',
        senderId: targetPeerState.device.id,
        senderPublicKey: targetPeerState.keyPair.publicKey,
        recipientId: myProfileId,
        ttl: 4,
        hopCount: 0,
        timestamp: Date.now(),
        encryptedPayload: JSON.stringify({ ackPacketId: packet.id, status: 'delivered' }),
        nonce: '',
      };

      if (this.onPacketOutCallback) {
        this.onPacketOutCallback(ackPacket);
      }

      // 2. Try decrypting user message to verify Curve25519 E2EE
      let decryptedText = '';
      try {
        if (packet.type === 'MSG' && packet.nonce) {
          decryptedText = decryptDirectMessage(
            packet.encryptedPayload,
            packet.nonce,
            myPublicKey,
            targetPeerState.keyPair.secretKey
          );
          console.log(`[Simulator] Peer ${targetPeerState.device.displayName} decrypted: "${decryptedText}"`);
        }
      } catch (err) {
        console.warn('[Simulator] Peer could not decrypt packet:', err);
      }

      // 3. Send READ receipt after 1.5s
      setTimeout(() => {
        const readPacket: MeshPacket = {
          id: P2PProtocol.generatePacketId(),
          type: 'READ',
          senderId: targetPeerState.device.id,
          senderPublicKey: targetPeerState.keyPair.publicKey,
          recipientId: myProfileId,
          ttl: 4,
          hopCount: 0,
          timestamp: Date.now(),
          encryptedPayload: JSON.stringify({ ackPacketId: packet.id, status: 'read' }),
          nonce: '',
        };

        if (this.onPacketOutCallback) {
          this.onPacketOutCallback(readPacket);
        }

        // 4. Send an encrypted reply if autoReply is enabled
        if (targetPeerState.autoReply && packet.type === 'MSG') {
          setTimeout(() => {
            this.sendSimulatedPeerReply(targetPeerState, myProfileId, myPublicKey, decryptedText);
          }, 2000);
        }
      }, 1500);

    }, 350);
  }

  /**
   * Generates a context-aware simulated reply and encrypts it with Curve25519
   */
  private sendSimulatedPeerReply(
    peerState: SimulatedPeerState,
    myProfileId: string,
    myPublicKey: string,
    userMessage: string
  ) {
    if (!this.onPacketOutCallback) return;

    let replyText = 'Received your message securely over offline P2P mesh! 🔐';
    const lower = userMessage.toLowerCase();

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      replyText = `Hello! Connected via direct ${peerState.device.connectionType.toUpperCase()} mesh. No internet needed!`;
    } else if (lower.includes('file') || lower.includes('photo') || lower.includes('audio')) {
      replyText = 'File chunk received & verified via SHA-256 checksum! 📎';
    } else if (lower.includes('status') || lower.includes('mood')) {
      replyText = `My current broadcast status is: ${peerState.device.status.emoji} "${peerState.device.status.customText}"`;
    } else if (lower.includes('test')) {
      replyText = 'P2P Store-and-forward mesh routing latency: ~35ms. Signal RSSI: ' + peerState.device.rssi + ' dBm.';
    }

    // Encrypt response using peer's secret key and user's public key
    const encrypted = encryptDirectMessage(replyText, myPublicKey, peerState.keyPair.secretKey);
    const replyPacket = P2PProtocol.createPacket({
      type: 'MSG',
      senderId: peerState.device.id,
      senderPublicKey: peerState.keyPair.publicKey,
      recipientId: myProfileId,
      encryptedPayload: encrypted.ciphertext,
      nonce: encrypted.nonce,
    });

    this.onPacketOutCallback(replyPacket);
  }

  public getPeer(peerId: string): SimulatedPeerState | undefined {
    return this.peers.get(peerId);
  }

  public getAllPeers(): PeerDevice[] {
    return Array.from(this.peers.values()).map(p => p.device);
  }

  /**
   * Updates a simulated peer's broadcast status (for testing live status beacon updates)
   */
  public updatePeerStatus(peerId: string, emoji: string, customText: string) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.device.status = {
        ...peer.device.status,
        emoji,
        customText,
        updatedAt: Date.now(),
      };
      this.emitDiscoveryBeacons();
    }
  }
}
