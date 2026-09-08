import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Livestream } from '../../types';
import { color, font, textMuted } from '../../theme';

function tagStyles(status: Livestream['status']) {
  if (status === 'LIVE') return { tag: styles.tagAccent, text: styles.tagAccentText };
  if (status === 'SCHEDULED') return { tag: styles.tagOutline, text: styles.tagOutlineText };
  return { tag: styles.tagNeutral, text: styles.tagNeutralText };
}

export function LivestreamListItem({ livestream, onPress }: { livestream: Livestream; onPress: () => void }) {
  const tag = tagStyles(livestream.status);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.metaRow}>
        <View style={[styles.tag, tag.tag]}>
          <Text style={[styles.tagText, tag.text]}>{livestream.status}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {livestream.title}
      </Text>
      <Text style={styles.host} numberOfLines={1}>
        {livestream.createdBy?.name ?? 'Unknown host'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: color.divider },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontFamily: font.body, fontSize: 11, letterSpacing: 0.4 },
  tagAccent: { backgroundColor: color.accent100 },
  tagAccentText: { color: color.accent800 },
  tagOutline: { borderWidth: 1, borderColor: color.accent },
  tagOutlineText: { color: color.accent },
  tagNeutral: { backgroundColor: color.neutral100 },
  tagNeutralText: { color: color.neutral800 },
  title: { fontFamily: font.bodySemiBold, fontSize: 16, color: color.text, marginBottom: 2 },
  host: { fontFamily: font.body, fontSize: 13, color: textMuted(0.6) }
});
