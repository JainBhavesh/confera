import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDataChannel } from '@livekit/react-native';
import { ChatMessageBubble } from '../chat/ChatMessageBubble';
import { listLivestreamMessages, sendLivestreamMessage } from '../../services/api/livestreams';
import { CHAT_DATA_TOPIC } from '../../services/livekit';
import type { LivestreamMessage } from '../../types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface LivestreamChatPanelProps {
  livestreamId: string;
  currentUserId: string;
  onClose: () => void;
}

export function LivestreamChatPanel({ livestreamId, currentUserId, onClose }: LivestreamChatPanelProps) {
  const [messages, setMessages] = useState<LivestreamMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<LivestreamMessage>>(null);

  useEffect(() => {
    let cancelled = false;
    listLivestreamMessages(livestreamId)
      .then(({ messages: result }) => {
        if (!cancelled) setMessages(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [livestreamId]);

  const handleIncoming = useCallback((msg: { payload: Uint8Array }) => {
    try {
      const incoming = JSON.parse(decoder.decode(msg.payload)) as LivestreamMessage;
      setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
    } catch {
      // ignore malformed payloads
    }
  }, []);

  const { send } = useDataChannel(CHAT_DATA_TOPIC, handleIncoming);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    setDraft('');

    try {
      const { message } = await sendLivestreamMessage(livestreamId, text);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      await send(encoder.encode(JSON.stringify(message)), { reliable: true });
    } catch {
      // best-effort — persisted message may still have gone through
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Livestream chat</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet.</Text>}
        renderItem={({ item }) => (
          <ChatMessageBubble
            authorName={item.user?.id === currentUserId ? 'You' : item.user?.name ?? 'Unknown'}
            message={item.message}
            timestamp={item.createdAt}
            isOwnMessage={item.user?.id === currentUserId}
          />
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message everyone"
          placeholderTextColor="#64748b"
          maxLength={2000}
          style={styles.input}
        />
        <Pressable
          onPress={handleSend}
          disabled={sending || !draft.trim()}
          style={[styles.sendButton, (sending || !draft.trim()) && styles.sendButtonDisabled]}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  close: { color: '#38bdf8', fontSize: 14, fontWeight: '600' },
  list: { padding: 16, flexGrow: 1 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 24 },
  composer: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff'
  },
  sendButton: { backgroundColor: '#0ea5e9', borderRadius: 20, paddingHorizontal: 18, justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontWeight: '700' }
});
