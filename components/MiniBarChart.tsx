/**
 * Mini bar chart for monthly expenses displayed on dashboard/expenses.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Brand, Spacing, FontSizes, Radius } from '../constants/theme';
import { useThemeColors } from './ui';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface MiniBarChartProps {
  data: BarData[];
  height?: number;
}

export function MiniBarChart({ data, height = 100 }: MiniBarChartProps) {
  const c = useThemeColors();
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: Spacing.sm }}>
      {data.map((d, i) => {
        const barHeight = Math.max((d.value / maxValue) * (height - 20), 4);
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Text style={{ color: c.textTertiary, fontSize: 9, fontWeight: '600' }}>
              {d.value > 0 ? `€${d.value.toFixed(0)}` : ''}
            </Text>
            <View
              style={{
                width: '70%',
                height: barHeight,
                borderRadius: Radius.sm,
                backgroundColor: d.color || Brand.primary,
              }}
            />
            <Text style={{ color: c.textTertiary, fontSize: 9 }}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
