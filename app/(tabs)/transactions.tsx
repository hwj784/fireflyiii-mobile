import React, { useState, useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate, getTransactionSign } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const TX_TYPES = ['all', 'withdrawal', 'deposit', 'transfer'];
const TX_ICONS: Record<string, string> = {
  withdrawal: 'arrow-downward',
  deposit: 'arrow-upward',
  transfer: 'swap-horiz',
  'opening-balance': 'flag',
  reconciliation: 'check-circle',
};

export default function TransactionsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const txQuery = useQuery({
    queryKey: ['transactions', activeType, page],
    queryFn: () => api.getTransactions(page, { type: activeType }),
  });

  const searchTxQuery = useQuery({
    queryKey: ['search-transactions', searchQuery],
    queryFn: () => api.searchTransactions(searchQuery),
    enabled: searchQuery.length > 2,
  });

  const transactions = searchQuery.length > 2
    ? (searchTxQuery.data?.data || [])
    : (txQuery.data?.data || []);

  const totalPages = txQuery.data?.meta?.pagination?.total_pages || 1;

  const onRefresh = useCallback(() => { setPage(1); txQuery.refetch(); }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'withdrawal': return colors.error;
      case 'deposit': return colors.success;
      case 'transfer': return colors.primary;
      default: return colors.muted;
    }
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const tx = item.attributes?.transactions?.[0];
    if (!tx) return null;
    const typeColor = getTypeColor(tx.type);
    const sign = getTransactionSign(tx.type);
    const iconName = (TX_ICONS[tx.type] || 'receipt') as any;

    return (
      <TouchableOpacity
        style={[styles.txCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/details/transaction/${item.id}` as any)}
        activeOpacity={0.6}
      >
        <View style={[styles.txIconBg, { backgroundColor: typeColor + '14' }]}>
          <MaterialIcons name={iconName} size={18} color={typeColor} />
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txDesc, { color: colors.foreground }]} numberOfLines={1}>{tx.description}</Text>
          <View style={styles.txMetaRow}>
            <Text style={[styles.txMeta, { color: colors.muted }]} numberOfLines={1}>
              {tx.source_name}{tx.source_name && tx.destination_name ? ' → ' : ''}{tx.destination_name}
            </Text>
          </View>
          {tx.category_name ? (
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '10' }]}>
              <MaterialIcons name="category" size={10} color={colors.primary} style={{ marginRight: 3 }} />
              <Text style={[styles.categoryText, { color: colors.primary }]}>{tx.category_name}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.txAmountCol}>
          <Text style={[styles.txAmount, { color: typeColor }]}>
            {sign}{formatCurrency(tx.amount, tx.currency_symbol)}
          </Text>
          <Text style={[styles.txDate, { color: colors.muted }]}>{formatDate(tx.date)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>Transactions</Text>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="search" size={20} color={colors.muted} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search transactions..."
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialIcons name="close" size={18} color={colors.muted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Type Filter */}
            <View style={styles.chipRow}>
              {TX_TYPES.map((type) => {
                const isActive = activeType === type;
                const chipColor = type === 'all' ? colors.primary : getTypeColor(type);
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive ? chipColor : colors.surface,
                        borderColor: isActive ? chipColor : colors.border,
                      },
                    ]}
                    onPress={() => { setActiveType(type); setPage(1); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : colors.muted }]}>
                      {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          txQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={48} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.muted }]}>No transactions found</Text>
            </View>
          )
        }
        ListFooterComponent={
          totalPages > 1 && !searchQuery ? (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                onPress={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                style={[styles.pageBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: page <= 1 ? 0.4 : 1 }]}
              >
                <MaterialIcons name="chevron-left" size={22} color={colors.primary} />
              </TouchableOpacity>
              <View style={[styles.pageIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.pageText, { color: colors.foreground }]}>{page}</Text>
                <Text style={[styles.pageTextMuted, { color: colors.muted }]}> / {totalPages}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                style={[styles.pageBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: page >= totalPages ? 0.4 : 1 }]}
              >
                <MaterialIcons name="chevron-right" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={txQuery.isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modals/transaction-form' as any)}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  txIconBg: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
    marginRight: 8,
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '600',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  txMeta: {
    fontSize: 12,
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 11,
    marginTop: 2,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  pageBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  pageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pageTextMuted: {
    fontSize: 14,
    fontWeight: '400',
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
