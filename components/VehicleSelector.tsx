/**
 * Vehicle selector pill shown on dashboard.
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Radius, Spacing, FontSizes } from '../constants/theme';
import { useThemeColors } from './ui';
import { useData } from '../contexts/DataContext';

interface VehicleSelectorProps {
  onAddVehicle: () => void;
}

export function VehicleSelector({ onAddVehicle }: VehicleSelectorProps) {
  const c = useThemeColors();
  const { vehicles, activeVehicleId, setActiveVehicle } = useData();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}
    >
      {vehicles.map((v) => {
        const isActive = v.id === activeVehicleId;
        return (
          <TouchableOpacity
            key={v.id}
            activeOpacity={0.7}
            onPress={() => setActiveVehicle(v.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: Radius.full,
              backgroundColor: isActive ? Brand.primary + '20' : c.surfaceElevated,
              borderWidth: 1,
              borderColor: isActive ? Brand.primary : c.border,
              gap: Spacing.sm,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: v.color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={
                  v.type === 'electric' ? 'flash' :
                  v.type === 'bi_fuel' ? 'sync' :
                  'car-sport'
                }
                size={12}
                color="#FFF"
              />
            </View>
            <Text
              style={{
                color: isActive ? Brand.primary : c.text,
                fontSize: FontSizes.sm,
                fontWeight: isActive ? '700' : '500',
              }}
            >
              {v.name}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onAddVehicle}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          borderRadius: Radius.full,
          borderWidth: 1,
          borderColor: c.border,
          borderStyle: 'dashed',
          gap: Spacing.xs,
        }}
      >
        <Ionicons name="add" size={16} color={c.textTertiary} />
        <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm }}>Add</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
