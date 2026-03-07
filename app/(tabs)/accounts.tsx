import React, { useState, useCallback, useMemo } from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, getAccountTypeLabel, getAccountIcon } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ACCOUNT_TYPES = ['asset', 'expense', 'revenue', 'liabilities'];
const TYPE_ICONS: Record<string, string> = {
  asset: 'account-balance',
  expense: 'shopping-cart',
  revenue: 'trending-up',
  liabilities: 'money-off',
};

export default function AccountsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeType, setActiveType] = useState('asset');

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeType],
    queryFn: () => api.getAccounts(1, activeType),
  });

  const accounts = accountsQuery.data?.data || [];

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum: number, a: any) => sum + parseFloat(a.attributes.current_balance || '0'), 0);
  }, [accounts]);

  const firstCurrencySymbol = accounts[0]?.attributes?.currency_symbol || '';

  const onRefresh = useCallback(() => { accountsQuery.refetch(); }, []);

  const renderAccount = ({ item, index }: { item: any; index: number }) => {
    const attr = item.attributes;
    const iconName = getAccountIcon(attr.type, attr.account_role) as any;
    const balance = parseFloat(attr.current_balance || '0');
    const balanceColor = balance >= 0 ? colors.foreground : colors.error;

    return (
      <TouchableOpacity
        style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/details/account/${item.id}` as any)}
        activeOpacity={0.6}
      >
        <View style={[styles.accountIconBg, { backgroundColor: colors.primary + '12' }]}>
          <MaterialIcons name={iconName} size={20} color={colors.primary} />
        </View>
        <View style={styles.accountInfo}>
          <Text style={[styles.accountName, { color: colors.foreground }]} numberOfLines={1}>{attr.name}</Text>
          <Text style={[styles.accountMeta, { color: colors.muted }]} numberOfLines={1}>
            {attr.iban || attr.account_number || (attr.account_role || attr.type || '').replace(/([A-Z])/g, ' $1').replace(/-/g, ' ').trim()}
          </Text>
        </View>
        <View style={styles.accountBalanceCol}>
          <Text style={[styles.accountBalance, { color: balanceColor }]}>
            {formatCurrency(attr.current_balance, attr.currency_symbol)}
          </Text>
          {attr.active === false ? (
            <View style={[styles.inactiveBadge, { backgroundColor: colors.muted + '20' }]}>
              <Text style={[styles.inactiveBadgeText, { color: colors.muted }]}>Inactive</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={renderAccount}
        ListHeaderComponent={
          <View>
            {/* Page Title */}
            <View style={styles.titleRow}>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>Accounts</Text>
            </View>

            {/* Type Filter Chips */}
            <View style={styles.chipRow}>
              {ACCOUNT_TYPES.map((type) => {
                const isActive = activeType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive ? colors.primary : colors.surface,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setActiveType(type)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={(TYPE_ICONS[type] || 'account-balance') as any}
                      size={14}
                      color={isActive ? '#FFFFFF' : colors.muted}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : colors.muted }]}>
                      {getAccountTypeLabel(type).replace(' Accounts', '').replace('ies', 'y')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Total Balance Banner */}
            {accounts.length > 0 ? (
              <View style={[styles.totalBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.muted }]}>
                  Total {getAccountTypeLabel(activeType).replace(' Accounts', '')} Balance
                </Text>
                <Text style={[styles.totalAmount, { color: totalBalance >= 0 ? colors.foreground : colors.error }]}>
                  {formatCurrency(totalBalance, firstCurrencySymbol)}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          accountsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name={(TYPE_ICONS[activeType] || 'account-balance') as any} size={48} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.muted }]}>No {getAccountTypeLabel(activeType).toLowerCase()}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Tap + to create one</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={accountsQuery.isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modals/account-form' as any)}
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
    paddingBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalBanner: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  accountIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  accountInfo: {
    flex: 1,
    marginRight: 8,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
  },
  accountMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  accountBalanceCol: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '700',
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  inactiveBadgeText: {
    fontSize: 10,
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
