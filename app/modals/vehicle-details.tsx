/**
 * Vehicle Details Modal — Edit and View Vehicle Information.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius, VehicleColors } from '@/constants/theme';
import { useThemeColors, Button, Input, SectionHeader } from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import type { VehicleType } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

const vehicleTypes: { key: VehicleType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'gas', label: 'Gasoline', icon: 'flame', color: Brand.primary },
  { key: 'diesel', label: 'Diesel', icon: 'water', color: Brand.accent },
  { key: 'electric', label: 'Electric', icon: 'flash', color: Brand.ev },
  { key: 'hybrid', label: 'Hybrid', icon: 'leaf', color: Brand.success },
  { key: 'bi_fuel', label: 'Bi-Fuel (LPG/CNG)', icon: 'sync', color: Brand.info },
];

export default function VehicleDetailsModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { vehicles, updateVehicle, deleteVehicle } = useData();

  const vehicleId = typeof params.id === 'string' ? params.id : null;
  const existingVehicle = vehicles.find((v) => v.id === vehicleId);

  const [name, setName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');
  const [type, setType] = useState<VehicleType>('gas');
  const [odometer, setOdometer] = useState('');
  const [fuelCapacity, setFuelCapacity] = useState('');
  const [secondaryFuelCapacity, setSecondaryFuelCapacity] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');
  const [fullRangeKm, setFullRangeKm] = useState('');
  const [color, setColor] = useState(VehicleColors[0]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingVehicle) {
      setName(existingVehicle.name);
      setMake(existingVehicle.make);
      setModel(existingVehicle.model);
      setYear(existingVehicle.year.toString());
      setPlate(existingVehicle.plate);
      setVin(existingVehicle.vin || '');
      setType(existingVehicle.type);
      setOdometer(existingVehicle.odometer.toString());
      setFuelCapacity(existingVehicle.fuelCapacity?.toString() || '');
      setSecondaryFuelCapacity(existingVehicle.secondaryFuelCapacity?.toString() || '');
      setBatteryCapacity(existingVehicle.batteryCapacity?.toString() || '');
      setFullRangeKm(existingVehicle.fullRangeKm?.toString() || '');
      setColor(existingVehicle.color);
      setImageUri(existingVehicle.imageUri || null);
    }
  }, [existingVehicle]);

  if (!existingVehicle) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.text }}>Vehicle not found</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: Spacing.md }} />
      </View>
    );
  }

  const isEV = type === 'electric' || type === 'hybrid';

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !make.trim() || !model.trim()) return;
    setSaving(true);
    await updateVehicle(existingVehicle.id, {
      name: name.trim(),
      make: make.trim(),
      model: model.trim(),
      year: parseInt(year) || new Date().getFullYear(),
      plate: plate.trim().toUpperCase(),
      vin: vin.trim().toUpperCase() || undefined,
      type,
      odometer: parseInt(odometer) || 0,
      fuelCapacity: fuelCapacity ? parseFloat(fuelCapacity) : undefined,
      secondaryFuelCapacity: secondaryFuelCapacity && type === 'bi_fuel' ? parseFloat(secondaryFuelCapacity) : undefined,
      batteryCapacity: isEV && batteryCapacity ? parseFloat(batteryCapacity) : undefined,
      fullRangeKm: isEV && fullRangeKm ? parseInt(fullRangeKm) : undefined,
      color,
      imageUri: imageUri || undefined,
    });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete "${existingVehicle.name}"? All associated data will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            await deleteVehicle(existingVehicle.id);
            router.back();
          } 
        },
      ],
    );
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
        <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>Vehicle Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader title="Vehicle Type" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl }}>
          {vehicleTypes.map((vt) => (
            <TouchableOpacity
              key={vt.key}
              activeOpacity={0.7}
              onPress={() => setType(vt.key)}
              style={{
                width: '31%', alignItems: 'center', padding: Spacing.md,
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
                  textAlign: 'center'
                }}
              >
                {vt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
        <Input label="VIN (Optional)" placeholder="17-character VIN" value={vin} onChangeText={setVin} autoCapitalize="characters" icon="barcode-outline" />
        <Input label="Current Odometer" placeholder="50000" value={odometer} onChangeText={setOdometer} keyboardType="number-pad" suffix="km" />

        {(type === 'gas' || type === 'diesel' || type === 'hybrid' || type === 'bi_fuel') && (
          <Input 
            label={type === 'bi_fuel' ? 'Primary Tank Capacity (L)' : 'Fuel Tank Capacity (L)'} 
            placeholder="50" 
            value={fuelCapacity} 
            onChangeText={setFuelCapacity} 
            keyboardType="decimal-pad" 
            suffix="L" 
          />
        )}
        {type === 'bi_fuel' && (
          <Input 
            label="Secondary Tank Capacity (LPG/LNG/CNG)" 
            placeholder="30" 
            value={secondaryFuelCapacity} 
            onChangeText={setSecondaryFuelCapacity} 
            keyboardType="decimal-pad" 
            suffix="L" 
          />
        )}
        {isEV && (
          <>
            <Input label="Battery Capacity" placeholder="75" value={batteryCapacity} onChangeText={setBatteryCapacity} keyboardType="decimal-pad" suffix="kWh" />
            <Input label="Full Charge Range" placeholder="400" value={fullRangeKm} onChangeText={setFullRangeKm} keyboardType="number-pad" suffix="km" />
          </>
        )}



        <SectionHeader title="Theme Color & Photo" />
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
          
          <TouchableOpacity
            onPress={imageUri ? () => setImageUri(null) : pickImage}
            style={{
              width: 40, height: 40, borderRadius: 20, backgroundColor: c.surfaceElevated,
              borderWidth: imageUri ? 3 : 1.5, borderColor: imageUri ? '#FFF' : c.border, borderStyle: imageUri ? 'solid' : 'dashed',
              alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}
          >
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                <View style={{ position: 'absolute', backgroundColor: 'rgba(0,0,0,0.4)', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                   <Ionicons name="trash" size={16} color="#FFF" />
                </View>
              </>
            ) : (
              <Ionicons name="camera" size={18} color={c.textTertiary} />
            )}
          </TouchableOpacity>
        </View>

        <Button
          title="Save Changes"
          onPress={handleSave}
          size="lg"
          loading={saving}
          disabled={!name.trim() || !make.trim() || !model.trim()}
          style={{ marginBottom: Spacing.md }}
        />
        
        <Button
          title="Delete Vehicle"
          onPress={handleDelete}
          size="lg"
          variant="danger"
          icon="trash"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
