import { ScanMode, ScanDutyCycleConfig } from '../../types';
import { SCAN_DUTY_CYCLES } from '../../constants/presets';

export type DutyCycleListener = (isScanning: boolean) => void;

export class ScanDutyCycleManager {
  private currentMode: ScanMode = 'balanced';
  private isScanning: boolean = false;
  private isRunning: boolean = false;
  private timerId: any = null;
  private listeners: Set<DutyCycleListener> = new Set();
  private onScanStartCallback?: () => void;
  private onScanStopCallback?: () => void;

  constructor(
    initialMode: ScanMode = 'balanced',
    callbacks?: { onScanStart?: () => void; onScanStop?: () => void }
  ) {
    this.currentMode = initialMode;
    if (callbacks) {
      this.onScanStartCallback = callbacks.onScanStart;
      this.onScanStopCallback = callbacks.onScanStop;
    }
  }

  public getMode(): ScanMode {
    return this.currentMode;
  }

  public getConfig(): ScanDutyCycleConfig {
    return SCAN_DUTY_CYCLES[this.currentMode];
  }

  public getIsScanning(): boolean {
    return this.isScanning;
  }

  public subscribe(listener: DutyCycleListener): () => void {
    this.listeners.add(listener);
    listener(this.isScanning);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.isScanning));
  }

  public setMode(mode: ScanMode) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  public start() {
    this.isRunning = true;
    this.scheduleNextCycle();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.stopScan();
  }

  /**
   * Forces an immediate manual scan window (e.g. user pulled to refresh or tapped radar scan)
   */
  public triggerManualScan(durationMs: number = 4000) {
    if (this.isScanning) return;
    this.startScan();
    setTimeout(() => {
      if (this.isRunning && this.currentMode !== 'manual') {
        this.scheduleNextCycle();
      } else {
        this.stopScan();
      }
    }, durationMs);
  }

  private scheduleNextCycle() {
    if (!this.isRunning) return;

    const config = this.getConfig();
    if (this.currentMode === 'manual') {
      this.stopScan();
      return;
    }

    // Begin active scanning phase
    this.startScan();

    // After scanWindowMs, sleep until scanIntervalMs
    this.timerId = setTimeout(() => {
      this.stopScan();
      const sleepTime = Math.max(1000, config.scanIntervalMs - config.scanWindowMs);
      this.timerId = setTimeout(() => {
        if (this.isRunning) {
          this.scheduleNextCycle();
        }
      }, sleepTime);
    }, config.scanWindowMs);
  }

  private startScan() {
    if (this.isScanning) return;
    this.isScanning = true;
    this.notify();
    if (this.onScanStartCallback) {
      this.onScanStartCallback();
    }
  }

  private stopScan() {
    if (!this.isScanning) return;
    this.isScanning = false;
    this.notify();
    if (this.onScanStopCallback) {
      this.onScanStopCallback();
    }
  }
}
