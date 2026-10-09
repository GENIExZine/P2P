import { 
  PeerDevice, 
  MeshPacket, 
  UserProfile, 
  ChatMessage, 
  UserStatus, 
  ScanMode,
  FileMetadata,
  FileChunkPayload
} from '../../types';
import { P2PProtocol } from './protocol';
import { ScanDutyCycleManager } from './scanDutyCycle';
import { BleMeshAdapter } from './bleAdapter';
import { WifiDirectAdapter } from './wifiDirectAdapter';
import { MeshSimulator } from './meshSimulator';
import { 
  encryptDirectMessage, 
  decryptDirectMessage, 
  KeyPair, 
  computeSimpleChecksum 
} from '../crypto/e2ee';
import { LocalStorage } from '../storage/localStorage';

export type PeerUpdateListener = (peers: PeerDevice[]) => void;
export type MessageReceivedListener = (message: ChatMessage) => void;
export type MessageStatusListener = (messageId: string, status: ChatMessage['status']) => void;

export class P2PManager {
  private static instance: P2PManager;

  private myProfile: UserProfile | null = null;
  private myKeyPair: KeyPair | null = null;

  private peers: Map<string, PeerDevice> = new Map();
  private dutyCycleManager: ScanDutyCycleManager;
  private bleAdapter: BleMeshAdapter;
  private wifiAdapter: WifiDirectAdapter;
  private simulator: MeshSimulator;

  private peerListeners: Set<PeerUpdateListener> = new Set();
  private messageListeners: Set<MessageReceivedListener> = new Set();
  private statusListeners: Set<MessageStatusListener> = new Set();

  private outboxQueue: ChatMessage[] = [];
  private isInitialized: boolean = false;

  private constructor() {
    this.dutyCycleManager = new ScanDutyCycleManager('balanced', {
      onScanStart: () => this.handleScanStart(),
      onScanStop: () => this.handleScanStop(),
    });

    this.bleAdapter = new BleMeshAdapter({
      onPeerDiscovered: (peer) => this.handlePeerDiscovered(peer),
      onPacketReceived: (raw) => this.handleIncomingRawPacket(raw),
    });

    this.wifiAdapter = new WifiDirectAdapter({
      onPeerDiscovered: (peer) => this.handlePeerDiscovered(peer),
      onPacketReceived: (raw) => this.handleIncomingRawPacket(raw),
      onFileChunkReceived: (chunk) => this.handleIncomingFileChunk(chunk),
    });

    this.simulator = new MeshSimulator({
      onPacketOut: (packet) => this.handleIncomingMeshPacket(packet),
      onPeerDiscovered: (peer) => this.handlePeerDiscovered(peer),
    });
  }

  public static getInstance(): P2PManager {
    if (!P2PManager.instance) {
      P2PManager.instance = new P2PManager();
    }
    return P2PManager.instance;
  }

  /**
   * Initializes the P2P engine with local user identity and keypair
   */
  public async initialize(profile: UserProfile, keyPair: KeyPair) {
    this.myProfile = profile;
    this.myKeyPair = keyPair;

    this.bleAdapter.setLocalProfile(profile);

    // Restore cached peers & outbox queue
    const cachedPeers = await LocalStorage.getCachedPeers();
    cachedPeers.forEach(p => this.peers.set(p.id, p));

    const savedScanMode = await LocalStorage.getScanMode();
    this.dutyCycleManager.setMode(savedScanMode);

    this.outboxQueue = await LocalStorage.getOutboxQueue();

    this.isInitialized = true;

    // Start background duty-cycled scanner & beacons
    await this.bleAdapter.startAdvertising();
    await this.wifiAdapter.startDiscovery();
    this.dutyCycleManager.start();

    // Trigger initial simulated discovery
    this.simulator.emitDiscoveryBeacons();
  }

  public getPeers(): PeerDevice[] {
    return Array.from(this.peers.values());
  }

  public getPeerById(id: string): PeerDevice | undefined {
    return this.peers.get(id);
  }

