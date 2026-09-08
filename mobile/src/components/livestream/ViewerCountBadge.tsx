import { StyleSheet, Text, View } from 'react-native';
import { color, font } from '../../theme';

export function ViewerCountBadge({ count }: { count: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{count === 1 ? '1 viewer' : `${count} viewers`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { backgroundColor: 'rgba(20, 19, 18, 0.82)', paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  text: { fontFamily: font.bodySemiBold, color: color.callText, fontSize: 12 }
});
