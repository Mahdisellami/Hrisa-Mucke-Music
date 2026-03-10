import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

const MAPPING: Record<string, string> = {
  'music': 'music.note',   // SF Symbol proper name
  'hammer': 'hammer.fill',
  'chevron.left.forwardslash.chevron.right': 'chevron.left.slash.chevron.right',
  'chevron.right': 'chevron.right',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={MAPPING[name] ?? name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
