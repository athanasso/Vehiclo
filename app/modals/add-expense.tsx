/**
 * Add Expense Modal with category selection.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius, ExpenseCategories } from '@/constants/theme';
import { useThemeColors, Button, Input, SectionHeader } from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import { todayISO } from '@/utils/formatters';
import type { ExpenseCategory } from '@/types';

export default function AddExpenseModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeVehicle, addExpense } = useData();

  const [category, setCategory] = useState<ExpenseCategory>('parking');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!activeVehicle || !amount) return;
    setSaving(true);
    await addExpense({
      vehicleId: activeVehicle.id,
      category,
      amount: parseFloat(amount),
      description: description.trim() || ExpenseCategories.find(c => c.key === category)?.label || 'Expense',
      date,
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
        <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>Add Expense</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader title="Category" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl }}>
          {ExpenseCategories.filter(c => c.key !== 'fuel' && c.key !== 'maintenance').map((cat) => (
            <TouchableOpacity
              key={cat.key}
              activeOpacity={0.7}
              onPress={() => {
                setCategory(cat.key as ExpenseCategory);
                if (!description) setDescription(cat.label);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderRadius: Radius.full,
                backgroundColor: category === cat.key ? cat.color + '20' : c.surfaceElevated,
                borderWidth: 1,
                borderColor: category === cat.key ? cat.color : c.border,
                gap: Spacing.xs,
              }}
            >
              <Ionicons
                name={
                  cat.key === 'insurance' ? 'shield-checkmark' :
                  cat.key === 'tax' ? 'document-text' :
                  cat.key === 'parking' ? 'car' :
                  cat.key === 'toll' ? 'navigate' :
                  cat.key === 'wash' ? 'water' :
                  cat.key === 'charging' ? 'flash' :
                  'ellipsis-horizontal'
                }
                size={14}
                color={category === cat.key ? cat.color : c.textTertiary}
              />
              <Text
                style={{
                  color: category === cat.key ? cat.color : c.textSecondary,
                  fontSize: FontSizes.sm,
                  fontWeight: '600',
                }}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" suffix="€" icon="cash" />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="What was this expense for?" icon="create" />
        <Input label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" icon="calendar" />

        <Button
          title="Save Expense"
          onPress={handleSave}
          size="lg"
          loading={saving}
          icon="wallet"
          disabled={!amount || !activeVehicle}
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
