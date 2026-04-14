/**
 * Animated circular health score gauge using react-native-svg.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated as RNAnimated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Brand, FontSizes, Spacing } from '../constants/theme';
import { getHealthLabel } from '../utils/calculations';
import { useThemeColors } from './ui';

const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

interface HealthGaugeProps {
  score: number;
  size?: number;
}

export function HealthGauge({ score, size = 160 }: HealthGaugeProps) {
  const c = useThemeColors();
  const { label, color } = getHealthLabel(score);
  const animatedValue = useRef(new RNAnimated.Value(0)).current;

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    RNAnimated.timing(animatedValue, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={c.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ color: c.text, fontSize: FontSizes['4xl'], fontWeight: '800' }}>
          {score}
        </Text>
        <Text style={{ color, fontSize: FontSizes.sm, fontWeight: '600', marginTop: -2 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}
