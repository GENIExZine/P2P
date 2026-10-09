import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  PeerDevice, 
  ChatSession, 
  ChatMessage, 
  ScanMode, 
  UserStatus, 
  FileMetadata 
} from '../types';
import { P2PManager } from '../services/p2p/p2pManager';
import { LocalStorage } from '../services/storage/localStorage';
import { useAuth } from './AuthContext';

interface P2PContextType {
  peers: PeerDevice[];
  chats: ChatSession[];
  activeChat: ChatSession | null;
  activeMessages: ChatMessage[];
  scanMode: ScanMode;
  isScanning: boolean;
  meshOnlineCount: number;
  setActiveChat: (chat: ChatSession | null) => void;
  setScanMode: (mode: ScanMode) => Promise<void>;
  triggerManualScan: () => void;
  broadcastStatus: (status: UserStatus) => Promise<void>;
  startChatWithPeer: (peer: PeerDevice) => Promise<ChatSession>;
  sendMessage: (recipientId: string, content: string) => Promise<void>;
  sendFile: (recipientId: string, file: FileMetadata) => Promise<void>;
  sendVoiceNote: (recipientId: string, durationSec: number) => Promise<void>;
  markChatRead: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  togglePinChat: (chatId: string) => Promise<void>;
  toggleMuteChat: (chatId: string) => Promise<void>;
}

const P2PContext = createContext<P2PContextType>({} as P2PContextType);

