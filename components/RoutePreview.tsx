import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { Brand, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useThemeColors } from '@/components/ui';

export interface RoutePoint {
  lat: number;
  lng: number;
  time?: number;
}

export function RoutePreview({ points, color }: { points: RoutePoint[]; color: string }) {
  const c = useThemeColors();

  const { svgPoints, startPoint, endPoint } = useMemo(() => {
    if (points.length < 2) return { svgPoints: '', startPoint: null, endPoint: null };

    const width = 280;
    const height = 160;
    const padding = 20;

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const p of points) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    }

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;

    const mapped = points.map((p) => ({
      x: padding + ((p.lng - minLng) / lngRange) * (width - padding * 2),
      y: padding + ((maxLat - p.lat) / latRange) * (height - padding * 2),
    }));

    const svgStr = mapped.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return {
      svgPoints: svgStr,
      startPoint: mapped[0],
      endPoint: mapped[mapped.length - 1],
    };
  }, [points]);

  if (points.length < 2) return null;

  return (
    <View
      style={{
        backgroundColor: c.surfaceElevated,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        marginVertical: Spacing.sm,
      }}
    >
      <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs, fontWeight: '600', marginBottom: Spacing.xs }}>
        ROUTE
      </Text>
      <Svg width={280} height={160}>
        <Polyline
          points={svgPoints}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />
        {startPoint && <Circle cx={startPoint.x} cy={startPoint.y} r={5} fill={Brand.success} />}
        {endPoint && <Circle cx={endPoint.x} cy={endPoint.y} r={5} fill={Brand.danger} />}
      </Svg>
      <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.success }} />
          <Text style={{ color: c.textTertiary, fontSize: 10 }}>Start</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.danger }} />
          <Text style={{ color: c.textTertiary, fontSize: 10 }}>End</Text>
        </View>
      </View>
    </View>
  );
}
