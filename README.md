# P2P Mesh Messenger 📶🔐

A secure, offline-first peer-to-peer mobile messaging application for **Android** and **iOS** built with React Native / Expo. Designed for zero-internet communication using **Bluetooth Low Energy (BLE)** and local **Wi-Fi Direct (P2P mesh)** with libsodium-grade **End-to-End Encryption (Curve25519 / XSalsa20-Poly1305)** and a clean **Telegram-inspired UI/UX**.

---

## 🌟 Key Features

### 1. 📡 Peer-to-Peer Offline Connectivity
* **Zero Cloud Dependency**: Operates 100% offline without internet servers, centralized relays, or phone number verification.
* **Dual-Radio Transport Architecture**:
  * **Bluetooth Low Energy (BLE)**: Custom Service UUID (`0000FE2A-...`) for continuous neighbor discovery and status beaconing.
  * **Wi-Fi Direct / Local Sockets**: High-speed offline socket transport for direct file transfers and voice notes.
* **Store-and-Forward Mesh Protocol**:
  * Multi-hop relaying with Time-To-Live (`TTL=5`) and hop count tracking.
  * In-memory LRU packet deduplication cache preventing broadcast storms and infinite routing loops.
  * Reliable offline outbox queue with auto-flushing once peers enter signal range.
* **Built-in Mesh Simulator**:
  * Includes multi-peer simulation (Alice, Bob, Charlie) with realistic RSSI signal jitter, distance transitions, real Curve25519 key handshakes, and autonomous simulated replies.

### 2. 🔐 Security & Privacy
* **Mandatory Local-Only Profile Setup**:
  * Display Name, Avatar selection, Gender, and Bio stored strictly on the local device via encrypted storage.
* **End-to-End Encryption (E2EE)**:
  * **Curve25519 (X25519) ECDH**: Asymmetric keypair generated on first launch.
  * **XSalsa20-Poly1305 Authenticated Encryption**: Every message and file payload is encrypted with a unique 24-byte nonce and verified with a Poly1305 MAC tag. Tampered packets are automatically rejected.
  * **Signal-Style 60-Digit Safety Numbers**: Deterministic fingerprint verification modal to compare security numbers in person.
* **Secure Peer-to-Peer File Transfer**:
  * Supports Images, Documents (PDF/TXT), and Voice Notes.
  * Payload chunking and SHA-256 integrity verification.

### 3. 🟢 Live Offline Broadcast Status & Beaconing
* **Dynamic Availability Presets**:
  * 🟢 *Free to chat*
  * 🔴 *Busy*
  * 💼 *At work*
  * 💪 *Gym / Workout*
  * ✈️ *Traveling*
  * 🌙 *Sleeping*
  * Custom mood activity with custom emojis.
* **Real-time Beacon Synchronization**:
  * Encoded directly into local BLE advertisement payloads and mesh discovery packets without internet.
* **Nearby Radar Screen**:
  * Displays real-time signal strength (RSSI in dBm: `-35 dBm` to `-95 dBm`).
  * Proximity estimation (*Immediate <1m*, *Near 1-5m*, *Far >5m*).
  * Transport badges (*BLE Mesh*, *Wi-Fi Direct*, *Relay*).
  * Battery level indicator per discovered node.

### 4. 🎨 Telegram-Inspired UI/UX
* **Clean, Minimalist Aesthetics**:
  * Deep Telegram navy dark theme (`#0E1621`, `#17212B`, `#2B5278`) and crisp Telegram light theme (`#FFFFFF`, `#EEFFDE`, `#2481CC`).
  * Automatic system-theme adaptation (`System Default`, `Dark Mode`, `Light Mode`).
* **Chats List**:
  * Real-time mesh status pill in header.
  * Swipe/long-press action bar (*Pin*, *Mute*, *Delete*).
  * Unread badge counters and online mood dots.
* **Minimal Message Bubbles**:
  * Four-state delivery tick progression:
    * 🕒 **Queued**: Stored in local mesh outbox.
    * ✓ **Sent**: Dispatched across local radio channel.
    * ✓✓ **Delivered**: Received & decrypted by peer device (ACK received).
    * ✓✓ **Read (Blue)**: Viewed by recipient peer.
  * Integrated voice note player with animated waveform bars.
  * File transfer cards with SHA-256 checksum tags.

### 5. ⚡ Battery & Performance Optimization
* **Duty-Cycle Scanning Engine**:
  * **Active (Fast Discovery)**: Continuous 4s scan window, 6s interval.
  * **Balanced (Default)**: 3s scan window, 15s interval.
  * **Battery Saver (Eco)**: 2s scan window, 45s interval.
  * **Manual Only**: Zero background drain; scans only on user demand.

