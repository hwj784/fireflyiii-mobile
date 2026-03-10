import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle } from 'react-native-svg';

interface FireflyLogoProps {
  /** Width and height of the logo container */
  size?: number;
  /** Whether to use the gradient version (default) or solid color */
  variant?: 'gradient' | 'solid';
  /** Override the primary color for solid variant */
  color?: string;
}

/**
 * Firefly III logo — a white piggy bank silhouette inside a flame shape.
 * Drawn programmatically with SVG paths for crisp rendering at any size.
 *
 * The flame is rendered with the Firefly III orange gradient (#FFA284 → #CD5029 → #A33614),
 * with the piggy bank cut out in white. A teal eye dot completes the piggy.
 */
export function FireflyLogo({ size = 120, variant = 'gradient', color = '#CD5029' }: FireflyLogoProps) {
  // The logo is designed in a 200x260 viewBox (flame is taller than wide)
  const viewBoxWidth = 200;
  const viewBoxHeight = 260;

  return (
    <View style={{ width: size, height: size * (viewBoxHeight / viewBoxWidth) }}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      >
        <Defs>
          <LinearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFA284" />
            <Stop offset="0.45" stopColor="#CD5029" />
            <Stop offset="1" stopColor="#A33614" />
          </LinearGradient>
        </Defs>

        {/* Flame shape — a smooth teardrop/fire form */}
        <Path
          d={
            // Start at the flame tip (top center), sweep down-right to the base, around the bottom, and back up-left
            'M 100 4 ' +
            // Right side of flame — flowing curve outward then down
            'C 108 28, 150 60, 168 90 ' +
            'C 186 120, 196 148, 194 170 ' +
            // Right side curves into the base
            'C 192 200, 178 228, 155 244 ' +
            // Bottom curve
            'C 138 254, 118 258, 100 258 ' +
            'C 82 258, 62 254, 45 244 ' +
            // Left side going back up
            'C 22 228, 8 200, 6 170 ' +
            'C 4 148, 14 120, 32 90 ' +
            'C 50 60, 92 28, 100 4 Z'
          }
          fill={variant === 'gradient' ? 'url(#flameGrad)' : color}
        />

        {/* Inner flame flicker — a subtle lighter shape inside for depth */}
        <Path
          d={
            'M 100 40 ' +
            'C 106 56, 132 78, 146 100 ' +
            'C 158 120, 160 136, 158 150 ' +
            'C 155 168, 140 180, 130 186 ' +
            'C 118 192, 108 192, 100 192 ' +
            'C 92 192, 82 192, 70 186 ' +
            'C 60 180, 45 168, 42 150 ' +
            'C 40 136, 42 120, 54 100 ' +
            'C 68 78, 94 56, 100 40 Z'
          }
          fill="rgba(255,255,255,0.10)"
        />

        {/* Piggy bank body — rounded, cute shape */}
        <Path
          d={
            // Main body — an ellipse-like shape
            'M 62 168 ' +
            // Top of back, curving from tail area over the top to the head
            'C 62 148, 72 132, 88 128 ' +
            // Top of head / ears area
            'C 92 126, 96 120, 92 114 ' + // left ear going up
            'C 90 110, 92 106, 96 108 ' + // ear tip
            'C 100 110, 100 116, 98 122 ' + // ear coming back down
            'C 100 120, 104 120, 106 122 ' + // between ears
            'C 104 116, 104 110, 108 108 ' + // right ear going up
            'C 112 106, 114 110, 112 114 ' + // right ear tip
            'C 108 120, 112 126, 116 128 ' + // right ear coming down to head
            // Top of back continuing right
            'C 132 132, 142 148, 142 168 ' +
            // Snout — extends forward from the right
            'C 148 164, 156 160, 158 164 ' + // snout top
            'C 160 168, 158 176, 152 176 ' + // snout tip
            'C 148 176, 146 172, 142 174 ' + // snout bottom returning to body
            // Bottom of body — belly curving left with legs
            'C 142 186, 140 196, 138 204 ' + // right rear leg
            'C 136 210, 132 210, 130 204 ' + // right rear foot
            'C 128 196, 126 190, 118 190 ' + // belly between legs
            'C 110 190, 86 190, 78 190 ' + // belly
            'C 76 196, 74 204, 72 204 ' + // left rear foot
            'C 70 210, 66 210, 64 204 ' + // left rear leg
            'C 62 196, 62 186, 62 168 Z'
          }
          fill="white"
        />

        {/* Piggy eye */}
        <Circle cx="124" cy="142" r="4.5" fill="#1E6581" />

        {/* Piggy nostril (on snout) */}
        <Circle cx="152" cy="168" r="2" fill="rgba(205,80,41,0.35)" />

        {/* Curly tail */}
        <Path
          d={
            'M 64 160 ' +
            'C 54 154, 48 158, 50 164 ' +
            'C 52 170, 58 168, 58 162 ' +
            'C 58 156, 52 152, 46 156'
          }
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Coin slot on piggy's back */}
        <Path
          d="M 92 130 L 112 130"
          fill="none"
          stroke="rgba(205,80,41,0.25)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

/**
 * Compact version of the logo for app icon usage.
 * Renders the flame + piggy in a square format suitable for icon contexts.
 */
export function FireflyLogoIcon({ size = 60 }: { size?: number }) {
  return <FireflyLogo size={size} variant="gradient" />;
}
