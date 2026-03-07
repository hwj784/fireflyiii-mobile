import React, { useState, useMemo } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, getStartOfMonth, getEndOfMonth } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const PERIODS = [
  { label: 'This Month', getRange: () => ({ start: getStartOfMonth(), end: getEndOfMonth() }) },
  { label: 'Last Month', getRange: () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    return { start, end };
  }},
  { label: 'This Year', getRange: () => {
    const y = new Date().getFullYear();
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }},
];

export default function ReportsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [periodIdx, setPeriodIdx] = useState(0);
  const { start, end } = PERIODS[periodIdx].getRange();

  const summaryQuery = useQuery({
    queryKey: ['summary', start, end],
    queryFn: () => api.getSummary(start, end),
  });

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.getBudgets(1),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(1),
  });

  const summary = summaryQuery.data || {};
  const isLoading = summaryQuery.isLoading;

  // Parse summary into income/expense pairs
  const summaryEntries = useMemo(() => {
    const entries: { key: string; label: string; value: number; symbol: string; color: string }[] = [];
    Object.entries(summary).forEach(([key, val]: [string, any]) => {
      if (key.startsWith('spent-in-budgets-')) {
        entries.push({ key, label: 'Budget Spending', value: Math.abs(val.value_parsed || 0), symbol: val.currency_symbol, color: colors.error });
      } else if (key.startsWith('earned-in-')) {
        entries.push({ key, label: 'Income', value: val.value_parsed || 0, symbol: val.currency_symbol, color: colors.success });
      } else if (key.startsWith('balance-in-')) {
        entries.push({ key, label: 'Net Worth', value: val.value_parsed || 0, symbol: val.currency_symbol, color: colors.primary });
      } else if (key.startsWith('bills-unpaid-')) {
        entries.push({ key, label: 'Bills Unpaid', value: Math.abs(val.value_parsed || 0), symbol: val.currency_symbol, color: colors.warning });
      } else if (key.startsWith('bills-paid-')) {
        entries.push({ key, label: 'Bills Paid', value: Math.abs(val.value_parsed || 0), symbol: val.currency_symbol, color: colors.success });
      } else if (key.startsWith('left-to-spend-')) {
        entries.push({ key, label: 'Left to Spend', value: val.value_parsed || 0, symbol: val.currency_symbol, color: colors.primary });
      }
    });
    return entries;
  }, [summary, colors]);

  const screenWidth = Dimensions.get('window').width;

  // Simple bar chart for budget spending
  const budgets = budgetsQuery.data?.data || [];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={summaryQuery.isRefetching} onRefresh={() => { summaryQuery.refetch(); budgetsQuery.refetch(); categoriesQuery.refetch(); }} tintColor={colors.primary} />}>
        <View className="px-4 pt-2">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-3"><MaterialIcons name="arrow-back" size={24} color={colors.foreground} /></TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground flex-1">Reports</Text>
          </View>

          {/* Period Selector */}
          <View className="flex-row gap-2 mb-5">
            {PERIODS.map((p, i) => (
              <TouchableOpacity key={i} className={`px-3 py-1.5 rounded-full ${periodIdx === i ? 'bg-primary' : 'bg-surface border border-border'}`} onPress={() => setPeriodIdx(i)}>
                <Text className={`text-xs font-medium ${periodIdx === i ? 'text-white' : 'text-muted'}`}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Summary Cards */}
              <View className="flex-row flex-wrap gap-3 mb-5">
                {summaryEntries.map((entry) => (
                  <View key={entry.key} className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border">
                    <Text className="text-xs text-muted mb-1">{entry.label}</Text>
                    <Text className="text-lg font-bold" style={{ color: entry.color }} numberOfLines={1}>
                      {formatCurrency(entry.value, entry.symbol)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Budget Overview */}
              {budgets.length > 0 ? (
                <View className="mb-5">
                  <Text className="text-lg font-semibold text-foreground mb-3">Budget Overview</Text>
                  {budgets.map((b: any) => {
                    const bAttr = b.attributes;
                    const spent = bAttr.spent ? bAttr.spent.reduce((sum: number, s: any) => sum + Math.abs(parseFloat(s.amount || '0')), 0) : 0;
                    return (
                      <View key={b.id} className="bg-surface rounded-xl p-3 border border-border mb-2">
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-sm font-medium text-foreground">{bAttr.name}</Text>
                          <Text className="text-sm text-muted">{formatCurrency(spent, bAttr.currency_symbol || '')}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {/* Category Breakdown */}
              {(categoriesQuery.data?.data || []).length > 0 ? (
                <View className="mb-5">
                  <Text className="text-lg font-semibold text-foreground mb-3">Categories</Text>
                  {(categoriesQuery.data?.data || []).slice(0, 10).map((c: any) => {
                    const cAttr = c.attributes;
                    const spent = cAttr.spent ? cAttr.spent.reduce((sum: number, s: any) => sum + Math.abs(parseFloat(s.sum || '0')), 0) : 0;
                    const earned = cAttr.earned ? cAttr.earned.reduce((sum: number, e: any) => sum + parseFloat(e.sum || '0'), 0) : 0;
                    return (
                      <TouchableOpacity key={c.id} className="bg-surface rounded-xl p-3 border border-border mb-2 flex-row items-center"
                        onPress={() => router.push(`/details/category/${c.id}` as any)}>
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-foreground">{cAttr.name}</Text>
                        </View>
                        {spent > 0 ? <Text className="text-sm text-error mr-3">-{formatCurrency(spent, '')}</Text> : null}
                        {earned > 0 ? <Text className="text-sm text-success">+{formatCurrency(earned, '')}</Text> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
