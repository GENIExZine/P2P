import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '../types';
import { useTheme } from '../context/ThemeContext';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { FileTransferCard } from './FileTransferCard';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { colors, isDark } = useTheme();
  const isOut = message.isOutgoing;

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const renderStatusIcon = () => {
    if (!isOut) return null;

    switch (message.status) {
      case 'queued':
        return <Ionicons name="time-outline" size={12} color={colors.bubbleTimeOut} />;
      case 'sent':
        return <Ionicons name="checkmark" size={13} color={colors.tickSent} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color={colors.tickDelivered} />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color={colors.tickRead} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.row, isOut ? styles.rowOut : styles.rowIn]}>
      <View
        style={[
          styles.bubble,
          isOut
            ? [styles.bubbleOut, { backgroundColor: colors.bubbleOut }]
            : [styles.bubbleIn, { backgroundColor: colors.bubbleIn, borderColor: colors.border }],
        ]}
      >
        {/* Voice Note */}
        {message.type === 'voice' && (
          <VoiceNotePlayer durationSec={message.voiceDurationSec || 6} isOutgoing={isOut} />
        )}

        {/* File / Image Attachment */}
        {(message.type === 'file' || message.type === 'image') && message.file && (
          <FileTransferCard file={message.file} isOutgoing={isOut} />
        )}

        {/* Text Message */}
        {message.type === 'text' && (
          <Text
            style={[
              styles.messageText,
              { color: isOut ? colors.bubbleOutText : colors.bubbleInText },
            ]}
          >
            {message.content}
          </Text>
        )}

        {/* Footer Info: Hop info, Time, Delivery Ticks */}
        <View style={styles.footerRow}>
          {message.hopCount > 0 && (
            <View style={styles.hopBadge}>
              <Ionicons name="git-network-outline" size={10} color={isOut ? colors.bubbleTimeOut : colors.textMuted} />
              <Text style={[styles.hopText, { color: isOut ? colors.bubbleTimeOut : colors.textMuted }]}>
                {message.hopCount}h
              </Text>
            </View>
          )}

          <Text style={[styles.timeText, { color: isOut ? colors.bubbleTimeOut : colors.bubbleTimeIn }]}>
            {formatTime(message.timestamp)}
          </Text>

          {isOut && <View style={styles.statusIconWrapper}>{renderStatusIcon()}</View>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginVertical: 3,
    paddingHorizontal: 8,
    flexDirection: 'row',
  },
  rowOut: {
    justifyContent: 'flex-end',
  },
  rowIn: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleOut: {
    borderBottomRightRadius: 3,
  },
  bubbleIn: {
    borderBottomLeftRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '400',
  },
  statusIconWrapper: {
    marginLeft: 1,
    marginTop: 1,
  },
  hopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginRight: 4,
  },
  hopText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
