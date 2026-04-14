/**
 * Add Vehicle Modal — Multi-car & EV support.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius, VehicleColors } from '@/constants/theme';
import { useThemeColors, Card, Button, Input, SectionHeader } from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import type { VehicleType } from '@/types';

const vehicleTypes: { key: VehicleType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'gas', label: 'Gasoline', icon: 'flame', color: Brand.primary },
  { key: 'diesel', label: 'Diesel', icon: 'water', color: Brand.accent },
  { key: 'electric', label: 'Electric', icon: 'flash', color: Brand.ev },
  { key: 'hybrid', label: 'Hybrid', icon: 'leaf', color: Brand.success },
];

export default function AddVehicleModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addVehicle } = useData();

  const [name, setName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [plate, setPlate] = useState('');
  const [type, setType] = useState<VehicleType>('gas');
  const [odometer, setOdometer] = useState('');
  const [fuelCapacity, setFuelCapacity] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');
  const [fullRangeKm, setFullRangeKm] = useState('');
  const [color, setColor] = useState(VehicleColors[0]);
  const [saving, setSaving] = useState(false);

  const isEV = type === 'electric' || type === 'hybrid';

  const handleSave = async () => {
    if (!name.trim() || !make.trim() || !model.trim()) return;
    setSaving(true);
    await addVehicle({
      name: name.trim(),
      make: make.trim(),
      model: model.trim(),
      year: parseInt(year) || new Date().getFullYear(),
      plate: plate.trim().toUpperCase(),
      type,
      odometer: parseInt(odometer) || 0,
      fuelCapacity: fuelCapacity ? parseFloat(fuelCapacity) : undefined,
      batteryCapacity: isEV && batteryCapacity ? parseFloat(batteryCapacity) : undefined,
      fullRangeKm: isEV && fullRangeKm ? parseInt(fullRangeKm) : undefined,
      batteryPercent: isEV ? 100 : undefined,
      color,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={c.text} />
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>Add Vehicle</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Vehicle Type */}
        <SectionHeader title="Vehicle Type" />
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl }}>
          {vehicleTypes.map((vt) => (
            <TouchableOpacity
              key={vt.key}
              activeOpacity={0.7}
              onPress={() => setType(vt.key)}
              style={{
                flex: 1, alignItems: 'center', padding: Spacing.md,
                borderRadius: Radius.md,
                backgroundColor: type === vt.key ? vt.color + '20' : c.surfaceElevated,
                borderWidth: 1.5,
                borderColor: type === vt.key ? vt.color : c.border,
                gap: Spacing.xs,
              }}
            >
              <Ionicons name={vt.icon} size={24} color={type === vt.key ? vt.color : c.textTertiary} />
              <Text
                style={{
                  color: type === vt.key ? vt.color : c.textSecondary,
                  fontSize: FontSizes.xs, fontWeight: '600',
                }}
              >
                {vt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Details */}
        <SectionHeader title="Details" />
        <Input label="Nickname" placeholder="e.g. My Tesla" value={name} onChangeText={setName} icon="car-sport" />
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Input label="Make" placeholder="Toyota" value={make} onChangeText={setMake} containerStyle={{ flex: 1 }} />
          <Input label="Model" placeholder="Corolla" value={model} onChangeText={setModel} containerStyle={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Input label="Year" placeholder="2024" value={year} onChangeText={setYear} keyboardType="number-pad" containerStyle={{ flex: 1 }} />
          <Input label="Plate" placeholder="ABC-1234" value={plate} onChangeText={setPlate} autoCapitalize="characters" containerStyle={{ flex: 1 }} />
        </View>
        <Input label="Current Odometer" placeholder="50000" value={odometer} onChangeText={setOdometer} keyboardType="number-pad" suffix="km" />

        {/* Fuel/Battery Capacity */}
        {(type === 'gas' || type === 'diesel' || type === 'hybrid') && (
          <Input label="Fuel Tank Capacity" placeholder="50" value={fuelCapacity} onChangeText={setFuelCapacity} keyboardType="decimal-pad" suffix="L" />
        )}
        {isEV && (
          <>
            <Input label="Battery Capacity" placeholder="75" value={batteryCapacity} onChangeText={setBatteryCapacity} keyboardType="decimal-pad" suffix="kWh" />
            <Input label="Full Charge Range" placeholder="400" value={fullRangeKm} onChangeText={setFullRangeKm} keyboardType="number-pad" suffix="km" />
          </>
        )}

        {/* Color Picker */}
        <SectionHeader title="Color" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing['2xl'] }}>
          {VehicleColors.map((vc) => (
            <TouchableOpacity
              key={vc}
              onPress={() => setColor(vc)}
              style={{
                width: 40, height: 40, borderRadius: 20, backgroundColor: vc,
                borderWidth: color === vc ? 3 : 0, borderColor: '#FFF',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {color === vc && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Add Vehicle"
          onPress={handleSave}
          size="lg"
          loading={saving}
          disabled={!name.trim() || !make.trim() || !model.trim()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