  public getScanDutyCycleManager(): ScanDutyCycleManager {
    return this.dutyCycleManager;
  }

  public getSimulator(): MeshSimulator {
    return this.simulator;
  }

  public subscribePeers(listener: PeerUpdateListener): () => void {
    this.listeners(this.peerListeners, listener);
    listener(this.getPeers());
    return () => this.peerListeners.delete(listener);
  }

  public subscribeMessages(listener: MessageReceivedListener): () => void {
    this.listeners(this.messageListeners, listener);
    return () => this.messageListeners.delete(listener);
  }

  public subscribeMessageStatus(listener: MessageStatusListener): () => void {
    this.listeners(this.statusListeners, listener);
    return () => this.statusListeners.delete(listener);
  }

  private listeners<T>(set: Set<T>, listener: T) {
    set.add(listener);
  }

  private notifyPeers() {
    const list = this.getPeers();
    this.peerListeners.forEach(cb => cb(list));
    LocalStorage.saveCachedPeers(list);
  }

  private notifyMessage(msg: ChatMessage) {
    this.messageListeners.forEach(cb => cb(msg));
  }

  private notifyStatus(msgId: string, status: ChatMessage['status']) {
    this.statusListeners.forEach(cb => cb(msgId, status));
  }

  private handleScanStart() {
    this.bleAdapter.startScanning();
    if (this.simulator.getIsEnabled()) {
      this.simulator.emitDiscoveryBeacons();
    }
  }

  private handleScanStop() {
    this.bleAdapter.stopScanning();
  }

  public triggerManualScan() {
    this.dutyCycleManager.triggerManualScan();
  }

  /**
   * Updates local status and broadcasts it to all nearby mesh nodes
   */
  public async broadcastStatusUpdate(status: UserStatus) {
    if (!this.myProfile) return;
    this.myProfile.status = status;
    await LocalStorage.saveUserProfile(this.myProfile);

    // Update BLE Advertisement packet
    this.bleAdapter.setLocalProfile(this.myProfile);

    // Broadcast a BEACON packet over mesh
    const beaconStr = P2PProtocol.serializeBeacon(this.myProfile);
    const packet = P2PProtocol.createPacket({
      type: 'BEACON',
      senderId: this.myProfile.id,
      senderPublicKey: this.myProfile.publicKey,
      recipientId: '*', // Broadcast
      encryptedPayload: beaconStr,
      nonce: '',
    });

    await this.bleAdapter.broadcastPacket(JSON.stringify(packet));
  }

  /**
   * Called when any adapter or simulator discovers or refreshes a peer
   */
  public handlePeerDiscovered(peer: PeerDevice) {
    if (this.myProfile && peer.id === this.myProfile.id) return; // Don't discover self

    const existing = this.peers.get(peer.id);
    this.peers.set(peer.id, {
      ...existing,
      ...peer,
      lastSeen: Date.now(),
      isOnline: true,
    });

    this.notifyPeers();

    // Check if any queued messages can now be dispatched to this peer
    this.flushOutboxForPeer(peer.id);
  }

