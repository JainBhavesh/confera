import { Circle, Path, Rect, Svg } from 'react-native-svg';

export type IconName =
  | 'back'
  | 'search'
  | 'share'
  | 'moreVertical'
  | 'moreHorizontal'
  | 'chat'
  | 'mic'
  | 'camera'
  | 'people'
  | 'callEnd'
  | 'home'
  | 'meetings'
  | 'schedule'
  | 'actions'
  | 'library'
  | 'play'
  | 'plus'
  | 'eye'
  | 'check';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Path data copied verbatim from the Confera Mobile design canvas
// (Claude Design project 011dd151-…) so icons render pixel-identical to
// the mock. Stroke icons take `color`/`strokeWidth`; filled icons ignore
// `strokeWidth`.
export function Icon({ name, size = 20, color = '#201e1d', strokeWidth = 1.9 }: IconProps) {
  const strokeProps = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  switch (name) {
    case 'back':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Path d="M15 5l-7 7 7 7" {...strokeProps} />
        </Svg>
      );
    case 'search':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Circle cx={11} cy={11} r={7} {...strokeProps} />
          <Path d="m20 20-3.5-3.5" {...strokeProps} />
        </Svg>
      );
    case 'share':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Path d="M12 16V4M8.5 7.5 12 4l3.5 3.5" {...strokeProps} />
          <Path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" {...strokeProps} />
        </Svg>
      );
    case 'moreVertical':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Circle cx={12} cy={5} r={1.7} fill={color} />
          <Circle cx={12} cy={12} r={1.7} fill={color} />
          <Circle cx={12} cy={19} r={1.7} fill={color} />
        </Svg>
      );
    case 'moreHorizontal':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Circle cx={5} cy={12} r={1.7} fill={color} />
          <Circle cx={12} cy={12} r={1.7} fill={color} />
          <Circle cx={19} cy={12} r={1.7} fill={color} />
        </Svg>
      );
    case 'chat':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" {...strokeProps} />
        </Svg>
      );
    case 'mic':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Rect x={9} y={3} width={6} height={11} rx={3} {...strokeProps} />
          <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...strokeProps} />
        </Svg>
      );
    case 'camera':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Path d="m16 10 5-3v10l-5-3z" {...strokeProps} />
          <Rect x={3} y={6} width={13} height={12} {...strokeProps} />
        </Svg>
      );
    case 'people':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Circle cx={9} cy={8} r={3.2} {...strokeProps} />
          <Path d="M3 19c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6" {...strokeProps} />
          <Path d="M16 5.4a3 3 0 0 1 0 5.6M17.5 13.6c2.1.6 3.5 2.5 3.5 5" {...strokeProps} />
        </Svg>
      );
    case 'callEnd':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" {...strokeProps} />
          <Path d="M16 8l4 4-4 4M20 12H9" {...strokeProps} />
        </Svg>
      );
    case 'home':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" {...strokeProps} />
        </Svg>
      );
    case 'meetings':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Path d="m16 10 5-3v10l-5-3z" {...strokeProps} />
          <Rect x={3} y={6} width={13} height={12} {...strokeProps} />
        </Svg>
      );
    case 'schedule':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Rect x={3} y={5} width={18} height={16} {...strokeProps} />
          <Path d="M3 10h18M8 3v4M16 3v4" {...strokeProps} />
        </Svg>
      );
    case 'actions':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Path d="M9 11l2.5 2.5L20 5" {...strokeProps} />
          <Path d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10" {...strokeProps} />
        </Svg>
      );
    case 'library':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Rect x={3} y={4} width={18} height={16} {...strokeProps} />
          <Path d="M7 4v16M17 4v16M3 12h18" {...strokeProps} />
        </Svg>
      );
    case 'play':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Path d="M8 5v14l11-7z" fill={color} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Path d="M12 5v14M5 12h14" {...strokeProps} />
        </Svg>
      );
    case 'eye':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" {...strokeProps} />
          <Circle cx={12} cy={12} r={3} {...strokeProps} />
        </Svg>
      );
    case 'check':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          <Path d="M5 12.5 10 17l9-10" {...strokeProps} strokeWidth={3} />
        </Svg>
      );
    default:
      return null;
  }
}

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg viewBox="0 0 48 48" width={size} height={size}>
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.5 26.7 36 24 36c-5.3 0-9.6-3.1-11.3-7.4l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.4-4.4 5.8l6.2 5.2C40.6 36.5 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </Svg>
  );
}
