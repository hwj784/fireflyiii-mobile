import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenNavBar, EmptyState } from '@/components/ui/styled-list-screen';

export default function RecurringScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['recurring'], queryFn: () => api.getRecurringTransactions(1) });
  const recurring = query.data?.data || [];

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Recurring', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deleteRecurringTransaction(id); queryClient.invalidateQueries({ queryKey: ['recurring'] }); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  return (
    <ScreenContainer>
      <FlatList
        data={recurring}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ScreenNavBar title="Recurring Transactions" />}
        renderItem={({ item }) => {
          const attr = item.attributes;
          const tx = attr.transactions?.[0];
          const isActive = attr.active !== false;

          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.headerRow}>
                <View style={[styles.iconBg, { backgroundColor: '#14B8A6' + '14' }]}>
                  <MaterialIcons name="event-repeat" size={20} color="#14B8A6" />
                </View>
                <View style={styles.titleCol}>
                  <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{attr.title}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.statusBadge, { backgroundColor: (isActive ? colors.success : colors.muted) + '18' }]}>
                      <View style={[styles.statusDot, { backgroundColor: isActive ? colors.success : colors.muted }]} />
                      <Text style={[styles.statusText, { color: isActive ? colors.success : colors.muted }]}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                    <Text style={[styles.freqText, { color: colors.muted }]}>
                      {(attr.repeat_freq || '').charAt(0).toUpperCase() + (attr.repeat_freq || '').slice(1)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, attr.title)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>

              {tx ? (
                <View style={[styles.txSection, { borderTopColor: colors.border }]}>
                  <Text style={[styles.txDesc, { color: colors.foreground }]}>{tx.description}</Text>
                  <View style={styles.txMetaRow}>
                    <Text style={[styles.txAmount, { color: colors.primary }]}>
                      {formatCurrency(tx.amount, tx.currency_symbol)}
                    </Text>
                    <Text style={[styles.txFlow, { color: colors.muted }]}>
                      {tx.source_name} → {tx.destination_name}
                    </Text>
                  </View>
                </View>
              ) : null}

              {(attr.first_date || attr.latest_date) ? (
                <View style={[styles.datesRow, { borderTopColor: colors.border }]}>
                  {attr.first_date ? (
                    <View style={styles.dateItem}>
                      <Text style={[styles.dateLabel, { color: colors.muted }]}>First</Text>
                      <Text style={[styles.dateValue, { color: colors.foreground }]}>{formatDate(attr.first_date)}</Text>
                    </View>
                  ) : null}
                  {attr.latest_date ? (
                    <View style={[styles.dateItem, { alignItems: 'flex-end' }]}>
                      <Text style={[styles.dateLabel, { color: colors.muted }]}>Latest</Text>
                      <Text style={[styles.dateValue, { color: colors.foreground }]}>{formatDate(attr.latest_date)}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
          <EmptyState icon="event-repeat" title="No recurring transactions" subtitle="Set up automatic transactions" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 10, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  iconBg: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  titleCol: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600' },
  freqText: { fontSize: 11 },
  actionBtn: { padding: 4 },
  txSection: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12 },
  txDesc: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  txMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txFlow: { fontSize: 12, flex: 1 },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10 },
  dateItem: {},
  dateLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontSize: 13, fontWeight: '500', marginTop: 1 },
});
