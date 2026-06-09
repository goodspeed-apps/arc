import { Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gasConfig } from '../gas.config';
import { useThemeColors } from '@/context/ThemeContext';

export function BuiltWithBadge() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  const onPress = () => {
    const slug = gasConfig.app?.slug ?? '';
    Linking.openURL(`https://goodspeed.app/built-with?ref=${encodeURIComponent(slug)}`);
  };

// Sit inside the home-indicator/gesture region (below safe-area inset) so the
  // pill doesn't overlap tab bars or bottom action sheets. On Android without an
  // inset this collapses to bottom: 4.
  const bottomOffset = Math.max(insets.bottom - 24, 4);

  return (
    <View
      pointerEvents="box-none"
      style={[{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }, { bottom: bottomOffset }]}
    >
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: 'rgba(0,0,0,0.65)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
        }}
        accessibilityRole="link"
        accessibilityLabel="Built with Goodspeed"
      >
        <Text style={{ color: colors.textOnPrimary, fontSize: 11, fontWeight: '500' }}>Built with Goodspeed</Text>
      </Pressable>
    </View>
  );
}