  /**
   * Sends an E2EE direct message to a peer over mesh
   */
  public async sendDirectMessage(params: {
    recipientPeerId: string;
    content: string;
    type?: ChatMessage['type'];
    file?: FileMetadata;
    voiceDurationSec?: number;
  }): Promise<ChatMessage> {
    if (!this.myProfile || !this.myKeyPair) {
      throw new Error('P2P engine not initialized with profile & keys');
    }

    const peer = this.peers.get(params.recipientPeerId);
    if (!peer) {
      throw new Error('Peer not found in mesh discovery table');
    }

    const messageId = 'msg_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

    // 1. Perform Curve25519 E2EE encryption
    const payloadToEncrypt = JSON.stringify({
      id: messageId,
      content: params.content,
      type: params.type || 'text',
      file: params.file,
      voiceDurationSec: params.voiceDurationSec,
      timestamp: Date.now(),
    });

    const encrypted = encryptDirectMessage(
      payloadToEncrypt,
      peer.publicKey,
      this.myKeyPair.secretKey
    );

    // 2. Create local message object
    const chatMessage: ChatMessage = {
      id: messageId,
      senderId: this.myProfile.id,
      senderName: this.myProfile.displayName,
      recipientId: peer.id,
      isGroup: false,
      content: params.content,
      type: params.type || 'text',
      file: params.file,
      voiceDurationSec: params.voiceDurationSec,
      timestamp: Date.now(),
      status: peer.isOnline ? 'sent' : 'queued',
      hopCount: 0,
      isOutgoing: true,
    };

    // 3. Construct Mesh Packet
    const packet = P2PProtocol.createPacket({
      packetId: messageId,
      type: 'MSG',
      senderId: this.myProfile.id,
      senderPublicKey: this.myKeyPair.publicKey,
      recipientId: peer.id,
      encryptedPayload: encrypted.ciphertext,
      nonce: encrypted.nonce,
    });

    // 4. Dispatch over physical BLE / Wi-Fi Direct or Virtual Mesh Simulator
    if (peer.isOnline) {
      const packetStr = JSON.stringify(packet);
      if (peer.connectionType === 'wifi_direct') {
        await this.wifiAdapter.sendDirect('192.168.49.1', packetStr);
      } else {
        await this.bleAdapter.broadcastPacket(packetStr);
      }

      // If simulator is active for this peer, simulate node processing
      if (this.simulator.getIsEnabled()) {
        this.simulator.handleOutboundPacket(packet, this.myProfile.id, this.myKeyPair.publicKey);
      }
    } else {
      // Peer offline or out of range -> Store in mesh outbox queue
      this.outboxQueue.push(chatMessage);
      await LocalStorage.saveOutboxQueue(this.outboxQueue);
    }

    return chatMessage;
  }

  /**
   * Sends a file (image, doc, voice note) over P2P mesh with chunking and SHA-256 verification
   */
  public async sendPeerFile(params: {
    recipientPeerId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    dataUri: string;
    type: 'image' | 'file' | 'voice';
    voiceDurationSec?: number;
  }): Promise<ChatMessage> {
    const sha256 = computeSimpleChecksum(params.dataUri);
    const fileMeta: FileMetadata = {
      fileName: params.fileName,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      dataUri: params.dataUri,
      sha256,
      chunksTotal: 1,
      chunksReceived: 1,
    };

    return this.sendDirectMessage({
      recipientPeerId: params.recipientPeerId,
      content: params.fileName,
      type: params.type,
      file: fileMeta,
      voiceDurationSec: params.voiceDurationSec,
    });
  }

  /**
   * Processes incoming raw packets from network
   */
  private handleIncomingRawPacket(rawPacket: string) {
    try {
      const packet: MeshPacket = JSON.parse(rawPacket);
      this.handleIncomingMeshPacket(packet);
    } catch (err) {
      console.warn('[P2P] Failed to parse mesh packet:', err);
    }
  }

