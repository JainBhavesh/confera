import { StyleSheet, Text, View } from 'react-native';
import { callTextMuted, color, font } from '../../theme';

interface ChatMessageBubbleProps {
  authorName: string;
  message: string;
  timestamp: string;
  isOwnMessage?: boolean;
}

// Shared by meeting chat and livestream chat — both are plain-text-only per
// the spec (§10, §20): no attachments, so this only ever renders text.
export function ChatMessageBubble({ authorName, message, timestamp, isOwnMessage }: ChatMessageBubbleProps) {
  return (
    <View style={[styles.container, isOwnMessage && styles.ownContainer]}>
      <View style={styles.header}>
        <Text style={styles.author}>{authorName}</Text>
        <Text style={styles.timestamp}>{new Date(timestamp).toLocaleTimeString()}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: color.callSurface, padding: 12, marginBottom: 8 },
  ownContainer: { backgroundColor: color.accent700 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  author: { fontFamily: font.bodySemiBold, color: color.callText, fontSize: 12 },
  timestamp: { fontFamily: font.body, color: callTextMuted(0.5), fontSize: 11 },
  message: { fontFamily: font.body, color: color.callText, fontSize: 14 }
});
