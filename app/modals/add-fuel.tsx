/**
 * Add Fuel Log Modal.
 */
import { Button, Input, SectionHeader, useThemeColors } from '@/components/ui';
import { Brand, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useData } from '@/contexts/DataContext';
import { todayISO } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddFuelModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeVehicle, addFuelLog, vehicleFuelLogs } = useData();

  const [date, setDate] = useState(todayISO());
  const [odometer, setOdometer] = useState(activeVehicle?.odometer.toString() || '');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [station, setStation] = useState('');
  const [fuelType, setFuelType] = useState<'primary' | 'secondary'>('primary');
  const [fullTank, setFullTank] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const isBiFuel = activeVehicle?.type === 'bi_fuel';
  const totalCost = (parseFloat(liters) || 0) * (parseFloat(pricePerLiter) || 0);
  const parsedOdometer = parseInt(odometer) || 0;

  // Calculate distance from previous log
  const prevLog = vehicleFuelLogs
    .filter(l => l.vehicleId === activeVehicle?.id)
    .sort((a, b) => b.odometer - a.odometer)[0];
  const distance = prevLog ? parsedOdometer - prevLog.odometer : 0;

  const handleSave = async () => {
    if (!activeVehicle || !liters || !pricePerLiter) return;
    setSaving(true);
    await addFuelLog({
      vehicleId: activeVehicle.id,
      date,
      odometer: parsedOdometer,
      liters: parseFloat(liters),
      pricePerLiter: parseFloat(pricePerLiter),
      totalCost,
      station: station.trim(),
      fuelType: isBiFuel ? fuelType : undefined,
      fullTank,
      notes: notes.trim(),
      distance: distance > 0 ? distance : undefined,
    });
    router.back();
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
        <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>Add Fuel Log</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!activeVehicle && (
          <Text style={{ color: Brand.danger, fontSize: FontSizes.md, marginBottom: Spacing.lg }}>
            Please add a vehicle first!
          </Text>
        )}

        <Input label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" icon="calendar" />
        <Input label="Odometer" value={odometer} onChangeText={setOdometer} keyboardType="number-pad" suffix="km" icon="speedometer" />
        
        {isBiFuel && (
          <>
            <SectionHeader title="Which fuel did you add?" />
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setFuelType('primary')}
                style={{
                  flex: 1, alignItems: 'center', padding: Spacing.md,
                  borderRadius: Radius.md,
                  backgroundColor: fuelType === 'primary' ? Brand.primary + '20' : c.surfaceElevated,
                  borderWidth: 1.5,
                  borderColor: fuelType === 'primary' ? Brand.primary : c.border,
                }}
              >
                <Ionicons name="flame" size={24} color={fuelType === 'primary' ? Brand.primary : c.textTertiary} />
                <Text style={{ color: fuelType === 'primary' ? Brand.primary : c.textSecondary, fontWeight: '600', marginTop: 4 }}>Primary (Petrol)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setFuelType('secondary')}
                style={{
                  flex: 1, alignItems: 'center', padding: Spacing.md,
                  borderRadius: Radius.md,
                  backgroundColor: fuelType === 'secondary' ? Brand.warning + '20' : c.surfaceElevated,
                  borderWidth: 1.5,
                  borderColor: fuelType === 'secondary' ? Brand.warning : c.border,
                }}
              >
                <Ionicons name="sync" size={24} color={fuelType === 'secondary' ? Brand.warning : c.textTertiary} />
                <Text style={{ color: fuelType === 'secondary' ? Brand.warning : c.textSecondary, fontWeight: '600', marginTop: 4 }}>Secondary (LPG)</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {distance > 0 && (
          <Text style={{ color: Brand.primary, fontSize: FontSizes.sm, marginTop: -Spacing.sm, marginBottom: Spacing.md }}>
            📏 Distance since last fill-up: {distance} km
          </Text>
        )}

        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Input label="Liters" value={liters} onChangeText={setLiters} keyboardType="decimal-pad" suffix="L" containerStyle={{ flex: 1 }} />
          <Input label="Price/Liter" value={pricePerLiter} onChangeText={setPricePerLiter} keyboardType="decimal-pad" suffix="€/L" containerStyle={{ flex: 1 }} />
        </View>

        {/* Total Cost Display */}
        {totalCost > 0 && (
          <View
            style={{
              backgroundColor: Brand.primary + '15',
              borderRadius: 12, padding: Spacing.lg,
              alignItems: 'center', marginBottom: Spacing.lg,
              borderWidth: 1, borderColor: Brand.primary + '30',
            }}
          >
            <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm }}>Total Cost</Text>
            <Text style={{ color: Brand.primary, fontSize: FontSizes['3xl'], fontWeight: '800' }}>
              €{totalCost.toFixed(2)}
            </Text>
            {distance > 0 && (
              <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, marginTop: 4 }}>
                {((parseFloat(liters) / distance) * 100).toFixed(1)} L/100km
              </Text>
            )}
          </View>
        )}

        <Input label="Station" value={station} onChangeText={setStation} placeholder="e.g. Shell, BP" icon="location" />

        <View
          style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: Spacing.lg,
          }}
        >
          <Text style={{ color: c.text, fontSize: FontSizes.md }}>Full Tank</Text>
          <Switch
            value={fullTank}
            onValueChange={setFullTank}
            trackColor={{ false: c.border, true: Brand.primary + '60' }}
            thumbColor={fullTank ? Brand.primary : c.textTertiary}
          />
        </View>

        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional notes" multiline />

        <Button
          title="Save Fuel Log"
          onPress={handleSave}
          size="lg"
          loading={saving}
          icon="flame"
          disabled={!liters || !pricePerLiter || !activeVehicle}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
