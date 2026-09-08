import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import type { TabScreenProps } from '../../navigation/types';
import { createMeeting, listMeetings } from '../../services/api/meetings';
import { listActionItems } from '../../services/api/actionItems';
import { Icon } from '../../components/icons/Icon';
import { ProfileModal, type PopoverAnchor } from '../../components/profile/ProfileModal';
import { color, control, font, space, textMuted } from '../../theme';
import type { Meeting } from '../../types';

type Props = TabScreenProps<'Home'>;

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [openActions, setOpenActions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [creating, setCreating] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<PopoverAnchor | null>(null);
  const avatarRef = useRef<View>(null);

  const handleOpenProfile = () => {
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      setProfileAnchor({ x, y, width, height });
      setProfileOpen(true);
    });
  };

  const load = useCallback(async () => {
    const [{ meetings: allMeetings }, { actionItems }] = await Promise.all([
      listMeetings(),
      listActionItems({ scope: 'assigned' })
    ]);
    setMeetings(allMeetings);
    setOpenActions(actionItems.filter((item) => item.status === 'PENDING' || item.status === 'IN_PROGRESS').length);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const now = new Date();
  const todayCount = useMemo(() => {
    const today = now.toDateString();
    return meetings.filter((m) => {
      const t = m.startedAt ?? m.scheduledAt ?? m.createdAt;
      return t && new Date(t).toDateString() === today && m.status !== 'CANCELLED';
    }).length;
  }, [meetings]);

  const upNext = useMemo(() => {
    return meetings
      .filter((m) => m.status === 'LIVE' || m.status === 'SCHEDULED')
      .sort((a, b) => {
        if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
        if (b.status === 'LIVE' && a.status !== 'LIVE') return 1;
        const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
        const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
        return ta - tb;
      })
      .slice(0, 3);
  }, [meetings]);

  const meetingsThisWeek = useMemo(() => {
    const weekStart = startOfWeek(now).getTime();
    return meetings.filter((m) => m.status === 'ENDED' && m.endedAt && new Date(m.endedAt).getTime() >= weekStart).length;
  }, [meetings]);

  const handleNewMeeting = async () => {
    setCreating(true);
    try {
      const { meeting } = await createMeeting('New meeting');
      navigation.navigate('MeetingRoom', { meetingId: meeting.id });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinWithId = () => {
    const id = joinId.trim();
    if (!id) return;
    setJoinModalOpen(false);
    setJoinId('');
    navigation.navigate('MeetingRoom', { meetingId: id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={color.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Image source={require('../../../assets/logo.png')} style={styles.brandMark} resizeMode="contain" />
        <Text style={styles.brandName}>CONFERA</Text>
        <Pressable style={styles.searchButton} accessibilityLabel="Search" hitSlop={8}>
          <Icon name="search" size={19} color={color.text} strokeWidth={1.8} />
        </Pressable>
        <Pressable ref={avatarRef} style={styles.avatar} onPress={handleOpenProfile} accessibilityLabel="Profile">
          <Text style={styles.avatarText}>{user ? initials(user.name) : '—'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.dateLabel}>
          {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Text style={styles.greeting}>
          {`Good ${now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}${user ? `, ${user.name.split(' ')[0]}` : ''}`}
        </Text>

        <View style={styles.actionRow}>
          <Pressable style={styles.newMeetingButton} onPress={handleNewMeeting} disabled={creating}>
            {creating ? (
              <ActivityIndicator color={color.white} />
            ) : (
              <>
                <Icon name="camera" size={17} color={color.white} strokeWidth={2} />
                <Text style={styles.newMeetingText}>New meeting</Text>
              </>
            )}
          </Pressable>
          <Pressable style={styles.joinButton} onPress={() => setJoinModalOpen(true)} accessibilityLabel="Join with ID">
            <Icon name="plus" size={20} color={color.text} strokeWidth={1.8} />
          </Pressable>
        </View>

        <View style={styles.statRow}>
          <View style={[styles.statCell, styles.statCellBorder]}>
            <Text style={styles.statLabel}>Today</Text>
            <Text style={styles.statValue}>{todayCount} meetings</Text>
          </View>
          <View style={[styles.statCell, styles.statCellLeft]}>
            <Text style={styles.statLabel}>Open actions</Text>
            <Text style={styles.statValue}>{openActions}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Up next</Text>
          <Pressable onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.link}>Schedule</Text>
          </Pressable>
        </View>

        {upNext.length === 0 ? (
          <Text style={styles.emptyText}>Nothing scheduled. Start a meeting above.</Text>
        ) : (
          upNext.map((meeting) => (
            <View key={meeting.id} style={styles.upNextRow}>
              <Text style={styles.upNextTime} numberOfLines={1}>
                {meeting.status === 'LIVE'
                  ? 'Live'
                  : meeting.scheduledAt
                    ? new Date(meeting.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                    : '—'}
              </Text>
              <View style={styles.upNextInfo}>
                <Text style={styles.upNextTitle} numberOfLines={1}>
                  {meeting.title}
                </Text>
                <Text style={styles.upNextHost} numberOfLines={1}>
                  {meeting.createdBy?.name ?? 'Unknown host'}
                </Text>
              </View>
              <Pressable
                style={styles.joinRowButton}
                onPress={() => navigation.navigate('MeetingRoom', { meetingId: meeting.id })}
              >
                <Text style={styles.joinRowButtonText}>{meeting.status === 'LIVE' ? 'Join' : 'View'}</Text>
              </Pressable>
            </View>
          ))
        )}

        <View style={styles.weekCard}>
          <Text style={styles.weekLabel}>This week</Text>
          <Text style={styles.weekValue}>{meetingsThisWeek} meeting{meetingsThisWeek === 1 ? '' : 's'}</Text>
          <Text style={styles.weekSub}>completed and available in your library.</Text>
        </View>
      </ScrollView>

      <Modal visible={joinModalOpen} transparent animationType="fade" onRequestClose={() => setJoinModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Join with meeting ID</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Meeting ID"
              placeholderTextColor={textMuted(0.45)}
              value={joinId}
              onChangeText={setJoinId}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setJoinModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalJoin} onPress={handleJoinWithId}>
                <Text style={styles.modalJoinText}>Join</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ProfileModal visible={profileOpen} onClose={() => setProfileOpen(false)} anchor={profileAnchor} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: space[4] + 4,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: color.divider
  },
  brandMark: { width: 24, height: 24 },
  brandName: { fontFamily: font.headingBold, fontSize: 15, letterSpacing: 0.3, color: color.text },
  searchButton: {
    marginLeft: 'auto',
    width: control.touchMin,
    height: control.touchMin,
    borderWidth: 1,
    borderColor: color.neutral400,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatar: {
    width: 36,
    height: 36,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: { fontFamily: font.headingBold, fontSize: 13, color: color.callText },
  scroll: { padding: space[4] + 4, paddingBottom: space[8] },
  dateLabel: {
    fontFamily: font.body,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.accent700,
    marginBottom: 6
  },
  greeting: { fontFamily: font.headingBold, fontSize: 28, lineHeight: 31, color: color.text, marginBottom: 18 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  newMeetingButton: {
    flex: 1,
    height: control.button,
    backgroundColor: color.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  newMeetingText: { fontFamily: font.body, fontSize: 15, fontWeight: '600', color: color.white },
  joinButton: {
    width: control.button,
    height: control.button,
    borderWidth: 1,
    borderColor: color.neutral400,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statRow: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: color.divider,
    marginBottom: 20
  },
  statCell: { flex: 1, paddingVertical: 14 },
  statCellBorder: { borderRightWidth: 1, borderRightColor: color.divider, paddingRight: 14 },
  statCellLeft: { paddingLeft: 14 },
  statLabel: { fontFamily: font.body, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: textMuted(0.55) },
  statValue: { fontFamily: font.headingBold, fontSize: 22, color: color.text, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 },
  sectionTitle: { fontFamily: font.headingBold, fontSize: 17, color: color.text },
  link: { fontFamily: font.bodySemiBold, fontSize: 13, color: color.accent700 },
  emptyText: { fontFamily: font.body, fontSize: 14, color: textMuted(0.6), paddingVertical: 16 },
  upNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: color.divider
  },
  upNextTime: { fontFamily: font.headingBold, fontSize: 14, width: 60, color: color.text },
  upNextInfo: { flex: 1, minWidth: 0 },
  upNextTitle: { fontFamily: font.bodySemiBold, fontSize: 15, color: color.text },
  upNextHost: { fontFamily: font.body, fontSize: 12, color: textMuted(0.55), marginTop: 1 },
  joinRowButton: { height: control.touchMin, paddingHorizontal: 16, borderWidth: 1, borderColor: color.neutral400, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center' },
  joinRowButtonText: { fontFamily: font.bodySemiBold, fontSize: 14, color: color.text },
  weekCard: { backgroundColor: color.accent, padding: 16, paddingHorizontal: 20, marginTop: 14 },
  weekLabel: { fontFamily: font.body, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)' },
  weekValue: { fontFamily: font.headingBold, fontSize: 24, color: color.white, marginTop: 4 },
  weekSub: { fontFamily: font.body, fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(45,43,43,0.5)', alignItems: 'center', justifyContent: 'center', padding: space[4] },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: color.surface, padding: space[4] + 4, gap: space[3] },
  modalTitle: { fontFamily: font.headingBold, fontSize: 18, color: color.text },
  modalInput: {
    height: control.input,
    borderWidth: 1,
    borderColor: color.neutral400,
    backgroundColor: color.white,
    paddingHorizontal: space[4],
    fontFamily: font.body,
    fontSize: 16,
    color: color.text
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space[2], marginTop: space[2] },
  modalCancel: { height: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontFamily: font.bodySemiBold, fontSize: 14, color: textMuted(0.7) },
  modalJoin: { height: 44, paddingHorizontal: 20, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  modalJoinText: { fontFamily: font.bodySemiBold, fontSize: 14, color: color.white }
});
