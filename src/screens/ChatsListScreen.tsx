import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useP2P } from '../context/P2PContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { AVATAR_PRESETS } from '../constants/presets';
import { ChatSession } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface ChatsListScreenProps {
  onOpenChat: (chat: ChatSession) => void;
  onOpenRadar: () => void;
  onOpenSettings: () => void;
  onOpenStatus: () => void;
}

export const ChatsListScreen: React.FC<ChatsListScreenProps> = ({
  onOpenChat,
  onOpenRadar,
  onOpenSettings,
  onOpenStatus,
}) => {
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const { 
    chats, 
    meshOnlineCount, 
    isScanning, 
    scanMode, 
    togglePinChat, 
    toggleMuteChat, 
    deleteChat 
  } = useP2P();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatForAction, setSelectedChatForAction] = useState<ChatSession | null>(null);

  const filteredChats = chats
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

  const formatChatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const renderMessageStatusTick = (status?: string) => {
    switch (status) {
      case 'queued':
        return <Ionicons name="time-outline" size={13} color={colors.textSecondary} />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color={colors.tickSent} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color={colors.tickDelivered} />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color={colors.tickRead} />;
      default:
        return null;
    }
  };

  const renderChatItem = ({ item }: { item: ChatSession }) => {
    const avatarInfo = AVATAR_PRESETS.find(a => a.id === item.avatar) || AVATAR_PRESETS[0];
    const isActionMenuOpen = selectedChatForAction?.id === item.id;

    return (
      <View>
        <TouchableOpacity
          style={[
            styles.chatRow,
            { 
              backgroundColor: isActionMenuOpen 
                ? (isDark ? colors.surfaceElevated : '#E8EEF5')
                : colors.surface 
            }
          ]}
          onPress={() => onOpenChat(item)}
          onLongPress={() => setSelectedChatForAction(isActionMenuOpen ? null : item)}
          activeOpacity={0.7}
        >
          {/* Avatar with live status badge */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: avatarInfo.color }]}>
              <Text style={styles.avatarEmoji}>{avatarInfo.icon}</Text>
            </View>
            <View 
              style={[
                styles.onlineIndicator, 
                { backgroundColor: item.isOnline ? colors.onlineBadge : colors.textMuted }
              ]} 
            />
          </View>

          {/* Main Details */}
          <View style={styles.chatDetails}>
            <View style={styles.nameRow}>
              <View style={styles.nameWithIcons}>
                <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.isMuted && (
                  <Ionicons name="volume-mute" size={14} color={colors.textMuted} style={styles.metaIcon} />
                )}
                {item.isPinned && (
                  <Ionicons name="pin" size={14} color={colors.primary} style={styles.metaIcon} />
                )}
              </View>

              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {formatChatTime(item.lastMessage?.timestamp || item.updatedAt)}
              </Text>
            </View>

            <View style={styles.messageRow}>
              <View style={styles.snippetWrapper}>
                {item.lastMessage?.isOutgoing && (
                  <View style={styles.tickWrapper}>
                    {renderMessageStatusTick(item.lastMessage.status)}
                  </View>
                )}
                <Text style={[styles.snippetText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.lastMessage?.type === 'voice' 
                    ? '🎤 Voice note'
                    : item.lastMessage?.type === 'file'
                    ? `📎 ${item.lastMessage.file?.fileName || 'File'}`
                    : item.lastMessage?.type === 'image'
                    ? '📷 Photo'
                    : item.lastMessage?.content || (item.userStatus?.customText || 'Tap to chat')}
                </Text>
              </View>

              {item.unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Telegram-style Quick Action Bar (on long press or swipe) */}
        {isActionMenuOpen && (
          <View style={[styles.actionMenuBar, { backgroundColor: isDark ? colors.surfaceElevated : '#E0E8F0', borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => {
                togglePinChat(item.id);
                setSelectedChatForAction(null);
              }}
            >
              <Ionicons name={item.isPinned ? 'pin-outline' : 'pin'} size={18} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>{item.isPinned ? 'Unpin' : 'Pin'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => {
                toggleMuteChat(item.id);
                setSelectedChatForAction(null);
              }}
            >
              <Ionicons name={item.isMuted ? 'volume-high-outline' : 'volume-mute-outline'} size={18} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>{item.isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => {
                deleteChat(item.id);
                setSelectedChatForAction(null);
              }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Telegram P2P"
        subtitle={`Mesh Active • ${meshOnlineCount} nearby • ${scanMode}`}
        onOpenSettings={onOpenSettings}
        onOpenRadar={onOpenRadar}
        onOpenStatus={onOpenStatus}
        isScanning={isScanning}
      />

      {/* Mesh Banner & Mood pill */}
      <View style={[styles.meshBanner, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.bannerLeft}>
          <View style={[styles.statusDot, { backgroundColor: colors.onlineBadge }]} />
          <Text style={[styles.bannerText, { color: colors.text }]}>
            {profile?.status.emoji} {profile?.status.customText || 'Free to chat'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.bannerBtn, { borderColor: colors.border }]} 
          onPress={onOpenStatus}
        >
          <Text style={[styles.bannerBtnText, { color: colors.primary }]}>Change Status</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? colors.background : colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search chats..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chats List or Empty State */}
      <FlatList
        data={filteredChats}
        keyExtractor={item => item.id}
        renderItem={renderChatItem}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
        contentContainerStyle={filteredChats.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="radio" size={44} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Conversations Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Discover active peers in your Bluetooth & Wi-Fi Direct range without any internet connection.
            </Text>
            <TouchableOpacity
              style={[styles.radarLaunchBtn, { backgroundColor: colors.primary }]}
              onPress={onOpenRadar}
              activeOpacity={0.8}
            >
              <Ionicons name="compass" size={20} color="#FFFFFF" />
              <Text style={styles.radarLaunchBtnText}>Scan Nearby Mesh Peers</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={onOpenRadar}
        activeOpacity={0.85}
      >
        <Ionicons name="compass" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  meshBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bannerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  bannerBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  chatDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameWithIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
  },
  metaIcon: {
    marginTop: 1,
  },
  timeText: {
    fontSize: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snippetWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 4,
  },
  tickWrapper: {
    marginTop: 1,
  },
  snippetText: {
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 78,
  },
  actionMenuBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  radarLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  radarLaunchBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});
