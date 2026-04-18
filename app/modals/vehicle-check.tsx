/**
 * Vehicle Check Modal — DIY inspection checklist for everyday car users.
 * Supports: new checks, edit mode, reminder scheduling, full history.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius } from '@/constants/theme';
import {
  useThemeColors, Card, GlassCard, Button, Input, DateInput,
  SectionHeader, EmptyState, Badge, AlertBanner,
} from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import { todayISO, formatDate, daysUntil } from '@/utils/formatters';
import type { CheckItemKey, CheckStatus, CheckItem } from '@/types';

// ── Check item definitions ───────────────────────────────────
const CHECK_ITEMS: { key: CheckItemKey; label: string; icon: keyof typeof Ionicons.glyphMap; category: string }[] = [
  // Fluids
  { key: 'engine_oil', label: 'Engine Oil', icon: 'water', category: 'Fluids' },
  { key: 'coolant', label: 'Coolant Level', icon: 'thermometer', category: 'Fluids' },
  { key: 'brake_fluid', label: 'Brake Fluid', icon: 'ellipse', category: 'Fluids' },
  { key: 'washer_fluid', label: 'Washer Fluid', icon: 'rainy', category: 'Fluids' },
  // Tires & Brakes
  { key: 'tire_pressure', label: 'Tire Pressure', icon: 'speedometer', category: 'Tires & Brakes' },
  { key: 'tire_tread', label: 'Tire Tread', icon: 'disc', category: 'Tires & Brakes' },
  { key: 'brakes', label: 'Brake Pads', icon: 'hand-left', category: 'Tires & Brakes' },
  // Lights & Visibility
  { key: 'lights_front', label: 'Front Lights', icon: 'flashlight', category: 'Lights & Visibility' },
  { key: 'lights_rear', label: 'Rear Lights', icon: 'flashlight', category: 'Lights & Visibility' },
  { key: 'wipers', label: 'Wipers', icon: 'water', category: 'Lights & Visibility' },
  // Under the Hood
  { key: 'battery', label: 'Battery', icon: 'battery-half', category: 'Under the Hood' },
  { key: 'belts', label: 'Belts & Hoses', icon: 'sync', category: 'Under the Hood' },
  { key: 'air_filter', label: 'Air Filter', icon: 'leaf', category: 'Under the Hood' },
  // Other
  { key: 'ac_system', label: 'A/C System', icon: 'snow', category: 'Other' },
  { key: 'exhaust', label: 'Exhaust', icon: 'cloud', category: 'Other' },
];

const STATUS_OPTIONS: { key: CheckStatus; label: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'good', label: 'Good', color: Brand.success, icon: 'checkmark-circle' },
  { key: 'low', label: 'Low', color: Brand.warning, icon: 'alert-circle' },
  { key: 'needs_attention', label: 'Attention', color: Brand.danger, icon: 'close-circle' },
  { key: 'not_checked', label: 'Skip', color: '#666', icon: 'remove-circle' },
];

export default function VehicleCheckModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const {
    activeVehicle, vehicleChecks, vehicleChecksForVehicle,
    addVehicleCheck, updateVehicleCheck, deleteVehicleCheck,
  } = useData();

  const editingCheck = params.id ? vehicleChecks.find((ch) => ch.id === params.id) : null;
  const isEditing = !!editingCheck;

  const [mode, setMode] = useState<'history' | 'new'>(isEditing ? 'new' : 'history');
  const [items, setItems] = useState<CheckItem[]>(
    CHECK_ITEMS.map((ci) => ({ key: ci.key, status: 'not_checked' as CheckStatus }))
  );
  const [notes, setNotes] = useState('');
  const [nextCheckDate, setNextCheckDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (editingCheck) {
      // Rebuild items array: set statuses from saved items, default to not_checked
      const savedMap = new Map(editingCheck.items.map(i => [i.key, i]));
      setItems(CHECK_ITEMS.map(ci => ({
        key: ci.key,
        status: savedMap.get(ci.key)?.status || 'not_checked',
        note: savedMap.get(ci.key)?.note,
      })));
      setNotes(editingCheck.overallNotes || '');
      setNextCheckDate(editingCheck.nextCheckDate || '');
      setMode('new');
    }
  }, [editingCheck]);

  const categories = useMemo(() => {
    const cats = [...new Set(CHECK_ITEMS.map((ci) => ci.category))];
    return cats.map((cat) => ({
      name: cat,
      items: CHECK_ITEMS.filter((ci) => ci.category === cat),
    }));
  }, []);

  const getStatus = (key: CheckItemKey) => items.find((i) => i.key === key)?.status || 'not_checked';

  const setItemStatus = (key: CheckItemKey, status: CheckStatus) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, status } : i)));
  };

  const checkedCount = items.filter((i) => i.status !== 'not_checked').length;
  const issueCount = items.filter((i) => i.status === 'low' || i.status === 'needs_attention').length;

  // Compute next check reminder alert from most recent check
  const latestCheck = vehicleChecksForVehicle.sort((a, b) => b.date.localeCompare(a.date))[0];
  const nextCheckDays = latestCheck?.nextCheckDate ? daysUntil(latestCheck.nextCheckDate) : null;

  const handleSave = async () => {
    if (!activeVehicle) return;
    setSaving(true);

    const checkData = {
      vehicleId: activeVehicle.id,
      date: isEditing ? editingCheck!.date : todayISO(),
      odometer: activeVehicle.odometer,
      items: items.filter((i) => i.status !== 'not_checked'),
      overallNotes: notes.trim() || undefined,
      nextCheckDate: nextCheckDate || undefined,
    };

    if (isEditing && editingCheck) {
      await updateVehicleCheck(editingCheck.id, checkData);
    } else {
      await addVehicleCheck(checkData);
    }

    setSaving(false);
    setMode('history');
    setItems(CHECK_ITEMS.map((ci) => ({ key: ci.key, status: 'not_checked' as CheckStatus })));
    setNotes('');
    setNextCheckDate('');
    Alert.alert(
      isEditing ? 'Check Updated ✅' : 'Check Complete ✅',
      `Inspection saved with ${checkedCount} items checked.${nextCheckDate ? `\nReminder set for ${formatDate(nextCheckDate)}` : ''}`
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Check', 'Remove this inspection record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteVehicleCheck(id) },
    ]);
  };

  const getCheckSummary = (checkItems: CheckItem[]) => {
    const good = checkItems.filter((i) => i.status === 'good').length;
    const low = checkItems.filter((i) => i.status === 'low').length;
    const bad = checkItems.filter((i) => i.status === 'needs_attention').length;
    return { good, low, bad, total: checkItems.length };
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={c.text} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Ionicons name="clipboard" size={20} color={Brand.info} />
          <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>
            {isEditing ? 'Edit Check' : 'Vehicle Check'}
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Tab Switcher (hidden when editing) */}
      {!isEditing && (
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
          <View
            style={{
              flexDirection: 'row', backgroundColor: c.surfaceElevated,
              borderRadius: Radius.md, padding: 3,
            }}
          >
            {(['history', 'new'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.7}
                onPress={() => setMode(t)}
                style={{
                  flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm,
                  backgroundColor: mode === t ? Brand.info : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: mode === t ? '#000' : c.textSecondary,
                    fontSize: FontSizes.sm, fontWeight: '700',
                  }}
                >
                  {t === 'history' ? '📋 History' : '🔧 New Check'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {mode === 'new' ? (
          <>
            {/* Progress indicator */}
            <GlassCard style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
              <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm, fontWeight: '600' }}>
                PROGRESS
              </Text>
              <Text style={{ color: Brand.info, fontSize: FontSizes['3xl'], fontWeight: '800' }}>
                {checkedCount}/{CHECK_ITEMS.length}
              </Text>
              <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
                {issueCount > 0 ? `⚠️ ${issueCount} issue${issueCount > 1 ? 's' : ''} found` : 'No issues so far'}
              </Text>
            </GlassCard>

            {/* Check categories */}
            {categories.map((cat) => (
              <View key={cat.name} style={{ marginBottom: Spacing.xl }}>
                <SectionHeader title={cat.name} />
                {cat.items.map((ci) => {
                  const currentStatus = getStatus(ci.key);
                  const statusInfo = STATUS_OPTIONS.find((s) => s.key === currentStatus);
                  return (
                    <Card key={ci.key} style={{ marginBottom: Spacing.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm }}>
                        <View
                          style={{
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: (statusInfo?.color || c.border) + '15',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Ionicons name={ci.icon} size={18} color={statusInfo?.color || c.textTertiary} />
                        </View>
                        <Text style={{ flex: 1, color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>
                          {ci.label}
                        </Text>
                        {currentStatus !== 'not_checked' && (
                          <Badge text={statusInfo?.label || ''} color={statusInfo?.color || c.border} />
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                        {STATUS_OPTIONS.map((opt) => (
                          <TouchableOpacity
                            key={opt.key}
                            onPress={() => setItemStatus(ci.key, opt.key)}
                            style={{
                              flex: 1, paddingVertical: Spacing.xs, borderRadius: Radius.sm,
                              backgroundColor: currentStatus === opt.key ? opt.color + '20' : c.surfaceElevated,
                              borderWidth: 1,
                              borderColor: currentStatus === opt.key ? opt.color : c.border,
                              alignItems: 'center',
                            }}
                          >
                            <Ionicons
                              name={opt.icon}
                              size={16}
                              color={currentStatus === opt.key ? opt.color : c.textTertiary}
                            />
                            <Text
                              style={{
                                color: currentStatus === opt.key ? opt.color : c.textTertiary,
                                fontSize: 10, fontWeight: '600', marginTop: 2,
                              }}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </Card>
                  );
                })}
              </View>
            ))}

            <Input
              label="Overall Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional observations..."
              multiline
            />

            <DateInput
              label="Next Check Reminder (optional)"
              value={nextCheckDate}
              onChangeText={setNextCheckDate}
            />

            <Button
              title={isEditing ? 'Save Changes' : 'Save Inspection'}
              onPress={handleSave}
              size="lg"
              loading={saving}
              icon="checkmark-circle"
              disabled={checkedCount === 0 || !activeVehicle}
              style={{ marginTop: Spacing.md }}
            />
          </>
        ) : (
          <>
            {/* Reminder alert */}
            {nextCheckDays !== null && nextCheckDays <= 14 && (
              <View style={{ marginBottom: Spacing.lg }}>
                <AlertBanner
                  icon={nextCheckDays <= 0 ? 'alert-circle' : 'time'}
                  color={nextCheckDays <= 0 ? Brand.danger : Brand.warning}
                  text={
                    nextCheckDays <= 0
                      ? `Vehicle check is overdue by ${Math.abs(nextCheckDays)} days!`
                      : `Next vehicle check in ${nextCheckDays} days`
                  }
                  onPress={() => setMode('new')}
                />
              </View>
            )}

            {/* History view */}
            <SectionHeader
              title="Inspection History"
              action="+ New Check"
              onAction={() => setMode('new')}
            />

            {vehicleChecksForVehicle.length === 0 ? (
              <EmptyState
                icon="clipboard"
                title="No Inspections Yet"
                subtitle="Run your first DIY vehicle check to track your car's condition over time"
                actionLabel="Start Check"
                onAction={() => setMode('new')}
              />
            ) : (
              vehicleChecksForVehicle
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((check) => {
                  const summary = getCheckSummary(check.items);
                  return (
                    <Card
                      key={check.id}
                      style={{ marginBottom: Spacing.sm }}
                      onPress={() => router.push({ pathname: '/modals/vehicle-check', params: { id: check.id } } as any)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                        <View
                          style={{
                            width: 44, height: 44, borderRadius: 22,
                            backgroundColor: summary.bad > 0 ? Brand.danger + '15' : summary.low > 0 ? Brand.warning + '15' : Brand.success + '15',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Ionicons
                            name={summary.bad > 0 ? 'alert-circle' : summary.low > 0 ? 'warning' : 'checkmark-circle'}
                            size={22}
                            color={summary.bad > 0 ? Brand.danger : summary.low > 0 ? Brand.warning : Brand.success}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>
                            {formatDate(check.date)}
                          </Text>
                          <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
                            {check.items.length} items checked · {check.odometer} km
                          </Text>
                          <View style={{ flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs, flexWrap: 'wrap' }}>
                            {summary.good > 0 && <Badge text={`${summary.good} Good`} color={Brand.success} />}
                            {summary.low > 0 && <Badge text={`${summary.low} Low`} color={Brand.warning} />}
                            {summary.bad > 0 && <Badge text={`${summary.bad} Attention`} color={Brand.danger} />}
                            {check.nextCheckDate && (
                              <Badge
                                text={`Next: ${formatDate(check.nextCheckDate)}`}
                                color={daysUntil(check.nextCheckDate) <= 0 ? Brand.danger : Brand.info}
                              />
                            )}
                          </View>
                        </View>
                      </View>
                      {check.overallNotes && (
                        <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm, marginTop: Spacing.sm }}>
                          📝 {check.overallNotes}
                        </Text>
                      )}
                      <TouchableOpacity
                        onPress={() => handleDelete(check.id)}
                        style={{ position: 'absolute', top: 8, right: 8, padding: 4 }}
                      >
                        <Ionicons name="trash-outline" size={14} color={c.textTertiary} />
                      </TouchableOpacity>
                    </Card>
                  );
                })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
