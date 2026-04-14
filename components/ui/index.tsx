/**
 * Reusable UI components for Vehiclo.
 */
import React, { type ReactNode } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  type ViewStyle, type TextStyle, type TextInputProps,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Colors, Radius, Spacing, FontSizes } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

// ── useThemeColors hook ────────────────────────────────────────
export function useThemeColors() {
  const { colorScheme } = useTheme();
  return Colors[colorScheme];
}

// ── Card ───────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  const c = useThemeColors();
  const cardStyle: ViewStyle = {
    backgroundColor: c.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: c.border,
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

// ── GlassCard ──────────────────────────────────────────────────
export function GlassCard({ children, style, onPress }: CardProps) {
  const c = useThemeColors();
  const cardStyle: ViewStyle = {
    backgroundColor: c.surfaceElevated + 'CC',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: c.border + '60',
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

// ── Button ─────────────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  icon, loading, disabled, style,
}: ButtonProps) {
  const c = useThemeColors();

  const bgColors = {
    primary: Brand.primary,
    secondary: c.surfaceElevated,
    outline: 'transparent',
    danger: Brand.danger,
    ghost: 'transparent',
  };

  const textColors = {
    primary: '#000',
    secondary: c.text,
    outline: Brand.primary,
    danger: '#FFF',
    ghost: Brand.primary,
  };

  const heights = { sm: 36, md: 48, lg: 56 };
  const fontSizes = { sm: FontSizes.sm, md: FontSizes.md, lg: FontSizes.lg };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: bgColors[variant],
          height: heights[size],
          borderRadius: Radius.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: Spacing.xl,
          opacity: disabled ? 0.5 : 1,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variant === 'outline' ? Brand.primary : undefined,
          gap: Spacing.sm,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={textColors[variant]} />}
          <Text style={{ color: textColors[variant], fontSize: fontSizes[size], fontWeight: '600' }}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Input ──────────────────────────────────────────────────────
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  suffix?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, icon, suffix, containerStyle, style, ...props }: InputProps) {
  const c = useThemeColors();

  return (
    <View style={[{ marginBottom: Spacing.md }, containerStyle]}>
      {label && (
        <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm, marginBottom: Spacing.xs, fontWeight: '500' }}>
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.inputBg,
          borderRadius: Radius.md,
          borderWidth: error ? 1.5 : 1,
          borderColor: error ? Brand.danger : c.border,
          paddingHorizontal: Spacing.md,
          height: 48,
        }}
      >
        {icon && <Ionicons name={icon} size={18} color={c.textTertiary} style={{ marginRight: Spacing.sm }} />}
        <TextInput
          placeholderTextColor={c.textTertiary}
          style={[
            { flex: 1, color: c.text, fontSize: FontSizes.md },
            style as TextStyle,
          ]}
          {...props}
        />
        {suffix && (
          <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, marginLeft: Spacing.xs }}>
            {suffix}
          </Text>
        )}
      </View>
      {error && (
        <Text style={{ color: Brand.danger, fontSize: FontSizes.xs, marginTop: Spacing.xs }}>{error}</Text>
      )}
    </View>
  );
}

// ── Badge ──────────────────────────────────────────────────────
interface BadgeProps {
  text: string;
  color?: string;
  variant?: 'solid' | 'outline';
}

export function Badge({ text, color = Brand.primary, variant = 'solid' }: BadgeProps) {
  return (
    <View
      style={{
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.full,
        backgroundColor: variant === 'solid' ? color + '20' : 'transparent',
        borderWidth: variant === 'outline' ? 1 : 0,
        borderColor: color,
      }}
    >
      <Text style={{ color, fontSize: FontSizes.xs, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

// ── StatCard ───────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  subtitle?: string;
  onPress?: () => void;
}

export function StatCard({ label, value, icon, color = Brand.primary, subtitle, onPress }: StatCardProps) {
  const c = useThemeColors();
  return (
    <Card style={{ flex: 1 }} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: Radius.sm,
            backgroundColor: color + '15',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={16} color={color} />
        </View>
      </View>
      <Text style={{ color: c.text, fontSize: FontSizes.xl, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: c.textSecondary, fontSize: FontSizes.xs, marginTop: 2 }}>{label}</Text>
      {subtitle && (
        <Text style={{ color: color, fontSize: FontSizes.xs, marginTop: 2 }}>{subtitle}</Text>
      )}
    </Card>
  );
}

// ── QuickAction ────────────────────────────────────────────────
interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
}

export function QuickAction({ icon, label, color = Brand.primary, onPress }: QuickActionProps) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        alignItems: 'center',
        gap: Spacing.xs,
        flex: 1,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: Radius.lg,
          backgroundColor: color + '15',
          borderWidth: 1,
          borderColor: color + '30',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={{ color: c.textSecondary, fontSize: FontSizes.xs, textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── EmptyState ─────────────────────────────────────────────────
interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const c = useThemeColors();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'], gap: Spacing.md }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: Radius['2xl'],
          backgroundColor: Brand.primary + '10',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={36} color={Brand.primary} />
      </View>
      <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '600', textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm, textAlign: 'center', lineHeight: 20 }}>
        {subtitle}
      </Text>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} size="sm" style={{ marginTop: Spacing.sm }} />
      )}
    </View>
  );
}

// ── SectionHeader ──────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
      <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ color: Brand.primary, fontSize: FontSizes.sm, fontWeight: '600' }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── AlertBanner ────────────────────────────────────────────────
interface AlertBannerProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color?: string;
  onPress?: () => void;
}

export function AlertBanner({ icon, text, color = Brand.warning, onPress }: AlertBannerProps) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color + '15',
        borderRadius: Radius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: color + '30',
        gap: Spacing.sm,
      }}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ color: c.text, fontSize: FontSizes.sm, flex: 1 }}>{text}</Text>
      {onPress && <Ionicons name="chevron-forward" size={16} color={c.textTertiary} />}
    </TouchableOpacity>
  );
}

// ── Divider ────────────────────────────────────────────────────
export function Divider() {
  const c = useThemeColors();
  return <View style={{ height: 1, backgroundColor: c.divider, marginVertical: Spacing.md }} />;
}

// ── ListItem ───────────────────────────────────────────────────
interface ListItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  trailing?: ReactNode;
}

export function ListItem({ icon, iconColor, title, subtitle, value, onPress, trailing }: ListItemProps) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.md,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: Radius.md,
          backgroundColor: (iconColor || Brand.primary) + '15',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={iconColor || Brand.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '500' }}>{title}</Text>
        {subtitle && (
          <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, marginTop: 1 }}>{subtitle}</Text>
        )}
      </View>
      {value && <Text style={{ color: c.textSecondary, fontSize: FontSizes.md, fontWeight: '600' }}>{value}</Text>}
      {trailing}
      {onPress && !trailing && <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />}
    </TouchableOpacity>
  );
}
