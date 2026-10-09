import { AvailabilityStatus, ScanDutyCycleConfig, ScanMode } from '../types';

export interface StatusPreset {
  availability: AvailabilityStatus;
  emoji: string;
  label: string;
  description: string;
  color: string;
}

export const STATUS_PRESETS: StatusPreset[] = [
  {
    availability: 'free',
    emoji: '🟢',
    label: 'Free to chat',
    description: 'Available for immediate mesh chats & file transfers',
    color: '#4FAE4E',
  },
  {
    availability: 'busy',
    emoji: '🔴',
    label: 'Busy',
    description: 'Do not disturb, notifications silenced',
    color: '#E53935',
  },
  {
    availability: 'work',
    emoji: '💼',
    label: 'At work',
    description: 'Working, might respond with delay',
    color: '#1E88E5',
  },
  {
    availability: 'gym',
    emoji: '💪',
    label: 'Gym / Workout',
    description: 'Active fitness session',
    color: '#FB8C00',
  },
  {
    availability: 'traveling',
    emoji: '✈️',
    label: 'Traveling',
    description: 'On the move, fluctuating mesh range',
    color: '#8E24AA',
  },
  {
    availability: 'sleeping',
    emoji: '🌙',
    label: 'Sleeping',
    description: 'Offline/Resting mode',
    color: '#5C6BC0',
  },
];

export const AVATAR_PRESETS = [
  { id: 'avatar_1', icon: '👤', color: '#5288C1', label: 'Default' },
  { id: 'avatar_2', icon: '🦊', color: '#E65100', label: 'Fox' },
  { id: 'avatar_3', icon: '🚀', color: '#1E88E5', label: 'Rocket' },
  { id: 'avatar_4', icon: '⚡', color: '#FDD835', label: 'Flash' },
  { id: 'avatar_5', icon: '🐺', color: '#546E7A', label: 'Wolf' },
  { id: 'avatar_6', icon: '🐱', color: '#D81B60', label: 'Cat' },
  { id: 'avatar_7', icon: '🦉', color: '#5D4037', label: 'Owl' },
  { id: 'avatar_8', icon: '🛡️', color: '#2E7D32', label: 'Shield' },
  { id: 'avatar_9', icon: '🤖', color: '#00ACC1', label: 'Cyborg' },
];

export const SCAN_DUTY_CYCLES: Record<ScanMode, ScanDutyCycleConfig> = {
  active: {
    scanWindowMs: 4000,
    scanIntervalMs: 6000,
    label: 'Active (Fast Discovery)',
    description: 'Continuous scanning. Ideal for rapid peer pairing. Highest battery drain.',
  },
  balanced: {
    scanWindowMs: 3000,
    scanIntervalMs: 15000,
    label: 'Balanced (Recommended)',
    description: 'Scans 3s every 15s. Optimal balance between battery life and peer response.',
  },
  battery_saver: {
    scanWindowMs: 2000,
    scanIntervalMs: 45000,
    label: 'Battery Saver',
    description: 'Scans 2s every 45s. Max battery longevity, slower discovery of new peers.',
  },
  manual: {
    scanWindowMs: 5000,
    scanIntervalMs: 0,
    label: 'Manual Only',
    description: 'No background scanning. Only scans when user taps "Scan Now" button.',
  },
};
