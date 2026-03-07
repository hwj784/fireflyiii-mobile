import React, { useState, useMemo } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, getStartOfMonth, getEndOfMonth } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenNavBar } from '@/components/ui/styled-list-screen';

const PERIODS = [
  { label: 'This Month', getRange: () => ({ start: getStartOfMonth(), end: getEndOfMonth() }) },
  { label: 'Last Month', getRange: () => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    return { start, end };
  }},
  { label: 'This Year', getRange: () => {
    const y = new Date().getFullYear();
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }},
];

const CARD_ICONS: Record<string, string> = {
  'Income': 'trending-up',
  'Budget Spending': 'trending-down',
  'Net Worth': 'account-balance-wallet',
  'Bills Unpaid': 'schedule',
  'Bills Paid': 'check-circle',
  'Left to Spend': 'savings',
};

export default function ReportsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [periodIdx, setPeriodIdx] = useState(0);
  const { start, end } = PERIODS[periodIdx].getRange();

  const summaryQuery = useQuery({ queryKey: ['summary', start, end], queryFn: () => api.getSummary(start, end) });
  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: () => api.getBudgets(1) });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: () => api.getCategories(1) });

  const summary = summaryQuery.data || {};
  const isLoading = summaryQuery.isLoading;

  const summaryEntries = useMemo(() => {
    const entries: { key: string; label: string; value: number; symbol: string; color: string }[] = [];
    Object.entries(summary).forEach(([key, val]: [string, any]) => {
      if (key.startsWith('spent-in-budgets-')) entries.push({ key, label: 'Budget Spending', value: Math.abs(val.value_parsed || 0), symbol: val.currency_symbol, color: colors.error });
      else if (key.startsWith('earned-in-')) entries.push({ key, label: 'Income', value: val.value_parsed || 0, symbol: val.currency_symbol, color: colors.success });
      else if (key.startsWith('balance-in-')) entries.push({ key, label: 'Net Worth', value: val.value_parsed || 0, symbol: val.currency_symbol, color: colors.primary });
      else if (key.startsWith('bills-unpaid-')) entries.push({ key, label: 'Bills Unpaid', value: Math.abs(val.value_parsed || 0), symbol: val.currency_symbol, color: colors.warning });
      else if (key.startsWith('bills-paid-')) entries.push({ key, label: 'Bills Paid', value: Math.abs(val.value_parsed || 0), symbol: val.currency_symbol, color: colors.success });
      else if (key.startsWith('left-to-spend-')) entries.push({ key, label: 'Left to Spend', value: val.value_parsed || 0, symbol: val.currency_symbol, color: colors.primary });
    });
    return entries;
  }, [summary, colors]);

  const budgets = budgetsQuery.data?.data || [];
  const categories = categoriesQuery.data?.data || [];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={summaryQuery.isRefetching} onRefresh={() => { summaryQuery.refetch(); budgetsQuery.refetch(); categoriesQuery.refetch(); }} tintColor={colors.primary} />}>

        <ScreenNavBar title="Reports" />

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.periodBtn, periodIdx === i ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => setPeriodIdx(i)}
            >
              <Text style={[styles.periodText, { color: periodIdx === i ? '#FFFFFF' : colors.muted }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              {summaryEntries.map((entry) => (
                <View key={entry.key} style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.summaryIconBg, { backgroundColor: entry.color + '14' }]}>
                    <MaterialIcons name={(CARD_ICONS[entry.label] || 'info') as any} size={18} color={entry.color} />
                  </View>
                  <Text style={[styles.summaryLabel, { color: colors.muted }]}>{entry.label}</Text>
                  <Text style={[styles.summaryValue, { color: entry.color }]} numberOfLines={1}>
                    {formatCurrency(entry.value, entry.symbol)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Budget Overview */}
            {budgets.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Budget Overview</Text>
                {budgets.map((b: any) => {
                  const bAttr = b.attributes;
                  const spent = bAttr.spent ? bAttr.spent.reduce((sum: number, s: any) => sum + Math.abs(parseFloat(s.amount || '0')), 0) : 0;
                  const limit = bAttr.auto_budget_amount ? parseFloat(bAttr.auto_budget_amount) : 0;
                  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                  const barColor = pct >= 90 ? colors.error : pct >= 60 ? colors.warning : colors.success;

                  return (
                    <View key={b.id} style={[styles.budgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.budgetHeader}>
                        <Text style={[styles.budgetName, { color: colors.foreground }]}>{bAttr.name}</Text>
                        <Text style={[styles.budgetAmount, { color: barColor }]}>
                          {formatCurrency(spent, bAttr.currency_symbol || '')}
                          {limit > 0 ? ` / ${formatCurrency(limit, bAttr.currency_symbol || '')}` : ''}
                        </Text>
                      </View>
                      {limit > 0 ? (
                        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Category Breakdown */}
            {categories.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Categories</Text>
                {categories.slice(0, 10).map((c: any) => {
                  const cAttr = c.attributes;
                  const spent = cAttr.spent ? cAttr.spent.reduce((sum: number, s: any) => sum + Math.abs(parseFloat(s.sum || '0')), 0) : 0;
                  const earned = cAttr.earned ? cAttr.earned.reduce((sum: number, e: any) => sum + parseFloat(e.sum || '0'), 0) : 0;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => router.push(`/details/category/${c.id}` as any)}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.catIcon, { backgroundColor: '#8B5CF6' + '14' }]}>
                        <MaterialIcons name="category" size={16} color="#8B5CF6" />
                      </View>
                      <Text style={[styles.catName, { color: colors.foreground }]} numberOfLines={1}>{cAttr.name}</Text>
                      {spent > 0 ? <Text style={[styles.catAmount, { color: colors.error }]}>-{formatCurrency(spent, '')}</Text> : null}
                      {earned > 0 ? <Text style={[styles.catAmount, { color: colors.success }]}>+{formatCurrency(earned, '')}</Text> : null}
                      <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 20 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  periodText: { fontSize: 13, fontWeight: '600' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 24 },
  summaryCard: { width: '47%', flexGrow: 1, borderRadius: 18, borderWidth: 1, padding: 16 },
  summaryIconBg: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, letterSpacing: -0.3 },
  budgetCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetName: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 },
  budgetAmount: { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  categoryCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 6 },
  catIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  catName: { flex: 1, fontSize: 14, fontWeight: '500' },
  catAmount: { fontSize: 13, fontWeight: '700', marginHorizontal: 6 },
});
