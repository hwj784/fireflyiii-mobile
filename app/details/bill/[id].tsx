import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();

  const billQuery = useQuery({ queryKey: ['bill', id], queryFn: () => api.getBill(id!), enabled: !!id });
  const bill = billQuery.data?.data;
  const attr = bill?.attributes;

  if (billQuery.isLoading) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} size="large" /></ScreenContainer>;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={billQuery.isRefetching} onRefresh={() => billQuery.refetch()} tintColor={colors.primary} />}>
        <View className="px-4 pt-2">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-3"><MaterialIcons name="arrow-back" size={24} color={colors.foreground} /></TouchableOpacity>
            <Text className="text-xl font-bold text-foreground flex-1">{attr?.name}</Text>
            <TouchableOpacity onPress={() => router.push(`/modals/bill-form?id=${id}` as any)}>
              <MaterialIcons name="edit" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View className="bg-surface rounded-2xl p-5 border border-border mb-4">
            <Text className="text-sm text-muted mb-1">Amount Range</Text>
            <Text className="text-2xl font-bold text-foreground">
              {formatCurrency(attr?.amount_min, attr?.currency_symbol)} – {formatCurrency(attr?.amount_max, attr?.currency_symbol)}
            </Text>
            <View className="mt-3">
              <DetailRow label="Frequency" value={attr?.repeat_freq} />
              <DetailRow label="Start Date" value={attr?.date ? formatDate(attr.date) : ''} />
              <DetailRow label="Next Expected" value={attr?.next_expected_match ? formatDate(attr.next_expected_match) : 'N/A'} />
              <DetailRow label="Active" value={attr?.active ? 'Yes' : 'No'} />
              {attr?.notes ? <DetailRow label="Notes" value={attr.notes} /> : null}
            </View>
          </View>

          {attr?.paid_dates && attr.paid_dates.length > 0 ? (
            <View className="mb-4">
              <Text className="text-lg font-semibold text-foreground mb-2">Paid Dates</Text>
              {attr.paid_dates.map((pd: any, i: number) => (
                <View key={i} className="bg-surface rounded-xl p-3 border border-border mb-2 flex-row items-center">
                  <MaterialIcons name="check-circle" size={18} color={colors.success} style={{ marginRight: 8 }} />
                  <Text className="text-sm text-foreground">{formatDate(pd.date)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View className="flex-row py-1.5 border-b border-border/50">
      <Text className="text-sm text-muted w-28">{label}</Text>
      <Text className="text-sm text-foreground flex-1 capitalize">{value}</Text>
    </View>
  );
}
