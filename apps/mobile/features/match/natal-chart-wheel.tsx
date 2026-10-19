/**
 * A circular zodiac wheel showing planet positions.
 *
 * Outer ring: 12 zodiac sign segments with glyphs.
 * Inner area: planet dots placed at their ecliptic longitude, with glyphs.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Text as SvgText,
} from "react-native-svg";

import type { PlanetaryChart, PlanetKey } from "@/lib/api";
import type { Theme } from "@/constants/theme";

import {
  PLANET_GLYPHS,
  PLANET_COLORS,
  ZODIAC_GLYPHS,
  ZODIAC_COLORS,
} from "./glyphs";
import { PLANET_ORDER } from "./format";

interface Props {
  chart: PlanetaryChart;
  size?: number;
  theme: Theme;
  /** Optional second chart to overlay (dimmed) for comparison. */
  compare?: PlanetaryChart;
}

const DEFAULT_SIZE = 280;

export function NatalChartWheel({
  chart,
  size = DEFAULT_SIZE,
  theme,
  compare,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const signR = outerR - 28;      // inner edge of sign band
  const planetR = signR - 30;     // radius where planet dots sit
  const compareR = signR - 50;    // slightly further in for compare dots
  const innerR = signR - 64;      // innermost circle

  const segments = useMemo(() => {
    const segs: React.ReactNode[] = [];
    for (let i = 0; i < 12; i++) {
      // Each sign spans 30°. Astrological charts run counter-clockwise
      // with 0° Aries at the left (9 o'clock). We rotate the SVG so that
      // 0° starts at the top and goes clockwise (simpler math), then apply
      // a -90° rotation on the whole group.
      const startAngle = i * 30;
      const endAngle = (i + 1) * 30;
      const midAngle = startAngle + 15;

      const s1 = toRad(startAngle);
      const s2 = toRad(endAngle);
      const sm = toRad(midAngle);

      // Arc path for the sign band
      const x1o = cx + outerR * Math.cos(s1);
      const y1o = cy + outerR * Math.sin(s1);
      const x2o = cx + outerR * Math.cos(s2);
      const y2o = cy + outerR * Math.sin(s2);
      const x1i = cx + signR * Math.cos(s2);
      const y1i = cy + signR * Math.sin(s2);
      const x2i = cx + signR * Math.cos(s1);
      const y2i = cy + signR * Math.sin(s1);

      const d = [
        `M ${x1o} ${y1o}`,
        `A ${outerR} ${outerR} 0 0 1 ${x2o} ${y2o}`,
        `L ${x1i} ${y1i}`,
        `A ${signR} ${signR} 0 0 0 ${x2i} ${y2i}`,
        "Z",
      ].join(" ");

      const glyphX = cx + ((outerR + signR) / 2) * Math.cos(sm);
      const glyphY = cy + ((outerR + signR) / 2) * Math.sin(sm);

      segs.push(
        <G key={`sign-${i}`}>
          <Path d={d} fill={ZODIAC_COLORS[i]} opacity={0.2} />
          <Line
            x1={cx + signR * Math.cos(s1)}
            y1={cy + signR * Math.sin(s1)}
            x2={cx + outerR * Math.cos(s1)}
            y2={cy + outerR * Math.sin(s1)}
            stroke={theme.border}
            strokeWidth={0.5}
          />
          <SvgText
            x={glyphX}
            y={glyphY}
            fontSize={14}
            fill={ZODIAC_COLORS[i]}
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {ZODIAC_GLYPHS[i]}
          </SvgText>
        </G>,
      );
    }
    return segs;
  }, [cx, cy, outerR, signR, theme.border]);

  const planetDots = useMemo(() => {
    return (PLANET_ORDER as PlanetKey[]).map((planet) => {
      const deg = chart[planet];
      const rad = toRad(deg);
      const px = cx + planetR * Math.cos(rad);
      const py = cy + planetR * Math.sin(rad);
      const color = PLANET_COLORS[planet];

      return (
        <G key={planet}>
          <Circle cx={px} cy={py} r={6} fill={color} opacity={0.9} />
          <SvgText
            x={px}
            y={py + 14}
            fontSize={10}
            fill={color}
            textAnchor="middle"
            fontWeight="700"
          >
            {PLANET_GLYPHS[planet]}
          </SvgText>
        </G>
      );
    });
  }, [chart, cx, cy, planetR]);

  const compareDots = useMemo(() => {
    if (!compare) return null;
    return (PLANET_ORDER as PlanetKey[]).map((planet) => {
      const deg = compare[planet];
      const rad = toRad(deg);
      const px = cx + compareR * Math.cos(rad);
      const py = cy + compareR * Math.sin(rad);
      const color = PLANET_COLORS[planet];

      return (
        <G key={`cmp-${planet}`}>
          <Circle
            cx={px}
            cy={py}
            r={4}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            opacity={0.5}
          />
        </G>
      );
    });
  }, [compare, cx, cy, compareR]);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Rotate so 0° Aries is at the left (traditional) */}
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          {/* Outer circle */}
          <Circle
            cx={cx}
            cy={cy}
            r={outerR}
            fill="none"
            stroke={theme.border}
            strokeWidth={1}
          />
          {/* Sign band inner circle */}
          <Circle
            cx={cx}
            cy={cy}
            r={signR}
            fill="none"
            stroke={theme.border}
            strokeWidth={1}
          />
          {/* Inner circle */}
          <Circle
            cx={cx}
            cy={cy}
            r={innerR}
            fill="none"
            stroke={theme.border}
            strokeWidth={0.5}
            strokeDasharray="3,3"
          />

          {segments}
          {compareDots}
          {planetDots}
        </G>
      </Svg>
    </View>
  );
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 8,
  },
});
