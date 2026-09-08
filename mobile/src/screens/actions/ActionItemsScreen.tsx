import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TabScreenProps } from '../../navigation/types';
import { listActionItems, updateActionItem } from '../../services/api/actionItems';
import { Icon } from '../../components/icons/Icon';
import { color, font, space, textMuted } from '../../theme';
import type { ActionItem } from '../../types';

type Props = TabScreenProps<'Actions'>;

type Scope = 'assigned' | 'created' | 'all';

const SCOPES: { key: Scope; label: string }[] = [
  { key: 'assigned', label: 'Assigned to me' },
  { key: 'created', label: 'Created by me' },
  { key: 'all', label: 'All' }
];

function dueLabel(item: ActionItem): { text: string; overdue: boolean } | null {
  if (!item.dueDate) return null;
  const due = new Date(item.dueDate);
  const overdue = item.status !== 'COMPLETED' && due.getTime() < Date.now();
  if (overdue) return { text: 'Overdue', overdue: true };
  return { text: due.toLocaleDateString(undefined, { weekday: 'short' }), overdue: false };
}

export function ActionItemsScreen({ navigation }: Props) {
  const [scope, setScope] = useState<Scope>('assigned');
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (activeScope: Scope) => {
    const { actionItems } = await listActionItems({ scope: activeScope });
    setItems(actionItems);
  }, []);

  useEffect(() => {
    setLoading(true);
    load(scope).finally(() => setLoading(false));
  }, [scope, load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(scope);
    setRefreshing(false);
  };

  const { openCount, doneThisMonth } = useMemo(() => {
    const now = new Date();
    const open = items.filter((i) => i.status === 'PENDING' || i.status === 'IN_PROGRESS').length;
    const done = items.filter(
      (i) =>
        i.status === 'COMPLETED' &&
        i.completedAt &&
        new Date(i.completedAt).getMonth() === now.getMonth() &&
        new Date(i.completedAt).getFullYear() === now.getFullYear()
    ).length;
    return { openCount: open, doneThisMonth: done };
  }, [items]);

  const toggle = async (item: ActionItem) => {
    const nextStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i)));
    try {
      await updateActionItem(item.id, { status: nextStatus });
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i)));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Action items</Text>
        <Text style={styles.subtitle}>
          {openCount} open · {doneThisMonth} done this month
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {SCOPES.map((s) => (
            <Pressable
              key={s.key}
              style={[styles.filterPill, scope === s.key && styles.filterPillActive]}
              onPress={() => setScope(s.key)}
            >
              <Text style={[styles.filterPillText, scope === s.key && styles.filterPillTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={color.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No action items here.</Text>}
          renderItem={({ item }) => {
            const due = dueLabel(item);
            const done = item.status === 'COMPLETED';
            return (
              <Pressable
                style={[styles.row, done && styles.rowDone]}
                onPress={() =>
                  item.meetingId && navigation.navigate('MeetingDetail', { meetingId: item.meetingId })
                }
              >
                <Pressable
                  style={[styles.checkbox, done && styles.checkboxDone]}
                  onPress={() => toggle(item)}
                  hitSlop={8}
                >
                  {done ? <Icon name="check" size={15} color={color.white} strokeWidth={3} /> : null}
                </Pressable>
                <View style={styles.info}>
                  <Text style={[styles.itemTitle, done && styles.itemTitleDone]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.meeting ? (
                    <Text style={styles.itemMeeting} numberOfLines={1}>
                      {item.meeting.title}
                    </Text>
                  ) : null}
                </View>
                {due && !done ? (
                  <View style={[styles.tag, due.overdue ? styles.tagOverdue : styles.tagNeutral]}>
                    <Text style={[styles.tagText, due.overdue && styles.tagTextOverdue]}>{due.text}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 8, paddingBottom: 14, paddingHorizontal: space[4] + 4, borderBottomWidth: 2, borderBottomColor: color.divider },
  title: { fontFamily: font.headingBold, fontSize: 26, color: color.text, marginBottom: 4 },
  subtitle: { fontFamily: font.body, fontSize: 13, color: textMuted(0.6), marginBottom: 14 },
  filterRow: { gap: 8 },
  filterPill: { height: 36, paddingHorizontal: 14, borderWidth: 1, borderColor: color.neutral400, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center' },
  filterPillActive: { backgroundColor: color.text, borderColor: color.text },
  filterPillText: { fontFamily: font.body, fontSize: 13, color: color.text },
  filterPillTextActive: { fontFamily: font.bodySemiBold, color: color.bg },
  list: { paddingHorizontal: space[4] + 4 },
  empty: { fontFamily: font.body, color: textMuted(0.6), textAlign: 'center', marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: color.divider },
  rowDone: { opacity: 0.55 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: color.neutral400, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxDone: { borderWidth: 0, backgroundColor: color.accent },
  info: { flex: 1, minWidth: 0 },
  itemTitle: { fontFamily: font.bodySemiBold, fontSize: 15, lineHeight: 20, color: color.text },
  itemTitleDone: { textDecorationLine: 'line-through' },
  itemMeeting: { fontFamily: font.body, fontSize: 12, color: textMuted(0.55), marginTop: 4 },
  tag: { paddingHorizontal: 10, paddingVertical: 3 },
  tagNeutral: { backgroundColor: color.neutral100 },
  tagOverdue: { backgroundColor: color.accent100 },
  tagText: { fontFamily: font.body, fontSize: 11, color: color.neutral800 },
  tagTextOverdue: { color: color.accent800 }
});
