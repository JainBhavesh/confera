import { StyleSheet, Text, View } from 'react-native';

export function ViewerCountBadge({ count }: { count: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{count === 1 ? '1 viewer' : `${count} viewers`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { backgroundColor: 'rgba(15, 23, 42, 0.85)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  text: { color: '#fff', fontSize: 12, fontWeight: '600' }
});
