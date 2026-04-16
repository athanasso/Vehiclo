/**
 * Add Maintenance Record Modal.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius, MaintenanceTypes } from '@/constants/theme';
import { useThemeColors, Button, Input, DateInput, SectionHeader } from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import { todayISO } from '@/utils/formatters';
import type { MaintenanceType } from '@/types';

export default function AddMaintenanceModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { activeVehicle, addMaintenance, updateMaintenance, vehicleMaintenance, deleteMaintenance } = useData();

  const editId = typeof params.id === 'string' ? params.id : null;
  const existingRecord = editId ? vehicleMaintenance.find(m => m.id === editId) : null;

  const [type, setType] = useState<MaintenanceType>('oil');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [cost, setCost] = useState('');
  const [odometer, setOdometer] = useState(activeVehicle?.odometer.toString() || '');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextDueOdo, setNextDueOdo] = useState('');
  const [notes, setNotes] = useState('');
  const [customReminderDate, setCustomReminderDate] = useState('');
  const [customReminderNote, setCustomReminderNote] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (existingRecord) {
      setType(existingRecord.type);
      setDescription(existingRecord.description);
      setDate(existingRecord.date);
      setCost(existingRecord.cost ? existingRecord.cost.toString() : '');
      setOdometer(existingRecord.odometer ? existingRecord.odometer.toString() : '');
      setNextDueDate(existingRecord.nextDueDate || '');
      setNextDueOdo(existingRecord.nextDueOdometer ? existingRecord.nextDueOdometer.toString() : '');
      setNotes(existingRecord.notes || '');
      setCustomReminderDate(existingRecord.customReminderDate || '');
      setCustomReminderNote(existingRecord.customReminderNote || '');
    }
  }, [existingRecord]);

  const selectedType = MaintenanceTypes.find((t) => t.key === type);

  const handleSave = async () => {
    if (!activeVehicle || !description.trim()) return;
    setSaving(true);
    const payload = {
      vehicleId: activeVehicle.id,
      type,
      description: description.trim(),
      date,
      cost: parseFloat(cost) || 0,
      odometer: parseInt(odometer) || activeVehicle.odometer,
      nextDueDate: nextDueDate || undefined,
      nextDueOdometer: nextDueOdo ? parseInt(nextDueOdo) : undefined,
      notes: notes.trim() || undefined,
      customReminderDate: customReminderDate || undefined,
      customReminderNote: customReminderNote.trim() || undefined,
    };

    if (editId) {
      await updateMaintenance(editId, payload);
    } else {
      await addMaintenance(payload);
    }
    router.back();
  };

  // Auto-fill next due based on type interval
  const handleTypeSelect = (key: MaintenanceType) => {
    setType(key);
    const mt = MaintenanceTypes.find((t) => t.key === key);
    if (mt) {
      setDescription(mt.label);
      if (mt.intervalKm > 0) {
        const nextOdo = (parseInt(odometer) || activeVehicle?.odometer || 0) + mt.intervalKm;
        setNextDueOdo(nextOdo.toString());
      } else {
        setNextDueOdo('');
      }
      
      if (mt.intervalMonths && mt.intervalMonths > 0) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + mt.intervalMonths);
        setNextDueDate(d.toISOString().split('T')[0]);
      } else {
        setNextDueDate('');
      }
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (selectedType?.intervalMonths && selectedType.intervalMonths > 0) {
      const d = new Date(newDate);
      if (!isNaN(d.getTime())) {
        d.setMonth(d.getMonth() + selectedType.intervalMonths);
        setNextDueDate(d.toISOString().split('T')[0]);
      }
    }
  };

  const handleOdometerChange = (val: string) => {
    setOdometer(val);
    if (selectedType?.intervalKm && selectedType.intervalKm > 0) {
      const currentOdo = parseInt(val) || 0;
      const nextOdo = currentOdo + selectedType.intervalKm;
      setNextDueOdo(nextOdo.toString());
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
          {editId ? 'Edit Service' : 'Add Service'}
        </Text>
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
          {MaintenanceTypes.filter((mt) => mt.key !== 'lpg' || activeVehicle?.type === 'bi_fuel').map((mt) => (
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
        <DateInput label="Date" value={date} onChangeText={handleDateChange} />
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Input label="Cost" value={cost} onChangeText={setCost} keyboardType="decimal-pad" suffix="€" containerStyle={{ flex: 1 }} />
          <Input label="Odometer" value={odometer} onChangeText={handleOdometerChange} keyboardType="number-pad" suffix="km" containerStyle={{ flex: 1 }} />
        </View>
        <Input 
          label="Notes" 
          value={notes} 
          onChangeText={setNotes} 
          placeholder="General service notes (part numbers, shop name, etc.)" 
        />

        <SectionHeader title="Next Service (Optional)" />
        <DateInput label="Next Due Date" value={nextDueDate} onChangeText={setNextDueDate} />
        <Input label="Next Due Odometer" value={nextDueOdo} onChangeText={setNextDueOdo} keyboardType="number-pad" suffix="km" icon="speedometer" />

        {selectedType && (selectedType.intervalKm > 0 || (selectedType.intervalMonths && selectedType.intervalMonths > 0)) ? (
          <Text style={{ color: Brand.info, fontSize: FontSizes.sm, marginTop: -Spacing.sm, marginBottom: Spacing.lg }}>
            💡 Recommended interval:{' '}
            {selectedType.intervalKm > 0 ? `every ${selectedType.intervalKm.toLocaleString()} km` : ''}
            {selectedType.intervalKm > 0 && selectedType.intervalMonths && selectedType.intervalMonths > 0 ? ' or ' : ''}
            {selectedType.intervalMonths && selectedType.intervalMonths > 0 ? `${selectedType.intervalMonths} months` : ''}
          </Text>
        ) : null}

        <DateInput 
          label="Custom Reminder Date (Optional)" 
          value={customReminderDate} 
          onChangeText={setCustomReminderDate} 
        />
        <Input 
          label="Notification Message" 
          value={customReminderNote} 
          onChangeText={setCustomReminderNote} 
          placeholder="e.g. Call Dave for the timing belt" 
        />

        <Button
          title={editId ? "Update Service Record" : "Save Service Record"}
          onPress={handleSave}
          size="lg"
          loading={saving}
          icon={editId ? "checkmark" : "construct"}
          disabled={!description.trim() || !activeVehicle}
          style={{ marginBottom: Spacing.md }}
        />

        {editId && (
          <Button
            title="Delete Service Record"
            onPress={async () => {
              import('react-native').then(({ Alert }) => {
                Alert.alert("Delete", "Are you sure?", [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => {
                    await deleteMaintenance(editId);
                    router.back();
                  }}
                ]);
              });
            }}
            size="lg"
            variant="danger"
            icon="trash"
            style={{ marginBottom: Spacing.md }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
