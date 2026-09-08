import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../components/icons/Icon';
import { color, font } from '../theme';
import { listActionItems } from '../services/api/actionItems';

const TAB_ICON: Record<string, IconName> = {
  Home: 'home',
  Meetings: 'meetings',
  Schedule: 'schedule',
  Actions: 'actions',
  Library: 'library'
};

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [openActionCount, setOpenActionCount] = useState(0);

  // Refetches whenever the active tab changes — a lightweight proxy for
  // "the user just did something that might have changed this count"
  // without wiring a global store just for a tab badge.
  useEffect(() => {
    let cancelled = false;
    listActionItems({ scope: 'assigned' })
      .then(({ actionItems }) => {
        if (!cancelled) {
          setOpenActionCount(actionItems.filter((item) => item.status === 'PENDING' || item.status === 'IN_PROGRESS').length);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [state.index]);

  const badges: Partial<Record<string, number>> = { Actions: openActionCount };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        const isFocused = state.index === index;
        const badge = badges?.[route.name];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={[styles.item, isFocused && styles.itemActive]}>
            <View>
              <Icon
                name={TAB_ICON[route.name] ?? 'home'}
                size={20}
                color={isFocused ? color.text : color.neutral600}
                strokeWidth={1.9}
              />
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: color.divider,
    backgroundColor: color.bg
  },
  item: {
    flex: 1,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  itemActive: {
    borderBottomWidth: 3,
    borderBottomColor: color.accent
  },
  label: {
    fontFamily: font.body,
    fontSize: 10,
    color: color.neutral600
  },
  labelActive: {
    fontFamily: font.bodySemiBold,
    color: color.text
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 0,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    fontFamily: font.bodySemiBold,
    fontSize: 9,
    color: color.white
  }
});
