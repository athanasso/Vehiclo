/**
 * Add Maintenance Record Modal.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius, MaintenanceTypes } from '@/constants/theme';
import { useThemeColors, Button, Input, SectionHeader } from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import { todayISO } from '@/utils/formatters';
import type { MaintenanceType } from '@/types';

export default function AddMaintenanceModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeVehicle, addMaintenance } = useData();

  const [type, setType] = useState<MaintenanceType>('oil');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [cost, setCost] = useState('');
  const [odometer, setOdometer] = useState(activeVehicle?.odometer.toString() || '');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextDueOdo, setNextDueOdo] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedType = MaintenanceTypes.find((t) => t.key === type);

  const handleSave = async () => {
    if (!activeVehicle || !description.trim()) return;
    setSaving(true);
    await addMaintenance({
      vehicleId: activeVehicle.id,
      type,
      description: description.trim(),
      date,
      cost: parseFloat(cost) || 0,
      odometer: parseInt(odometer) || activeVehicle.odometer,
      nextDueDate: nextDueDate || undefined,
      nextDueOdometer: nextDueOdo ? parseInt(nextDueOdo) : undefined,
    });
    router.back();
  };

  // Auto-fill next due odometer based on type interval
  const handleTypeSelect = (key: MaintenanceType) => {
    setType(key);
    const mt = MaintenanceTypes.find((t) => t.key === key);
    if (mt) {
      setDescription(mt.label);
      if (mt.intervalKm > 0) {
        const nextOdo = (parseInt(odometer) || activeVehicle?.odometer || 0) + mt.intervalKm;
        setNextDueOdo(nextOdo.toString());
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={c.text} />
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>Add Service</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type Selector */}
        <SectionHeader title="Service Type" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl }}>
          {MaintenanceTypes.map((mt) => (
            <TouchableOpacity
              key={mt.key}
              activeOpacity={0.7}
              onPress={() => handleTypeSelect(mt.key as MaintenanceType)}
              style={{
                paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                borderRadius: Radius.full,
                backgroundColor: type === mt.key ? Brand.accent + '20' : c.surfaceElevated,
                borderWidth: 1,
                borderColor: type === mt.key ? Brand.accent : c.border,
              }}
            >
              <Text
                style={{
                  color: type === mt.key ? Brand.accent : c.textSecondary,
                  fontSize: FontSizes.sm, fontWeight: '600',
                }}
              >
                {mt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Description" value={description} onChangeText={setDescription} placeholder="e.g. Full synthetic oil change" icon="create" />
        <Input label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" icon="calendar" />
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Input label="Cost" value={cost} onChangeText={setCost} keyboardType="decimal-pad" suffix="€" containerStyle={{ flex: 1 }} />
          <Input label="Odometer" value={odometer} onChangeText={setOdometer} keyboardType="number-pad" suffix="km" containerStyle={{ flex: 1 }} />
        </View>

        <SectionHeader title="Next Service (Optional)" />
        <Input label="Next Due Date" value={nextDueDate} onChangeText={setNextDueDate} placeholder="YYYY-MM-DD" icon="calendar" />
        <Input label="Next Due Odometer" value={nextDueOdo} onChangeText={setNextDueOdo} keyboardType="number-pad" suffix="km" icon="speedometer" />

        {selectedType && selectedType.intervalKm > 0 && (
          <Text style={{ color: Brand.info, fontSize: FontSizes.sm, marginTop: -Spacing.sm, marginBottom: Spacing.lg }}>
            💡 Recommended interval: every {selectedType.intervalKm.toLocaleString()} km
          </Text>
        )}

        <Button
          title="Save Service Record"
          onPress={handleSave}
          size="lg"
          loading={saving}
          icon="construct"
          disabled={!description.trim() || !activeVehicle}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
