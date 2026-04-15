/**
 * More tab — Vehicles, documents, settings with dark mode toggle,
 * units & currency picker, notifications toggle, about, sign out.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius } from '@/constants/theme';
import {
  useThemeColors, Card, GlassCard, ListItem, Divider, SectionHeader, Badge,
} from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext';
import { useSettings, CURRENCY_SYMBOLS } from '@/contexts/SettingsContext';
import {
  requestNotificationPermission, sendTestNotification,
  syncMaintenanceReminders, getScheduledCount,
} from '@/utils/notifications';
import {
  startDrivingDetection, stopDrivingDetection, isTrackingActive,
} from '@/utils/driving-detector';

const CURRENCIES = Object.keys(CURRENCY_SYMBOLS);
const DISTANCE_UNITS = [
  { key: 'km' as const, label: 'Kilometers (km)' },
  { key: 'mi' as const, label: 'Miles (mi)' },
];
const FUEL_UNITS = [
  { key: 'liters' as const, label: 'Liters (L)' },
  { key: 'gallons' as const, label: 'Gallons (gal)' },
];

export default function MoreScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    vehicles, activeVehicle, vehicleDocuments,
    vehicleSoloSessions, vehicleMaintenance, deleteVehicle,
  } = useData();
  const { user, signOut } = useAuth();
  const { themeMode, setThemeMode, isDark } = useTheme();
  const { settings, updateSettings, currencySymbol, distanceLabel, volumeLabel } = useSettings();

  const [showUnits, setShowUnits] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [trackingOn, setTrackingOn] = useState(false);

  useEffect(() => {
    getScheduledCount().then(setScheduledCount).catch(() => {});
    isTrackingActive().then(setTrackingOn).catch(() => {});
  }, []);

  const handleDeleteVehicle = (id: string, name: string) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete "${name}"? All associated data will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteVehicle(id) },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ],
    );
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
        return;
      }
      updateSettings({ notifications: true });
      // Schedule reminders for current vehicle
      if (activeVehicle && vehicleMaintenance.length > 0) {
        await syncMaintenanceReminders(vehicleMaintenance, activeVehicle);
        const count = await getScheduledCount();
        setScheduledCount(count);
      }
      sendTestNotification();
    } else {
      updateSettings({ notifications: false });
      setScheduledCount(0);
    }
  };

  const themeLabel = themeMode === 'system' ? 'System' : themeMode === 'dark' ? 'Dark' : 'Light';

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
        <Text style={{ color: c.text, fontSize: FontSizes['2xl'], fontWeight: '800' }}>
          More
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info */}
        <GlassCard style={{ marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View
              style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: Brand.primary + '20',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={24} color={Brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>
                {user?.name || 'Driver'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                {user?.email && (
                  <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm }}>
                    {user.email}
                  </Text>
                )}
                {user?.isGuest && (
                  <Badge text="GUEST" color={Brand.warning} />
                )}
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Active Vehicle Card */}
        {activeVehicle && (
          <GlassCard style={{ marginBottom: Spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View
                style={{
                  width: 56, height: 56, borderRadius: 28,
                  backgroundColor: activeVehicle.color,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={activeVehicle.type === 'electric' ? 'flash' : 'car-sport'}
                  size={28}
                  color="#FFF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>
                  {activeVehicle.name}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm }}>
                  {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
                </Text>
                <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
                  {activeVehicle.plate} · {activeVehicle.odometer.toLocaleString()} {distanceLabel}
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Vehicles Section */}
        <SectionHeader
          title="My Vehicles"
          action="+ Add"
          onAction={() => router.push('/modals/add-vehicle')}
        />
        <Card style={{ marginBottom: Spacing.xl }}>
          {vehicles.map((v, i) => (
            <React.Fragment key={v.id}>
              {i > 0 && <Divider />}
              <ListItem
                icon={v.type === 'electric' ? 'flash' : 'car-sport'}
                iconColor={v.color}
                title={v.name}
                subtitle={`${v.year} ${v.make} ${v.model}`}
                value={v.plate}
                onPress={() => handleDeleteVehicle(v.id, v.name)}
              />
            </React.Fragment>
          ))}
          {vehicles.length === 0 && (
            <ListItem
              icon="add-circle"
              title="Add your first vehicle"
              subtitle="Gas, diesel, electric, or hybrid"
              onPress={() => router.push('/modals/add-vehicle')}
            />
          )}
        </Card>

        {/* Pro Features */}
        <SectionHeader title="Pro Features" />
        <Card style={{ marginBottom: Spacing.xl }}>
          <ListItem
            icon="car"
            iconColor={Brand.gig}
            title="Solo Driver Mode"
            subtitle={`Gig worker tracking · ${vehicleSoloSessions.length} sessions`}
            onPress={() => router.push('/modals/solo-driver')}
          />
          <Divider />
          <ListItem
            icon="document-text"
            iconColor={Brand.info}
            title="Documents"
            subtitle={`${vehicleDocuments.length} stored documents`}
            onPress={() => router.push('/modals/documents')}
          />
          <Divider />
          <ListItem
            icon="mic"
            iconColor={Brand.accent}
            title="Voice Logger"
            subtitle="Log fuel, trips, and expenses by voice"
            onPress={() => router.push('/modals/voice-logger')}
          />
          <Divider />
          <ListItem
            icon="analytics"
            iconColor={Brand.primary}
            title="Trip Cost Comparison"
            subtitle="Compare your costs vs. Uber/taxi"
            onPress={() => router.push('/modals/trip-comparison')}
          />
        </Card>

        {/* Settings */}
        <SectionHeader title="Settings" />
        <Card style={{ marginBottom: Spacing.xl }}>
          {/* ── Dark Mode Toggle ── */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              const modes: ThemeMode[] = ['system', 'dark', 'light'];
              const i = modes.indexOf(themeMode);
              setThemeMode(modes[(i + 1) % modes.length]);
            }}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: Spacing.md, gap: Spacing.md,
            }}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: Radius.md,
                backgroundColor: Brand.accent + '15',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons
                name={themeMode === 'system' ? 'phone-portrait' : isDark ? 'moon' : 'sunny'}
                size={20}
                color={Brand.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '500' }}>Appearance</Text>
              <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, marginTop: 1 }}>
                {themeLabel} mode
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {(['system', 'dark', 'light'] as ThemeMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 4,
                    borderRadius: Radius.full,
                    backgroundColor: themeMode === mode ? Brand.accent + '20' : 'transparent',
                    borderWidth: 1,
                    borderColor: themeMode === mode ? Brand.accent : c.border,
                  }}
                >
                  <Text
                    style={{
                      color: themeMode === mode ? Brand.accent : c.textTertiary,
                      fontSize: FontSizes.xs, fontWeight: '600',
                    }}
                  >
                    {mode === 'system' ? '⚙️' : mode === 'dark' ? '🌙' : '☀️'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>

          <Divider />

          {/* ── Units & Currency ── */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowUnits(!showUnits)}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: Spacing.md, gap: Spacing.md,
            }}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: Radius.md,
                backgroundColor: Brand.info + '15',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="globe" size={20} color={Brand.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '500' }}>
                Units & Currency
              </Text>
              <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, marginTop: 1 }}>
                {currencySymbol} · {distanceLabel} · {volumeLabel}
              </Text>
            </View>
            <Ionicons
              name={showUnits ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={c.textTertiary}
            />
          </TouchableOpacity>

          {/* Expanded units picker */}
          {showUnits && (
            <View
              style={{
                backgroundColor: c.surfaceElevated,
                borderRadius: Radius.md,
                padding: Spacing.md,
                marginBottom: Spacing.md,
                gap: Spacing.lg,
              }}
            >
              {/* Currency */}
              <View>
                <Text style={{ color: c.textSecondary, fontSize: FontSizes.xs, fontWeight: '600', marginBottom: Spacing.sm }}>
                  CURRENCY
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {CURRENCIES.map((cur) => (
                    <TouchableOpacity
                      key={cur}
                      onPress={() => updateSettings({ currency: cur })}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 6,
                        borderRadius: Radius.full,
                        backgroundColor: settings.currency === cur ? Brand.info + '20' : 'transparent',
                        borderWidth: 1,
                        borderColor: settings.currency === cur ? Brand.info : c.border,
                      }}
                    >
                      <Text
                        style={{
                          color: settings.currency === cur ? Brand.info : c.textSecondary,
                          fontSize: FontSizes.xs, fontWeight: '600',
                        }}
                      >
                        {CURRENCY_SYMBOLS[cur]} {cur}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Distance */}
              <View>
                <Text style={{ color: c.textSecondary, fontSize: FontSizes.xs, fontWeight: '600', marginBottom: Spacing.sm }}>
                  DISTANCE
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {DISTANCE_UNITS.map((u) => (
                    <TouchableOpacity
                      key={u.key}
                      onPress={() => updateSettings({ distanceUnit: u.key })}
                      style={{
                        flex: 1, paddingVertical: 10,
                        borderRadius: Radius.md, alignItems: 'center',
                        backgroundColor: settings.distanceUnit === u.key ? Brand.info + '20' : 'transparent',
                        borderWidth: 1,
                        borderColor: settings.distanceUnit === u.key ? Brand.info : c.border,
                      }}
                    >
                      <Text
                        style={{
                          color: settings.distanceUnit === u.key ? Brand.info : c.textSecondary,
                          fontSize: FontSizes.sm, fontWeight: '600',
                        }}
                      >
                        {u.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fuel */}
              <View>
                <Text style={{ color: c.textSecondary, fontSize: FontSizes.xs, fontWeight: '600', marginBottom: Spacing.sm }}>
                  FUEL VOLUME
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {FUEL_UNITS.map((u) => (
                    <TouchableOpacity
                      key={u.key}
                      onPress={() => updateSettings({ fuelUnit: u.key })}
                      style={{
                        flex: 1, paddingVertical: 10,
                        borderRadius: Radius.md, alignItems: 'center',
                        backgroundColor: settings.fuelUnit === u.key ? Brand.info + '20' : 'transparent',
                        borderWidth: 1,
                        borderColor: settings.fuelUnit === u.key ? Brand.info : c.border,
                      }}
                    >
                      <Text
                        style={{
                          color: settings.fuelUnit === u.key ? Brand.info : c.textSecondary,
                          fontSize: FontSizes.sm, fontWeight: '600',
                        }}
                      >
                        {u.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          <Divider />

          {/* ── Notifications ── */}
          <View
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: Spacing.md, gap: Spacing.md,
            }}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: Radius.md,
                backgroundColor: Brand.warning + '15',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="notifications" size={20} color={Brand.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '500' }}>
                Notifications
              </Text>
              <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, marginTop: 1 }}>
                {settings.notifications
                  ? `Enabled · ${scheduledCount} scheduled`
                  : 'Disabled'}
              </Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: c.border, true: Brand.primary + '50' }}
              thumbColor={settings.notifications ? Brand.primary : c.textTertiary}
            />
          </View>

          <Divider />

          {/* ── Drive Tracking ── */}
          <View
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: Spacing.md, gap: Spacing.md,
            }}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: Radius.md,
                backgroundColor: Brand.primary + '15',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="navigate" size={20} color={Brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '500' }}>
                Drive Tracking
              </Text>
              <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, marginTop: 1 }}>
                {trackingOn
                  ? 'Active — recording trips in background'
                  : 'Off — enable to auto-detect drives'}
              </Text>
            </View>
            <Switch
              value={trackingOn}
              onValueChange={async (enabled) => {
                try {
                  if (enabled) {
                    await startDrivingDetection();
                    setTrackingOn(true);
                  } else {
                    await stopDrivingDetection();
                    setTrackingOn(false);
                  }
                } catch (e: any) {
                  Alert.alert('Tracker Failed', e.message || 'Unknown error');
                }
              }}
              trackColor={{ false: c.border, true: Brand.primary + '50' }}
              thumbColor={trackingOn ? Brand.primary : c.textTertiary}
            />
          </View>
        </Card>

        {/* Account */}
        <SectionHeader title="Account" />
        <Card style={{ marginBottom: Spacing.xl }}>
          {user?.isGuest && (
            <>
              <ListItem
                icon="person-add"
                iconColor={Brand.primary}
                title="Create Account"
                subtitle="Save your data to the cloud"
                onPress={() => {
                  Alert.alert(
                    'Create Account',
                    'You will be signed out of your guest session so you can sign up. Proceed?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Yes, Sign Up', onPress: () => signOut() },
                    ]
                  );
                }}
              />
              <Divider />
            </>
          )}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSignOut}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: Spacing.md, gap: Spacing.md,
            }}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: Radius.md,
                backgroundColor: Brand.danger + '15',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="log-out" size={20} color={Brand.danger} />
            </View>
            <Text style={{ color: Brand.danger, fontSize: FontSizes.md, fontWeight: '500' }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </Card>

        {/* About */}
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          <View
            style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: Brand.primary + '15',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: Spacing.sm,
            }}
          >
            <Ionicons name="car-sport" size={24} color={Brand.primary} />
          </View>
          <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>
            Vehiclo
          </Text>
          <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm }}>
            AI-Powered Vehicle Manager
          </Text>
          <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs, marginTop: 2 }}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
