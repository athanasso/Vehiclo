/**
 * More tab — Vehicles, documents, settings with dark mode toggle, about, sign out.
 */
import React from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
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

export default function MoreScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    vehicles, activeVehicle, vehicleDocuments,
    vehicleSoloSessions, deleteVehicle,
  } = useData();
  const { user, signOut } = useAuth();
  const { themeMode, setThemeMode, isDark } = useTheme();

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

  const handleThemeChange = () => {
    const modes: ThemeMode[] = ['system', 'dark', 'light'];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);
  };

  const themeLabel = themeMode === 'system' ? 'System' : themeMode === 'dark' ? 'Dark' : 'Light';
  const themeIcon = themeMode === 'system' ? 'phone-portrait' : isDark ? 'moon' : 'sunny';

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
                  {activeVehicle.plate} · {activeVehicle.odometer.toLocaleString()} km
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
          {/* Dark Mode Toggle */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleThemeChange}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: Spacing.md,
              gap: Spacing.md,
            }}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: Radius.md,
                backgroundColor: Brand.accent + '15',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name={themeIcon as any} size={20} color={Brand.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '500' }}>
                Appearance
              </Text>
              <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, marginTop: 1 }}>
                {themeLabel} mode
              </Text>
            </View>
            {/* Theme pills */}
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {(['system', 'dark', 'light'] as ThemeMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: Radius.full,
                    backgroundColor: themeMode === mode ? Brand.accent + '20' : 'transparent',
                    borderWidth: 1,
                    borderColor: themeMode === mode ? Brand.accent : c.border,
                  }}
                >
                  <Text
                    style={{
                      color: themeMode === mode ? Brand.accent : c.textTertiary,
                      fontSize: FontSizes.xs,
                      fontWeight: '600',
                    }}
                  >
                    {mode === 'system' ? '⚙️' : mode === 'dark' ? '🌙' : '☀️'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
          <Divider />
          <ListItem
            icon="globe"
            iconColor={Brand.info}
            title="Units & Currency"
            subtitle="EUR · Kilometers · Liters"
          />
          <Divider />
          <ListItem
            icon="notifications"
            iconColor={Brand.warning}
            title="Notifications"
            subtitle="Maintenance reminders"
          />
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
                  // TODO: Navigate to sign up flow
                  Alert.alert('Coming Soon', 'Account creation will be available with Supabase integration.');
                }}
              />
              <Divider />
            </>
          )}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSignOut}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: Spacing.md,
              gap: Spacing.md,
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
