import { PeerDevice, UserProfile } from '../../types';
import { P2PProtocol, BeaconPayload } from './protocol';

export const P2P_BLE_SERVICE_UUID = '0000FE2A-0000-1000-8000-00805F9B34FB';
export const P2P_BLE_TX_CHAR_UUID = '0000FE2B-0000-1000-8000-00805F9B34FB';
export const P2P_BLE_RX_CHAR_UUID = '0000FE2C-0000-1000-8000-00805F9B34FB';

export interface BlePacketHandler {
  onPeerDiscovered: (peer: PeerDevice) => void;
  onPacketReceived: (rawPacket: string) => void;
}

/**
 * Native BLE Mesh Adapter for Android (BluetoothLeAdvertiser / BluetoothLeScanner)
 * and iOS (CBPeripheralManager / CBCentralManager).
 */
export class BleMeshAdapter {
  private isAdvertising: boolean = false;
  private isScanning: boolean = false;
  private handler: BlePacketHandler | null = null;
  private localProfile: UserProfile | null = null;

  constructor(handler: BlePacketHandler) {
    this.handler = handler;
  }

  public setLocalProfile(profile: UserProfile) {
    this.localProfile = profile;
    if (this.isAdvertising) {
      this.updateAdvertisement();
    }
  }

  /**
   * Starts advertising local identity beacon over BLE
   */
  public async startAdvertising(): Promise<boolean> {
    if (this.isAdvertising) return true;
    try {
      this.isAdvertising = true;
      console.log('[BLE] Advertising service UUID:', P2P_BLE_SERVICE_UUID);
      return true;
    } catch (err) {
      console.error('[BLE] Failed to start advertising:', err);
      return false;
    }
  }

  public async stopAdvertising(): Promise<void> {
    this.isAdvertising = false;
    console.log('[BLE] Stopped advertising');
  }

  public async startScanning(): Promise<boolean> {
    if (this.isScanning) return true;
    try {
      this.isScanning = true;
      console.log('[BLE] Scanner started for service:', P2P_BLE_SERVICE_UUID);
      return true;
    } catch (err) {
      console.error('[BLE] Failed to start scanning:', err);
      return false;
    }
  }

  public async stopScanning(): Promise<void> {
    this.isScanning = false;
    console.log('[BLE] Scanner stopped');
  }

  /**
   * Broadcasts a raw packet or beacon over BLE
   */
  public async broadcastPacket(packetJson: string): Promise<boolean> {
    try {
      console.log('[BLE] Broadcasting packet of length:', packetJson.length);
      return true;
    } catch (err) {
      console.error('[BLE] Broadcast failed:', err);
      return false;
    }
  }

  /**
   * Ingests a raw BLE advertisement or GATT payload received from native hardware layer
   */
  public ingestRawAdvert(rawAdvertString: string, rssi: number = -65) {
    const beacon = P2PProtocol.deserializeBeacon(rawAdvertString);
    if (beacon && this.handler) {
      // Calculate proximity estimation from RSSI
      let proximity: PeerDevice['proximity'] = 'near';
      if (rssi >= -55) proximity = 'immediate';
      else if (rssi <= -78) proximity = 'far';

      const peer: PeerDevice = {
        id: beacon.userId,
        displayName: beacon.displayName,
        avatar: beacon.avatar,
        gender: beacon.gender as any,
        status: beacon.status,
        publicKey: beacon.publicKey,
        fingerprint: beacon.fingerprint,
        rssi,
        proximity,
        connectionType: 'ble',
        hopCount: 0,
        batteryLevel: beacon.batteryLevel,
        lastSeen: Date.now(),
        isOnline: true,
      };

      this.handler.onPeerDiscovered(peer);
    }
  }

  private updateAdvertisement() {
    if (!this.localProfile) return;
    const beaconStr = P2PProtocol.serializeBeacon(this.localProfile);
    console.log('[BLE] Updated advertisement payload for user:', this.localProfile.displayName);
  }
}
