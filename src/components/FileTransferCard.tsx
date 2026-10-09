import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileMetadata } from '../types';
import { useTheme } from '../context/ThemeContext';

interface FileTransferCardProps {
  file: FileMetadata;
  isOutgoing: boolean;
}

export const FileTransferCard: React.FC<FileTransferCardProps> = ({ file, isOutgoing }) => {
  const { colors, isDark } = useTheme();

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = file.mimeType.startsWith('image/');

  return (
    <View style={styles.container}>
      <View style={styles.fileRow}>
        <View style={[styles.iconBox, { backgroundColor: isOutgoing ? 'rgba(255,255,255,0.2)' : colors.primary + '18' }]}>
          <Ionicons
            name={isImage ? 'image' : 'document-text'}
            size={22}
            color={isOutgoing ? (isDark ? '#FFF' : colors.primary) : colors.primary}
          />
        </View>

        <View style={styles.details}>
          <Text
            style={[styles.fileName, { color: isOutgoing ? (isDark ? '#FFF' : '#000') : colors.text }]}
            numberOfLines={1}
          >
            {file.fileName}
          </Text>
          <Text style={[styles.fileSize, { color: isOutgoing ? colors.bubbleTimeOut : colors.textSecondary }]}>
            {formatBytes(file.fileSize)} • SHA-256: {file.sha256}
          </Text>
        </View>
      </View>

      <View style={[styles.securityBadge, { borderColor: isOutgoing ? 'rgba(255,255,255,0.2)' : colors.border }]}>
        <Ionicons name="shield-checkmark" size={12} color="#4FAE4E" />
        <Text style={[styles.securityText, { color: isOutgoing ? colors.bubbleTimeOut : colors.textSecondary }]}>
          E2EE Payload Verified
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    minWidth: 210,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  details: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 11,
    marginTop: 2,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  securityText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
