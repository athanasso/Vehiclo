/**
 * Expenses tab — Category breakdown, expense list, totals.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius, ExpenseCategories } from '@/constants/theme';
import {
  useThemeColors, Card, GlassCard, EmptyState, SectionHeader,
  Badge,
} from '@/components/ui';
import { MiniBarChart } from '@/components/MiniBarChart';
import { useData } from '@/contexts/DataContext';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function ExpensesScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { vehicleExpenses, vehicleFuelLogs, vehicleMaintenance, deleteExpense } = useData();
  const [filter, setFilter] = useState<string | null>(null);

  // Combine all costs
  const allExpenses = useMemo(() => {
    const fuelExpenses = vehicleFuelLogs.map((l) => ({
      id: l.id,
      date: l.date,
      category: 'fuel' as const,
      amount: l.totalCost,
      description: `${l.liters.toFixed(1)}L at ${l.station || 'station'}`,
      source: 'fuel' as const,
    }));
    const maintExpenses = vehicleMaintenance.map((m) => ({
      id: m.id,
      date: m.date,
      category: 'maintenance' as const,
      amount: m.cost,
      description: m.description,
      source: 'maintenance' as const,
    }));
    const otherExpenses = vehicleExpenses.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      amount: e.amount,
      description: e.description,
      source: 'expense' as const,
    }));

    return [...fuelExpenses, ...maintExpenses, ...otherExpenses]
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [vehicleFuelLogs, vehicleMaintenance, vehicleExpenses]);

  const totalAmount = useMemo(() => allExpenses.reduce((s, e) => s + e.amount, 0), [allExpenses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    allExpenses.forEach((e) => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    });
    return Object.entries(cats)
      .map(([key, amount]) => ({
        key,
        amount,
        info: ExpenseCategories.find((c) => c.key === key),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [allExpenses]);

  // Filtered list
  const filteredExpenses = filter
    ? allExpenses.filter((e) => e.category === filter)
    : allExpenses;

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    allExpenses.forEach(({ date, amount }) => {
      const key = date.slice(0, 7);
      months[key] = (months[key] || 0) + amount;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, value]) => ({
        label: new Date(month + '-01').toLocaleDateString('en', { month: 'short' }),
        value,
        color: Brand.primary,
      }));
  }, [allExpenses]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
        <Text style={{ color: c.text, fontSize: FontSizes['2xl'], fontWeight: '800' }}>
          Expenses
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Banner */}
        <GlassCard style={{ marginBottom: Spacing.lg, alignItems: 'center' }}>
          <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm, fontWeight: '600' }}>
            TOTAL EXPENSES
          </Text>
          <Text style={{ color: c.text, fontSize: FontSizes['4xl'], fontWeight: '800', marginTop: Spacing.xs }}>
            {formatCurrency(totalAmount)}
          </Text>
          <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, marginTop: 2 }}>
            {allExpenses.length} transactions
          </Text>
        </GlassCard>

        {/* Monthly Chart */}
        {monthlyData.length > 0 && (
          <View style={{ marginBottom: Spacing.xl }}>
            <SectionHeader title="Monthly Trend" />
            <Card>
              <MiniBarChart data={monthlyData} height={100} />
            </Card>
          </View>
        )}

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <View style={{ marginBottom: Spacing.xl }}>
            <SectionHeader title="By Category" />
            <Card>
              {categoryBreakdown.map(({ key, amount, info }, i) => {
                const pct = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.7}
                    onPress={() => setFilter(filter === key ? null : key)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: Spacing.sm,
                      borderTopWidth: i > 0 ? 1 : 0,
                      borderTopColor: c.divider,
                      gap: Spacing.md,
                    }}
                  >
                    <View
                      style={{
                        width: 32, height: 32, borderRadius: 16,
                        backgroundColor: (info?.color || Brand.primary) + '20',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name={key === 'fuel' ? 'flame' : key === 'maintenance' ? 'construct' : 'receipt'}
                        size={16}
                        color={info?.color || Brand.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: FontSizes.sm, fontWeight: '600' }}>
                        {info?.label || key}
                      </Text>
                      {/* Progress bar */}
                      <View
                        style={{
                          height: 4, backgroundColor: c.border, borderRadius: 2,
                          marginTop: 4, overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            height: '100%', width: `${pct}%`,
                            backgroundColor: info?.color || Brand.primary,
                            borderRadius: 2,
                          }}
                        />
                      </View>
                    </View>
                    <Text style={{ color: c.text, fontSize: FontSizes.sm, fontWeight: '700' }}>
                      {formatCurrency(amount)}
                    </Text>
                    <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs, width: 35, textAlign: 'right' }}>
                      {pct.toFixed(0)}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        )}

        {/* Filter indicator */}
        {filter && (
          <TouchableOpacity
            onPress={() => setFilter(null)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}
          >
            <Badge text={`Filtered: ${filter}`} color={Brand.accent} />
            <Text style={{ color: Brand.danger, fontSize: FontSizes.xs }}>✕ Clear</Text>
          </TouchableOpacity>
        )}

        {/* Expense List */}
        <SectionHeader
          title="All Expenses"
          action="+ Add"
          onAction={() => router.push('/modals/add-expense')}
        />

        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="No Expenses"
            subtitle="Start tracking your vehicle expenses to get a complete financial picture"
            actionLabel="Add Expense"
            onAction={() => router.push('/modals/add-expense')}
          />
        ) : (
          filteredExpenses.slice(0, 20).map((exp) => {
            const info = ExpenseCategories.find((c) => c.key === exp.category);
            return (
              <Card key={`${exp.source}-${exp.id}`} style={{ marginBottom: Spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View
                    style={{
                      width: 40, height: 40, borderRadius: Radius.md,
                      backgroundColor: (info?.color || Brand.primary) + '15',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={
                        exp.category === 'fuel' ? 'flame' :
                        exp.category === 'maintenance' ? 'construct' :
                        'receipt'
                      }
                      size={20}
                      color={info?.color || Brand.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: FontSizes.sm, fontWeight: '600' }}>
                      {exp.description}
                    </Text>
                    <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
                      {formatDate(exp.date)} · {info?.label || exp.category}
                    </Text>
                  </View>
                  <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '700' }}>
                    {formatCurrency(exp.amount)}
                  </Text>
                </View>
                {exp.source === 'expense' && (
                  <TouchableOpacity
                    onPress={() => deleteExpense(exp.id)}
                    style={{ position: 'absolute', top: 8, right: 8, padding: 4 }}
                  >
                    <Ionicons name="trash-outline" size={14} color={c.textTertiary} />
                  </TouchableOpacity>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/modals/add-expense')}
        style={{
          position: 'absolute',
          bottom: 80 + insets.bottom,
          right: Spacing.lg,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: Brand.primary,
          alignItems: 'center', justifyContent: 'center',
          elevation: 8,
          shadowColor: Brand.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>
    </View>
  );
}