export const P2PProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, keyPair, updateStatus } = useAuth();
  const [peers, setPeers] = useState<PeerDevice[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [scanMode, setScanModeState] = useState<ScanMode>('balanced');
  const [isScanning, setIsScanning] = useState(false);

  const p2pManager = P2PManager.getInstance();

  // Initialize P2P manager once user profile is ready
  useEffect(() => {
    if (profile && keyPair) {
      p2pManager.initialize(profile, keyPair);

      // Subscribe to peer discovery events
      const unsubPeers = p2pManager.subscribePeers((updatedPeers) => {
        setPeers(updatedPeers);
      });

      // Subscribe to duty cycle scanner status
      const unsubDuty = p2pManager.getScanDutyCycleManager().subscribe((scanning) => {
        setIsScanning(scanning);
      });

      // Subscribe to incoming messages
      const unsubMessages = p2pManager.subscribeMessages((incomingMsg) => {
        handleIncomingMessage(incomingMsg);
      });

      // Subscribe to message status updates (sent -> delivered -> read)
      const unsubStatus = p2pManager.subscribeMessageStatus((msgId, status) => {
        handleMessageStatusUpdate(msgId, status);
      });

      loadChatSessions();

      return () => {
        unsubPeers();
        unsubDuty();
        unsubMessages();
        unsubStatus();
      };
    }
  }, [profile, keyPair]);

  const loadChatSessions = async () => {
    const savedChats = await LocalStorage.getChatSessions();
    setChats(savedChats);
  };

  const loadMessagesForChat = async (chatId: string) => {
    if (!messagesMap[chatId]) {
      const msgs = await LocalStorage.getMessages(chatId);
      setMessagesMap(prev => ({ ...prev, [chatId]: msgs }));
    }
  };

  useEffect(() => {
    if (activeChat) {
      loadMessagesForChat(activeChat.id);
    }
  }, [activeChat]);

  const handleIncomingMessage = useCallback(async (msg: ChatMessage) => {
    const chatId = msg.senderId;
    
    // Update messages map
    setMessagesMap(prev => {
      const existing = prev[chatId] || [];
      const updated = [...existing, msg];
      LocalStorage.saveMessages(chatId, updated);
      return { ...prev, [chatId]: updated };
    });

    // Update chats list
    setChats(prev => {
      let chat = prev.find(c => c.id === chatId);
      let updatedChats = [...prev];

      if (!chat) {
        const peer = p2pManager.getPeerById(chatId);
        chat = {
          id: chatId,
          name: peer ? peer.displayName : 'Nearby Peer',
          avatar: peer ? peer.avatar : 'avatar_1',
          isGroup: false,
          participantIds: [chatId],
          unreadCount: 1,
          isPinned: false,
          isMuted: false,
          isOnline: true,
          userStatus: peer?.status,
          updatedAt: Date.now(),
        };
        updatedChats = [chat, ...updatedChats];
      } else {
        const isCurrentlyViewing = activeChat?.id === chatId;
        chat.lastMessage = msg;
        chat.updatedAt = Date.now();
        if (!isCurrentlyViewing) {
          chat.unreadCount += 1;
        }
        updatedChats = [chat, ...updatedChats.filter(c => c.id !== chatId)];
      }

      LocalStorage.saveChatSessions(updatedChats);
      return updatedChats;
    });

    // If active chat is open, immediately mark as read
    if (activeChat?.id === chatId) {
      p2pManager.sendReadReceipt(chatId, msg.id);
    }
  }, [activeChat]);

  const handleMessageStatusUpdate = useCallback((msgId: string, status: ChatMessage['status']) => {
    setMessagesMap(prev => {
      const next = { ...prev };
      let found = false;

      for (const chatId in next) {
        const msgs = next[chatId].map(m => {
          if (m.id === msgId) {
            found = true;
            return { ...m, status };
          }
          return m;
        });
        if (found) {
          next[chatId] = msgs;
          LocalStorage.saveMessages(chatId, msgs);
          break;
        }
      }
      return next;
    });
  }, []);

  const triggerManualScan = () => {
    p2pManager.triggerManualScan();
  };

  const setScanMode = async (mode: ScanMode) => {
    setScanModeState(mode);
    p2pManager.getScanDutyCycleManager().setMode(mode);
    await LocalStorage.saveScanMode(mode);
  };

  const broadcastStatus = async (status: UserStatus) => {
    await updateStatus(status);
    await p2pManager.broadcastStatusUpdate(status);
  };

  const startChatWithPeer = async (peer: PeerDevice): Promise<ChatSession> => {
    let existing = chats.find(c => c.id === peer.id);
    if (!existing) {
      existing = {
        id: peer.id,
        name: peer.displayName,
        avatar: peer.avatar,
        isGroup: false,
        participantIds: [peer.id],
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isOnline: peer.isOnline,
        userStatus: peer.status,
        updatedAt: Date.now(),
      };
      const updated = [existing, ...chats];
      setChats(updated);
      await LocalStorage.saveChatSessions(updated);
    }
    setActiveChat(existing);
    return existing;
  };

  const sendMessage = async (recipientId: string, content: string) => {
    const msg = await p2pManager.sendDirectMessage({
      recipientPeerId: recipientId,
      content,
      type: 'text',
    });

    // Add to message state
    setMessagesMap(prev => {
      const existing = prev[recipientId] || [];
      const updated = [...existing, msg];
      LocalStorage.saveMessages(recipientId, updated);
      return { ...prev, [recipientId]: updated };
    });

    // Update chat session
    setChats(prev => {
      const updated = prev.map(c => {
        if (c.id === recipientId) {
          return { ...c, lastMessage: msg, updatedAt: Date.now() };
        }
        return c;
      });
      LocalStorage.saveChatSessions(updated);
      return updated;
    });
  };

  const sendFile = async (recipientId: string, file: FileMetadata) => {
    const msg = await p2pManager.sendPeerFile({
      recipientPeerId: recipientId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      dataUri: file.dataUri || '',
      type: file.mimeType.startsWith('image/') ? 'image' : 'file',
    });

    setMessagesMap(prev => {
      const existing = prev[recipientId] || [];
      const updated = [...existing, msg];
      LocalStorage.saveMessages(recipientId, updated);
      return { ...prev, [recipientId]: updated };
    });

    setChats(prev => {
      const updated = prev.map(c => {
        if (c.id === recipientId) {
          return { ...c, lastMessage: msg, updatedAt: Date.now() };
        }
        return c;
      });
      LocalStorage.saveChatSessions(updated);
      return updated;
    });
  };

  const sendVoiceNote = async (recipientId: string, durationSec: number) => {
    const msg = await p2pManager.sendPeerFile({
      recipientPeerId: recipientId,
      fileName: `Voice Note (${durationSec}s)`,
      fileSize: durationSec * 4096, // Estimated byte size
      mimeType: 'audio/m4a',
      dataUri: 'data:audio/m4a;base64,offline_voice_note_chunk',
      type: 'voice',
      voiceDurationSec: durationSec,
    });

    setMessagesMap(prev => {
      const existing = prev[recipientId] || [];
      const updated = [...existing, msg];
      LocalStorage.saveMessages(recipientId, updated);
      return { ...prev, [recipientId]: updated };
    });

    setChats(prev => {
      const updated = prev.map(c => {
        if (c.id === recipientId) {
          return { ...c, lastMessage: msg, updatedAt: Date.now() };
        }
        return c;
      });
      LocalStorage.saveChatSessions(updated);
      return updated;
    });
  };

  const markChatRead = async (chatId: string) => {
    setChats(prev => {
      const updated = prev.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c);
      LocalStorage.saveChatSessions(updated);
      return updated;
    });
  };

  const deleteChat = async (chatId: string) => {
    setChats(prev => {
      const updated = prev.filter(c => c.id !== chatId);
      LocalStorage.saveChatSessions(updated);
      return updated;
    });
    setMessagesMap(prev => {
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
    if (activeChat?.id === chatId) {
      setActiveChat(null);
    }
  };

  const togglePinChat = async (chatId: string) => {
    setChats(prev => {
      const updated = prev.map(c => c.id === chatId ? { ...c, isPinned: !c.isPinned } : c);
      LocalStorage.saveChatSessions(updated);
      return updated;
    });
  };

  const toggleMuteChat = async (chatId: string) => {
    setChats(prev => {
      const updated = prev.map(c => c.id === chatId ? { ...c, isMuted: !c.isMuted } : c);
      LocalStorage.saveChatSessions(updated);
      return updated;
    });
  };

  const activeMessages = activeChat ? messagesMap[activeChat.id] || [] : [];
  const meshOnlineCount = peers.filter(p => p.isOnline).length;

  return (
    <P2PContext.Provider
      value={{
        peers,
        chats,
        activeChat,
        activeMessages,
        scanMode,
        isScanning,
        meshOnlineCount,
        setActiveChat,
        setScanMode,
        triggerManualScan,
        broadcastStatus,
        startChatWithPeer,
        sendMessage,
        sendFile,
        sendVoiceNote,
        markChatRead,
        deleteChat,
        togglePinChat,
        toggleMuteChat,
      }}
    >
      {children}
    </P2PContext.Provider>
  );
};

export const useP2P = () => useContext(P2PContext);
