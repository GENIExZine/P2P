import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useP2P } from '../context/P2PContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { SafetyNumberModal } from '../components/SafetyNumberModal';
import { ChatSession, FileMetadata } from '../types';

interface ChatScreenProps {
  chat: ChatSession;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ chat, onBack }) => {
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const { 
    activeMessages, 
    sendMessage, 
    sendFile, 
    sendVoiceNote, 
    peers, 
    markChatRead 
  } = useP2P();

  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const targetPeer = peers.find(p => p.id === chat.id);

  useEffect(() => {
    markChatRead(chat.id);
  }, [chat.id]);

  useEffect(() => {
    if (activeMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeMessages.length]);

  const handleSendText = async (text: string) => {
    await sendMessage(chat.id, text);
  };

  const handleSendFile = async (file: FileMetadata) => {
    await sendFile(chat.id, file);
  };

  const handleSendVoiceNote = async (durationSec: number) => {
    await sendVoiceNote(chat.id, durationSec);
  };

  const subtitle = targetPeer
    ? `${targetPeer.isOnline ? 'online' : 'last seen recently'} • ${targetPeer.status.emoji} ${targetPeer.status.customText}`
    : 'offline peer';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? colors.background : '#E4E9ED' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Header
        title={chat.name}
        subtitle={subtitle}
        onBack={onBack}
        onOpenSafetyNumber={() => setShowSafetyModal(true)}
        peer={targetPeer || null}
      />

      {/* Security Info Banner */}
      <View style={[styles.securityBanner, { backgroundColor: isDark ? colors.surface : 'rgba(255,255,255,0.85)' }]}>
        <Ionicons name="lock-closed" size={13} color="#4FAE4E" />
        <Text style={[styles.securityText, { color: colors.textSecondary }]}>
          E2EE Curve25519 • Direct P2P Mesh • Zero Cloud Servers
        </Text>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={activeMessages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.lockCircle, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>End-to-End Encrypted Chat</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Messages and files sent to {chat.name} are encrypted using ECDH Curve25519 and decrypted only on their physical device.
            </Text>
          </View>
        }
      />

      {/* Input Bar */}
      <ChatInput
        onSendMessage={handleSendText}
        onSendFile={handleSendFile}
        onSendVoiceNote={handleSendVoiceNote}
      />

      {/* Cryptographic Safety Number Modal */}
      <SafetyNumberModal
        visible={showSafetyModal}
        peer={targetPeer || null}
        myProfile={profile}
        onClose={() => setShowSafetyModal(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  messagesContainer: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  lockCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
});
