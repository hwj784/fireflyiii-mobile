import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenNavBar, EmptyState, FloatingActionButton } from '@/components/ui/styled-list-screen';

export default function BillsScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['bills'], queryFn: () => api.getBills(1) });
  const bills = query.data?.data || [];

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Bill', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deleteBill(id); queryClient.invalidateQueries({ queryKey: ['bills'] }); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  return (
    <ScreenContainer>
      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ScreenNavBar title="Bills" />}
        renderItem={({ item }) => {
          const attr = item.attributes;
          const isPaid = attr.paid_dates && attr.paid_dates.length > 0;
          const statusColor = isPaid ? colors.success : colors.warning;

          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/details/bill/${item.id}` as any)}
              activeOpacity={0.6}
            >
              <View style={styles.headerRow}>
                <View style={[styles.iconBg, { backgroundColor: statusColor + '14' }]}>
                  <MaterialIcons name={isPaid ? 'check-circle' : 'schedule'} size={20} color={statusColor} />
                </View>
                <View style={styles.titleCol}>
                  <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{attr.name}</Text>
                  <Text style={[styles.freq, { color: colors.muted }]}>{(attr.repeat_freq || '').charAt(0).toUpperCase() + (attr.repeat_freq || '').slice(1)}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => router.push(`/modals/bill-form?id=${item.id}` as any)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="edit" size={18} color={colors.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, attr.name)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.detailRow, { borderTopColor: colors.border }]}>
                <View style={styles.amountCol}>
                  <Text style={[styles.amountLabel, { color: colors.muted }]}>Amount Range</Text>
                  <Text style={[styles.amountValue, { color: colors.foreground }]}>
                    {formatCurrency(attr.amount_min, attr.currency_symbol)} – {formatCurrency(attr.amount_max, attr.currency_symbol)}
                  </Text>
                </View>
                {attr.next_expected_match ? (
                  <View style={styles.nextCol}>
                    <Text style={[styles.amountLabel, { color: colors.muted }]}>Next Due</Text>
                    <Text style={[styles.nextDate, { color: statusColor }]}>{formatDate(attr.next_expected_match)}</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
          <EmptyState icon="receipt-long" title="No bills" subtitle="Track your recurring bills" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
      <FloatingActionButton onPress={() => router.push('/modals/bill-form' as any)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 10, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  iconBg: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  titleCol: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '600' },
  freq: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  detailRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12 },
  amountCol: { flex: 1 },
  amountLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  amountValue: { fontSize: 14, fontWeight: '600' },
  nextCol: { alignItems: 'flex-end' },
  nextDate: { fontSize: 14, fontWeight: '600' },
});
