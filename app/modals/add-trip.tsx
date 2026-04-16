/**
 * Add Trip Modal with cost comparison.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useThemeColors, Button, Input, DateInput, SectionHeader, Card } from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import { todayISO, formatCurrency } from '@/utils/formatters';
import { calculateCostPerKm, compareTripCost } from '@/utils/calculations';

export default function AddTripModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ distanceKm?: string }>();
  const { vehicles, activeVehicle, addTripLog, vehicleFuelLogs } = useData();

  const [selectedVehicleId, setSelectedVehicleId] = useState(activeVehicle?.id || '');
  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedVehicleId) || activeVehicle, [vehicles, selectedVehicleId, activeVehicle]);

  const [date, setDate] = useState(todayISO());
  const [startOdo, setStartOdo] = useState(selectedVehicle?.odometer.toString() || '');
  const [endOdo, setEndOdo] = useState('');
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-fill from background tracking & swap vehicle logic
  useEffect(() => {
    if (selectedVehicle) {
      const currentOdo = selectedVehicle.odometer.toString();
      setStartOdo(currentOdo);

      if (params.distanceKm) {
        const dist = parseFloat(params.distanceKm);
        if (dist > 0) {
          setEndOdo((parseInt(currentOdo) + Math.round(dist)).toString());
          setPurpose((prev) => prev || 'Auto-detected Drive');
        }
      }
    }
  }, [selectedVehicleId, params.distanceKm, selectedVehicle]);

  const distance = Math.max(0, (parseInt(endOdo) || 0) - (parseInt(startOdo) || 0));
  const costPerKm = useMemo(() => calculateCostPerKm(vehicleFuelLogs), [vehicleFuelLogs]);
  const comparison = useMemo(
    () => (distance > 0 ? compareTripCost(distance, costPerKm) : null),
    [distance, costPerKm],
  );

  const handleSave = async () => {
    if (!selectedVehicle || distance <= 0) return;
    setSaving(true);
    await addTripLog({
      vehicleId: selectedVehicle.id,
      date,
      startOdometer: parseInt(startOdo) || 0,
      endOdometer: parseInt(endOdo) || 0,
      distance,
      purpose: purpose.trim() || 'Trip',
      costEstimate: comparison?.own,
      uberComparison: comparison?.uber,
      taxiComparison: comparison?.taxi,
      duration: duration ? parseInt(duration) : undefined,
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
        <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>Log Trip</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {vehicles.length > 1 && (
          <View style={{ marginBottom: Spacing.xl }}>
            <SectionHeader title="Select Vehicle" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
              {vehicles.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  onPress={() => setSelectedVehicleId(v.id)}
                  style={{
                    paddingHorizontal: Spacing.lg,
                    paddingVertical: Spacing.sm,
                    borderRadius: Radius.full,
                    backgroundColor: selectedVehicleId === v.id ? Brand.primary + '20' : c.surfaceElevated,
                    borderWidth: 1,
                    borderColor: selectedVehicleId === v.id ? Brand.primary : c.border,
                  }}
                >
                  <Text style={{ 
                    color: selectedVehicleId === v.id ? Brand.primary : c.textSecondary,
                    fontWeight: selectedVehicleId === v.id ? '700' : '600',
                  }}>
                    {v.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <DateInput label="Date" value={date} onChangeText={setDate} />
        <Input label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="e.g. Work commute" icon="flag" />

        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Input label="Start Odometer" value={startOdo} onChangeText={setStartOdo} keyboardType="number-pad" suffix="km" containerStyle={{ flex: 1 }} />
          <Input label="End Odometer" value={endOdo} onChangeText={setEndOdo} keyboardType="number-pad" suffix="km" containerStyle={{ flex: 1 }} />
        </View>

        {distance > 0 && (
          <View
            style={{
              backgroundColor: Brand.accent + '15',
              borderRadius: Radius.md,
              padding: Spacing.lg,
              alignItems: 'center',
              marginBottom: Spacing.lg,
              borderWidth: 1,
              borderColor: Brand.accent + '30',
            }}
          >
            <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm }}>Trip Distance</Text>
            <Text style={{ color: Brand.accent, fontSize: FontSizes['3xl'], fontWeight: '800' }}>
              {distance} km
            </Text>
          </View>
        )}

        <Input label="Duration (optional)" value={duration} onChangeText={setDuration} keyboardType="number-pad" suffix="min" icon="time" />

        {/* Cost Comparison */}
        {comparison && distance > 0 && (
          <View style={{ marginTop: Spacing.md }}>
            <SectionHeader title="💰 Cost Comparison" />
            <Card>
              <View style={{ gap: Spacing.md }}>
                {/* Your Cost */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Brand.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="car-sport" size={20} color={Brand.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>Your Car</Text>
                    <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>€{costPerKm.toFixed(3)}/km</Text>
                  </View>
                  <Text style={{ color: Brand.primary, fontSize: FontSizes.lg, fontWeight: '800' }}>
                    {formatCurrency(comparison.own)}
                  </Text>
                </View>
                {/* Uber */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>U</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>Uber</Text>
                    <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>Base €2.50 + €1.20/km</Text>
                  </View>
                  <Text style={{ color: Brand.danger, fontSize: FontSizes.lg, fontWeight: '800' }}>
                    {formatCurrency(comparison.uber)}
                  </Text>
                </View>
                {/* Taxi */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Brand.warning + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="car" size={20} color={Brand.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>Taxi</Text>
                    <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>Base €3.50 + €1.80/km</Text>
                  </View>
                  <Text style={{ color: Brand.warningDark, fontSize: FontSizes.lg, fontWeight: '800' }}>
                    {formatCurrency(comparison.taxi)}
                  </Text>
                </View>
                {/* Savings */}
                {comparison.savings > 0 && (
                  <View
                    style={{
                      backgroundColor: Brand.success + '15',
                      borderRadius: Radius.sm,
                      padding: Spacing.md,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: Brand.success + '30',
                    }}
                  >
                    <Text style={{ color: Brand.success, fontSize: FontSizes.md, fontWeight: '700' }}>
                      🎉 You save {formatCurrency(comparison.savings)} vs alternatives!
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          </View>
        )}

        <View style={{ marginTop: Spacing.xl }}>
          <Button
            title="Save Trip"
            onPress={handleSave}
            size="lg"
            loading={saving}
            icon="navigate"
            disabled={distance <= 0 || !selectedVehicle}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
