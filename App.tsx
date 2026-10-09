import React, { useState } from 'react';
import { SafeAreaView, StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { P2PProvider, useP2P } from './src/context/P2PContext';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ChatsListScreen } from './src/screens/ChatsListScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { RadarScreen } from './src/screens/RadarScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StatusBroadcastModal } from './src/components/StatusBroadcastModal';
import { ChatSession, PeerDevice } from './src/types';

type Screen = 'chats' | 'chat' | 'radar' | 'settings';

const AppNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isLoading, isOnboarded } = useAuth();
  const { startChatWithPeer, setActiveChat, activeChat } = useP2P();

  const [currentScreen, setCurrentScreen] = useState<Screen>('chats');
  const [showStatusModal, setShowStatusModal] = useState(false);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isOnboarded) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
        <OnboardingScreen />
      </SafeAreaView>
    );
  }

  const handleOpenChat = (chat: ChatSession) => {
    setActiveChat(chat);
    setCurrentScreen('chat');
  };

  const handleSelectPeerFromRadar = async (peer: PeerDevice) => {
    const chat = await startChatWithPeer(peer);
    setActiveChat(chat);
    setCurrentScreen('chat');
  };

  const handleBackToChats = () => {
    setActiveChat(null);
    setCurrentScreen('chats');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {currentScreen === 'chats' && (
        <ChatsListScreen
          onOpenChat={handleOpenChat}
          onOpenRadar={() => setCurrentScreen('radar')}
          onOpenSettings={() => setCurrentScreen('settings')}
          onOpenStatus={() => setShowStatusModal(true)}
        />
      )}

      {currentScreen === 'chat' && activeChat && (
        <ChatScreen
          chat={activeChat}
          onBack={handleBackToChats}
        />
      )}

      {currentScreen === 'radar' && (
        <RadarScreen
          onBack={() => setCurrentScreen('chats')}
          onSelectPeer={handleSelectPeerFromRadar}
        />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen
          onBack={() => setCurrentScreen('chats')}
        />
      )}

      {/* Offline Status Broadcast Modal */}
      <StatusBroadcastModal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <P2PProvider>
          <AppNavigator />
        </P2PProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
