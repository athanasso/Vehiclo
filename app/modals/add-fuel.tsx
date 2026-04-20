/**
 * Add / Edit Fuel Log Modal.
 */
import { Button, DateInput, Input, SectionHeader, useThemeColors } from '@/components/ui';
import { Brand, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useData } from '@/contexts/DataContext';
import { recognizeText } from '@/modules/mlkit-ocr';
import { todayISO } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddFuelModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { activeVehicle, fuelLogs, addFuelLog, updateFuelLog, vehicleFuelLogs } = useData();

  const editingLog = params.id ? fuelLogs.find((l) => l.id === params.id) : null;
  const isEditing = !!editingLog;

  const [date, setDate] = useState(todayISO());
  const [odometer, setOdometer] = useState(activeVehicle?.odometer.toString() || '');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [station, setStation] = useState('');
  const [fuelType, setFuelType] = useState<'primary' | 'secondary'>('primary');
  const [fullTank, setFullTank] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [inputMode, setInputMode] = useState<'liters' | 'total'>('total');
  const [liters, setLiters] = useState('');
  const [totalCost, setTotalCost] = useState('');

  // Pre-fill form when editing
  useEffect(() => {
    if (editingLog) {
      setDate(editingLog.date);
      setOdometer(editingLog.odometer.toString());
      setLiters(editingLog.liters.toString());
      setPricePerLiter(editingLog.pricePerLiter.toString());
      setStation(editingLog.station || '');
      setFuelType(editingLog.fuelType || 'primary');
      setFullTank(editingLog.fullTank);
      setNotes(editingLog.notes || '');
    }
  }, [editingLog]);

  const isBiFuel = activeVehicle?.type === 'bi_fuel';
  const parsedOdometer = parseInt(odometer) || 0;

  // Auto-calculate the missing value based on input mode
  const computedTotalCost = inputMode === 'liters'
    ? (parseFloat(liters) || 0) * (parseFloat(pricePerLiter) || 0)
    : parseFloat(totalCost) || 0;
  const computedLiters = inputMode === 'total'
    ? (parseFloat(pricePerLiter) || 0) > 0 ? (parseFloat(totalCost) || 0) / (parseFloat(pricePerLiter) || 0) : 0
    : parseFloat(liters) || 0;

  // Calculate distance from previous log
  const prevLog = vehicleFuelLogs
    .filter(l => l.vehicleId === activeVehicle?.id && l.id !== editingLog?.id)
    .sort((a, b) => b.odometer - a.odometer)[0];
  const distance = prevLog ? parsedOdometer - prevLog.odometer : 0;

  const handleScanReceipt = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is needed to scan receipts.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0].uri) return;

      setScanning(true);
      const rawText = await recognizeText(result.assets[0].uri);
      
      // Heuristic parsing
      const cleanText = rawText.replace(/,/g, '.'); // Normalize decimals
      
      // Find 3 decimal numbers (usually Liters/Gallons) e.g., 34.501
      const volumeMatches = cleanText.match(/\b\d+\.\d{3}\b/g) || [];
      const vols = volumeMatches.map(parseFloat).filter(v => v > 1 && v < 200);
      const detectedVolume = vols.length > 0 ? Math.max(...vols) : 0;

      // Find 2 decimal numbers (usually Currency)
      const moneyMatches = cleanText.match(/\b\d+\.\d{2}\b/g) || [];
      const moneys = moneyMatches.map(parseFloat).filter(m => m > 1 && m < 300);
      // Usually total is the largest standard money amount on receipt
      const detectedTotal = moneys.length > 0 ? Math.max(...moneys) : 0;

      if (detectedVolume > 0 && detectedTotal > 0) {
        setLiters(detectedVolume.toString());
        setPricePerLiter((detectedTotal / detectedVolume).toFixed(3));
        Alert.alert('Receipt Scanned!', `Found €${detectedTotal} and ${detectedVolume}L`);
      } else if (detectedTotal > 0) {
        // Just got total cost
        Alert.alert('Partial Scan', `Found Total: €${detectedTotal}. Could not find volume reliably.`);
      } else {
        Alert.alert('Scan Failed', 'Could not confidently find fuel data looking at this format.');
      }
    } catch (e: any) {
      Alert.alert('OCR Error', e.message || 'Failed to analyze text.');
      console.log(e);
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!activeVehicle || computedLiters <= 0 || !parseFloat(pricePerLiter)) return;
    setSaving(true);

    const logData = {
      vehicleId: activeVehicle.id,
      date,
      odometer: parsedOdometer,
      liters: computedLiters,
      pricePerLiter: parseFloat(pricePerLiter),
      totalCost: computedTotalCost,
      station: station.trim(),
      fuelType: isBiFuel ? fuelType : undefined,
      fullTank,
      notes: notes.trim(),
      distance: distance > 0 ? distance : undefined,
    };

    if (isEditing && editingLog) {
      await updateFuelLog(editingLog.id, logData);
    } else {
      await addFuelLog(logData);
    }
    router.back();
  };

  // Handler for Liters input
  const handleLitersChange = (value: string) => {
    setLiters(value);
    const l = parseFloat(value) || 0;
    const p = parseFloat(pricePerLiter) || 0;
    setTotalCost((l * p).toFixed(2));
  };

  // Handler for Total Cost input
  const handleTotalChange = (value: string) => {
    setTotalCost(value);
    const t = parseFloat(value) || 0;
    const p = parseFloat(pricePerLiter) || 0;
    setLiters(p > 0 ? (t / p).toFixed(3) : '');
  };

  // Handler for Price input
  const handlePriceChange = (value: string) => {
    setPricePerLiter(value);
    const p = parseFloat(value) || 0;
    
    if (inputMode === 'liters') {
      const l = parseFloat(liters) || 0;
      setTotalCost((l * p).toFixed(2));
    } else {
      const t = parseFloat(totalCost) || 0;
      setLiters(p > 0 ? (t / p).toFixed(3) : '');
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
        <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>
          {isEditing ? 'Edit Fuel Log' : 'Add Fuel Log'}
        </Text>
        {scanning ? (
          <ActivityIndicator size="small" color={Brand.primary} />
        ) : (
          <TouchableOpacity onPress={handleScanReceipt}>
            <Ionicons name="receipt-outline" size={24} color={Brand.primary} />
          </TouchableOpacity>
        )}
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

        <DateInput label="Date" value={date} onChangeText={setDate} />
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
                <Text style={{ color: fuelType === 'secondary' ? Brand.warning : c.textSecondary, fontWeight: '600', marginTop: 4 }}>Secondary (LPG/CNG)</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {distance > 0 && (
          <Text style={{ color: Brand.primary, fontSize: FontSizes.sm, marginTop: -Spacing.sm, marginBottom: Spacing.md }}>
            📏 Distance since last fill-up: {distance} km
          </Text>
        )}

        {/* Input Mode Toggle */}
        <View
          style={{
            flexDirection: 'row', backgroundColor: c.surfaceElevated,
            borderRadius: Radius.md, padding: 3, marginBottom: Spacing.lg,
          }}
        >
          {(['total', 'liters'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              activeOpacity={0.7}
              onPress={() => setInputMode(m)}
              style={{
                flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm,
                backgroundColor: inputMode === m ? Brand.primary : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: inputMode === m ? '#000' : c.textSecondary,
                  fontSize: FontSizes.sm, fontWeight: '700',
                }}
              >
                {m === 'liters' ? '⛽ Liters + Price' : '💰 Total + Price'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {inputMode === 'liters' ? (
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Input label="Liters" value={liters} onChangeText={handleLitersChange} keyboardType="decimal-pad" suffix="L" containerStyle={{ flex: 1 }} />
            <Input label="Price/Liter" value={pricePerLiter} onChangeText={handlePriceChange} keyboardType="decimal-pad" suffix="€/L" containerStyle={{ flex: 1 }} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Input label="Total Cost" value={totalCost} onChangeText={handleTotalChange} keyboardType="decimal-pad" suffix="€" containerStyle={{ flex: 1 }} />
            <Input label="Price/Liter" value={pricePerLiter} onChangeText={handlePriceChange} keyboardType="decimal-pad" suffix="€/L" containerStyle={{ flex: 1 }} />
          </View>
        )}

        {/* Auto-calculated result */}
        {computedTotalCost > 0 && (
          <View
            style={{
              backgroundColor: Brand.primary + '15',
              borderRadius: 12, padding: Spacing.lg,
              alignItems: 'center', marginBottom: Spacing.lg,
              borderWidth: 1, borderColor: Brand.primary + '30',
            }}
          >
            {inputMode === 'liters' ? (
              <>
                <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm }}>Total Cost</Text>
                <Text style={{ color: Brand.primary, fontSize: FontSizes['3xl'], fontWeight: '800' }}>
                  €{computedTotalCost.toFixed(2)}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm }}>Calculated Volume</Text>
                <Text style={{ color: Brand.primary, fontSize: FontSizes['3xl'], fontWeight: '800' }}>
                  {computedLiters.toFixed(2)} L
                </Text>
              </>
            )}
            {distance > 0 && computedLiters > 0 && (
              <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, marginTop: 4 }}>
                {((computedLiters / distance) * 100).toFixed(1)} L/100km
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
          title={isEditing ? 'Save Changes' : 'Save Fuel Log'}
          onPress={handleSave}
          size="lg"
          loading={saving}
          icon="flame"
          disabled={!activeVehicle || computedLiters <= 0 || !parseFloat(pricePerLiter)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
