import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Modal, 
  Pressable 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FileMetadata } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onSendFile: (file: FileMetadata) => void;
  onSendVoiceNote: (durationSec: number) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onSendFile, 
  onSendVoiceNote 
}) => {
  const { colors, isDark } = useTheme();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleSend = () => {
    if (text.trim().length === 0) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleStartRecord = () => {
    setIsRecording(true);
  };

  const handleStopAndSendRecord = () => {
    const duration = Math.max(1, recordSeconds);
    setIsRecording(false);
    onSendVoiceNote(duration);
  };

  const handleCancelRecord = () => {
    setIsRecording(false);
  };

  const handlePickSampleFile = (type: 'image' | 'doc' | 'pdf') => {
    setShowAttachMenu(false);
    let sample: FileMetadata;

    if (type === 'image') {
      sample = {
        fileName: 'Mesh_Camera_Capture_' + Math.floor(Math.random() * 899 + 100) + '.jpg',
        fileSize: 420 * 1024,
        mimeType: 'image/jpeg',
        sha256: '9a7e3d1c',
        dataUri: 'data:image/jpeg;base64,sample_p2p_image_base64_data',
      };
    } else if (type === 'pdf') {
      sample = {
        fileName: 'Mesh_Cryptographic_Spec.pdf',
        fileSize: 1.2 * 1024 * 1024,
        mimeType: 'application/pdf',
        sha256: '8b2d41fa',
        dataUri: 'data:application/pdf;base64,sample_pdf_binary_stream',
      };
    } else {
      sample = {
        fileName: 'Offline_Key_Backup.txt',
        fileSize: 16 * 1024,
        mimeType: 'text/plain',
        sha256: '3f51a2bc',
        dataUri: 'data:text/plain;base64,sample_text_data',
      };
    }

    onSendFile(sample);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {isRecording ? (
        // Voice Note Recording Mode
        <View style={styles.recordingRow}>
          <TouchableOpacity onPress={handleCancelRecord} style={styles.cancelBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>

          <View style={styles.recordIndicator}>
            <View style={styles.redDot} />
            <Text style={[styles.recordTime, { color: colors.text }]}>
              Recording 0:{recordSeconds < 10 ? '0' : ''}{recordSeconds}
            </Text>
          </View>

          <TouchableOpacity onPress={handleStopAndSendRecord} style={[styles.sendBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        // Standard Text & Attachment Input
        <View style={styles.inputRow}>
          <TouchableOpacity 
            onPress={() => setShowAttachMenu(true)} 
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="attach-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? colors.background : colors.surfaceElevated,
                color: colors.text,
                borderColor: colors.border,
              }
            ]}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />

          {text.trim().length > 0 ? (
            <TouchableOpacity 
              onPress={handleSend} 
              style={[styles.sendBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="paper-plane" size={17} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={handleStartRecord} 
              style={[styles.sendBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Attachment Action Sheet Modal */}
      <Modal
        visible={showAttachMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAttachMenu(false)}>
          <View style={[styles.sheetContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Secure Offline Peer Transfer</Text>
            <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
              Files are encrypted via Curve25519 & chunked over local P2P mesh
            </Text>

            <View style={styles.sheetGrid}>
              <TouchableOpacity 
                style={styles.sheetItem} 
                onPress={() => handlePickSampleFile('image')}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: '#4CAF50' }]}>
                  <Ionicons name="images" size={24} color="#FFF" />
                </View>
                <Text style={[styles.sheetLabel, { color: colors.text }]}>Photo / Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.sheetItem} 
                onPress={() => handlePickSampleFile('pdf')}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: '#E53935' }]}>
                  <Ionicons name="document-text" size={24} color="#FFF" />
                </View>
                <Text style={[styles.sheetLabel, { color: colors.text }]}>PDF Document</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.sheetItem} 
                onPress={() => handlePickSampleFile('doc')}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: '#1E88E5' }]}>
                  <Ionicons name="folder-open" size={24} color="#FFF" />
                </View>
                <Text style={[styles.sheetLabel, { color: colors.text }]}>Any File</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    borderWidth: 1,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 8,
  },
  cancelBtn: {
    padding: 8,
  },
  recordIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53935',
  },
  recordTime: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  sheetSub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  sheetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sheetItem: {
    alignItems: 'center',
    gap: 8,
  },
  sheetIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
