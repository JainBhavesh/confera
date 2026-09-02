import { StyleSheet, Text, View } from 'react-native';

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
  container: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 8 },
  ownContainer: { backgroundColor: '#0c4a6e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  author: { color: '#e2e8f0', fontSize: 12, fontWeight: '700' },
  timestamp: { color: '#64748b', fontSize: 11 },
  message: { color: '#f1f5f9', fontSize: 14 }
});