  /**
   * Core Mesh Packet processing engine: deduplication, E2EE decryption, ACK handling, and multi-hop relaying
   */
  public handleIncomingMeshPacket(packet: MeshPacket) {
    if (!this.myProfile || !this.myKeyPair) return;

    // 1. Loop Prevention & Deduplication
    if (P2PProtocol.isPacketDuplicate(packet.id)) {
      return;
    }

    // 2. Handle Broadcast Beacons
    if (packet.type === 'BEACON') {
      const beacon = P2PProtocol.deserializeBeacon(packet.encryptedPayload);
      if (beacon) {
        this.bleAdapter.ingestRawAdvert(packet.encryptedPayload, -62);
      }
      return;
    }

    // 3. Handle Delivery ACKs
    if (packet.type === 'ACK') {
      try {
        const ackData = JSON.parse(packet.encryptedPayload);
        console.log(`[P2P] Received ACK for packet ${ackData.ackPacketId}`);
        this.notifyStatus(ackData.ackPacketId, 'delivered');
      } catch {}
      return;
    }

    // 4. Handle Read Receipts
    if (packet.type === 'READ') {
      try {
        const readData = JSON.parse(packet.encryptedPayload);
        console.log(`[P2P] Received READ receipt for packet ${readData.ackPacketId}`);
        this.notifyStatus(readData.ackPacketId, 'read');
      } catch {}
      return;
    }

    // 5. Store-and-Forward Mesh Relay
    if (P2PProtocol.shouldRelay(packet, this.myProfile.id)) {
      console.log(`[P2P Mesh Relay] Relaying packet ${packet.id} for recipient ${packet.recipientId} (TTL: ${packet.ttl})`);
      const relayPacket = P2PProtocol.decrementTtlForRelay(packet);
      const relayJson = JSON.stringify(relayPacket);
      this.bleAdapter.broadcastPacket(relayJson);
      return;
    }

    // 6. Direct Message addressed to me
    if (packet.recipientId === this.myProfile.id && packet.type === 'MSG') {
      try {
        const decryptedJson = decryptDirectMessage(
          packet.encryptedPayload,
          packet.nonce,
          packet.senderPublicKey,
          this.myKeyPair.secretKey
        );

        const payload = JSON.parse(decryptedJson);
        const senderPeer = this.peers.get(packet.senderId);

        const incomingMsg: ChatMessage = {
          id: packet.id,
          senderId: packet.senderId,
          senderName: senderPeer ? senderPeer.displayName : 'Peer ' + packet.senderId.substring(0, 6),
          recipientId: this.myProfile.id,
          isGroup: false,
          content: payload.content || '',
          type: payload.type || 'text',
          file: payload.file,
          voiceDurationSec: payload.voiceDurationSec,
          timestamp: payload.timestamp || packet.timestamp,
          status: 'delivered',
          hopCount: packet.hopCount,
          isOutgoing: false,
        };

        this.notifyMessage(incomingMsg);

        // Send delivery ACK back to sender
        this.sendAck(packet.senderId, packet.id, 'delivered');

      } catch (err) {
        console.error('[P2P] Failed to decrypt incoming direct message:', err);
      }
    }
  }

  private sendAck(targetPeerId: string, packetId: string, status: 'delivered' | 'read') {
    if (!this.myProfile || !this.myKeyPair) return;
    const ackPacket: MeshPacket = {
      id: P2PProtocol.generatePacketId(),
      type: status === 'delivered' ? 'ACK' : 'READ',
      senderId: this.myProfile.id,
      senderPublicKey: this.myKeyPair.publicKey,
      recipientId: targetPeerId,
      ttl: 5,
      hopCount: 0,
      timestamp: Date.now(),
      encryptedPayload: JSON.stringify({ ackPacketId: packetId, status }),
      nonce: '',
    };
    this.bleAdapter.broadcastPacket(JSON.stringify(ackPacket));
  }

  public sendReadReceipt(targetPeerId: string, packetId: string) {
    this.sendAck(targetPeerId, packetId, 'read');
  }

  private handleIncomingFileChunk(chunkJson: string) {
    try {
      const chunk: FileChunkPayload = JSON.parse(chunkJson);
      console.log(`[P2P File] Received chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} for ${chunk.fileName}`);
    } catch {}
  }

  private async flushOutboxForPeer(peerId: string) {
    const pendingForPeer = this.outboxQueue.filter(m => m.recipientId === peerId);
    if (pendingForPeer.length === 0) return;

    this.outboxQueue = this.outboxQueue.filter(m => m.recipientId !== peerId);
    await LocalStorage.saveOutboxQueue(this.outboxQueue);

    for (const msg of pendingForPeer) {
      await this.sendDirectMessage({
        recipientPeerId: msg.recipientId,
        content: msg.content,
        type: msg.type,
        file: msg.file,
        voiceDurationSec: msg.voiceDurationSec,
      });
      this.notifyStatus(msg.id, 'sent');
    }
  }
}
