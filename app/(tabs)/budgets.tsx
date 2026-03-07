import React, { useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, getStartOfMonth, getEndOfMonth } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function BudgetsScreen() {
  const colors = useColors();
  const router = useRouter();
  const start = getStartOfMonth();
  const end = getEndOfMonth();

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.getBudgets(1),
  });

  const limitsQuery = useQuery({
    queryKey: ['budget-limits', start, end],
    queryFn: () => api.get<any>('/v1/budget-limits', { start, end }),
  });

  const budgets = budgetsQuery.data?.data || [];
  const limits = limitsQuery.data?.data || [];

  const onRefresh = useCallback(() => { budgetsQuery.refetch(); limitsQuery.refetch(); }, []);

  const getBudgetLimit = (budgetId: string) => {
    return limits.find((l: any) => l.attributes?.budget_id === budgetId);
  };

  const monthName = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const renderBudget = ({ item }: { item: any }) => {
    const attr = item.attributes;
    const limit = getBudgetLimit(item.id);
    const limitAmount = limit ? parseFloat(limit.attributes?.amount || '0') : 0;
    const spent = limit ? Math.abs(parseFloat(limit.attributes?.spent || '0')) : 0;
    const percentage = limitAmount > 0 ? Math.min((spent / limitAmount) * 100, 100) : 0;
    const isOverBudget = spent > limitAmount && limitAmount > 0;
    const remaining = Math.max(limitAmount - spent, 0);
    const currencySymbol = limit?.attributes?.currency_symbol || attr.currency_symbol || '';

    const barColor = isOverBudget ? colors.error : percentage > 80 ? colors.warning : colors.success;

    return (
      <TouchableOpacity
        style={[styles.budgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/details/budget/${item.id}` as any)}
        activeOpacity={0.6}
      >
        {/* Header row */}
        <View style={styles.budgetHeader}>
          <View style={[styles.budgetIconBg, { backgroundColor: barColor + '14' }]}>
            <MaterialIcons name="pie-chart" size={18} color={barColor} />
          </View>
          <View style={styles.budgetTitleCol}>
            <Text style={[styles.budgetName, { color: colors.foreground }]} numberOfLines={1}>{attr.name}</Text>
            {limitAmount > 0 ? (
              <Text style={[styles.budgetMeta, { color: colors.muted }]}>
                {formatCurrency(spent, currencySymbol)} of {formatCurrency(limitAmount, currencySymbol)}
              </Text>
            ) : (
              <Text style={[styles.budgetMeta, { color: colors.muted }]}>No limit set</Text>
            )}
          </View>
          {limitAmount > 0 ? (
            <View style={[styles.percentBadge, { backgroundColor: barColor + '14' }]}>
              <Text style={[styles.percentText, { color: barColor }]}>{percentage.toFixed(0)}%</Text>
            </View>
          ) : null}
        </View>

        {/* Progress bar */}
        {limitAmount > 0 ? (
          <View style={styles.progressSection}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }]}
              />
            </View>
            <View style={styles.progressLabels}>
              <View style={styles.progressLabelItem}>
                <View style={[styles.dot, { backgroundColor: barColor }]} />
                <Text style={[styles.progressLabelText, { color: colors.muted }]}>Spent</Text>
              </View>
              {!isOverBudget ? (
                <Text style={[styles.remainingText, { color: colors.success }]}>
                  {formatCurrency(remaining, currencySymbol)} left
                </Text>
              ) : (
                <Text style={[styles.remainingText, { color: colors.error }]}>
                  {formatCurrency(spent - limitAmount, currencySymbol)} over
                </Text>
              )}
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={renderBudget}
        ListHeaderComponent={
          <View>
            <View style={styles.titleRow}>
              <View>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>Budgets</Text>
                <Text style={[styles.pageSubtitle, { color: colors.muted }]}>{monthName}</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          budgetsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="pie-chart" size={48} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.muted }]}>No budgets set up</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Create budgets to track your spending</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={budgetsQuery.isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modals/budget-form' as any)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  budgetCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  budgetTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  budgetName: {
    fontSize: 15,
    fontWeight: '600',
  },
  budgetMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  percentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressSection: {
    marginTop: 14,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressLabelText: {
    fontSize: 11,
    fontWeight: '500',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
});
