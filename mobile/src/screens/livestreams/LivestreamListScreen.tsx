import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { LivestreamListItem } from '../../components/livestream/LivestreamListItem';
import { listLivestreams } from '../../services/api/livestreams';
import type { AppStackParamList } from '../../navigation/types';
import type { Livestream } from '../../types';
import { Icon } from '../../components/icons/Icon';
import { color, control, font, space, textMuted } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'LivestreamList'>;

export function LivestreamListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [livestreams, setLivestreams] = useState<Livestream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const { livestreams: result } = await listLivestreams();
      setLivestreams(result);
    } catch {
      setError(t('livestreams.list.loadError'));
    }
  }, [t]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel={t('common.back')}>
          <Icon name="back" size={22} color={color.text} strokeWidth={1.9} />
        </Pressable>
        <Text style={styles.headerLabel}>{t('livestreams.list.title')}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.accent} />
        </View>
      ) : (
        <FlatList
          data={livestreams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={color.accent} />}
          renderItem={({ item }) => (
            <LivestreamListItem
              livestream={item}
              onPress={() => navigation.navigate('LivestreamViewer', { livestreamId: item.id })}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t('livestreams.list.empty')}</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  iconButton: { width: control.touchMin, height: control.touchMin, alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontFamily: font.headingBold, fontSize: 17, color: color.text },
  error: { fontFamily: font.body, color: color.accent700, paddingHorizontal: space[4] + 4, paddingTop: 12 },
  list: { paddingHorizontal: space[4] + 4 },
  empty: { fontFamily: font.body, color: textMuted(0.6), textAlign: 'center', marginTop: 40 }
});