---

## 📂 Project Architecture

```
d:\P2P\
├── App.tsx                        # Main application container & screen router
├── app.json                       # Expo config with Android/iOS BLE & Wi-Fi permissions
├── src/
│   ├── types/
│   │   └── index.ts               # Core TypeScript models (Peer, Message, Packet, Status)
│   ├── constants/
│   │   ├── colors.ts              # Telegram light & dark design tokens
│   │   └── presets.ts             # Status presets, avatar icons, duty cycles
│   ├── services/
│   │   ├── crypto/
│   │   │   ├── e2ee.ts            # Curve25519 ECDH, tweetnacl box, safety numbers
│   │   │   └── keyStorage.ts      # Local secure key management
│   │   ├── storage/
│   │   │   └── localStorage.ts    # AsyncStorage offline persistence
│   │   └── p2p/
│   │       ├── protocol.ts        # Mesh packet format, TTL, deduplication
│   │       ├── scanDutyCycle.ts   # Battery duty-cycle manager
│   │       ├── bleAdapter.ts      # BLE Central/Peripheral hardware abstraction
│   │       ├── wifiDirectAdapter.ts # Wi-Fi Direct socket transport
│   │       ├── meshSimulator.ts   # Multi-node virtual mesh testing engine
│   │       └── p2pManager.ts      # Master P2P orchestrator
│   ├── context/
│   │   ├── ThemeContext.tsx       # System auto-theme & manual switcher
│   │   ├── AuthContext.tsx        # Mandatory profile setup & key generation
│   │   └── P2PContext.tsx         # Unified P2P state & message dispatch hook
│   ├── components/
│   │   ├── Header.tsx             # Telegram app bar with mesh status & radar icon
│   │   ├── MessageBubble.tsx      # Minimal bubble with 4-state delivery ticks
│   │   ├── ChatInput.tsx          # Voice note recorder & offline attachment sheet
│   │   ├── VoiceNotePlayer.tsx    # Waveform visualization & playback scrubber
│   │   ├── FileTransferCard.tsx   # E2EE file chunk card with SHA-256 badge
│   │   ├── StatusBadge.tsx        # Availability mood & emoji pill
│   │   ├── PeerRadarCard.tsx      # Discovered peer card with RSSI & distance
│   │   ├── SafetyNumberModal.tsx  # 60-digit Signal-standard verification
│   │   └── StatusBroadcastModal.tsx # Mood & beacon update bottom sheet
│   ├── screens/
│   │   ├── OnboardingScreen.tsx   # Mandatory profile creation (Name, Avatar, Gender)
│   │   ├── ChatsListScreen.tsx    # Telegram chats list, search & swipe actions
│   │   ├── ChatScreen.tsx         # Active conversation with E2EE shield
│   │   ├── RadarScreen.tsx        # Nearby discovery radar & duty cycle settings
│   │   └── SettingsScreen.tsx     # Identity fingerprint, theme & battery config
│   └── tests/
│       └── test_crypto_mesh.js    # Unit test suite verifying cryptography
└── dist/                          # Production web bundle build
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18+ (tested on Node v24.19.0)
* **npm**: v9+ (tested on npm 11.17.0)

### 1. Run Unit Tests (Cryptographic & Protocol Verification)
```bash
node src/tests/test_crypto_mesh.js
```
*Outputs verification of Curve25519 key generation, authenticated encryption, Poly1305 MAC tamper rejection, and Signal safety numbers.*

### 2. Run the App in Development Mode
```bash
# Start Expo development server
npx expo start

# Run on Web (Browser preview)
npx expo start --web

# Run on Android Device / Emulator
npx expo start --android

# Run on iOS Simulator
npx expo start --ios
```

### 3. Build Production Standalone Binaries (EAS Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Build Android APK / AAB
eas build --platform android --profile preview

# Build iOS IPA
eas build --platform ios --profile preview
```

---

## 🔒 Security Audit Specifications
* **Key Agreement**: Curve25519 (X25519) ECDH.
* **Cipher**: XSalsa20 stream cipher with 24-byte random nonce.
* **Authentication**: Poly1305 Message Authentication Code (MAC).
* **Fingerprint**: 60-digit Signal-compatible numeric safety number partitioned into 5-digit verification groups.
* **Data Retention**: Strictly on-device. Zero telemetry, zero analytics, zero external API requests.
