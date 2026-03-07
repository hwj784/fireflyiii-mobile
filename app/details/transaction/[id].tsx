import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate, getTransactionSign } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const txQuery = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => api.getTransaction(id!),
    enabled: !!id,
  });

  const transaction = txQuery.data?.data;
  const splits = transaction?.attributes?.transactions || [];

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.deleteTransaction(id!);
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      },
    ]);
  };

  if (txQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator color={colors.primary} size="large" />
      </ScreenContainer>
    );
  }

  const firstSplit = splits[0];
  if (!firstSplit) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-muted">Transaction not found</Text>
      </ScreenContainer>
    );
  }

  const isExpense = firstSplit.type === 'withdrawal';
  const isIncome = firstSplit.type === 'deposit';
  const amountColor = isExpense ? colors.error : isIncome ? colors.success : colors.primary;
  const sign = getTransactionSign(firstSplit.type);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-2">
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-foreground flex-1">Transaction</Text>
            <TouchableOpacity onPress={() => router.push(`/modals/transaction-form?id=${id}` as any)} className="mr-2">
              <MaterialIcons name="edit" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <MaterialIcons name="delete" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>

          {/* Amount Card */}
          <View className="bg-surface rounded-2xl p-5 border border-border mb-4 items-center">
            <Text className="text-sm text-muted mb-1 capitalize">{firstSplit.type}</Text>
            <Text className="text-4xl font-bold" style={{ color: amountColor }}>
              {sign}{formatCurrency(firstSplit.amount, firstSplit.currency_symbol)}
            </Text>
            <Text className="text-base text-foreground mt-2 text-center">{firstSplit.description}</Text>
            <Text className="text-sm text-muted mt-1">{formatDate(firstSplit.date)}</Text>
          </View>

          {/* Details */}
          {splits.map((split: any, index: number) => (
            <View key={index} className="bg-surface rounded-xl p-4 border border-border mb-3">
              {splits.length > 1 ? (
                <Text className="text-sm font-semibold text-foreground mb-2">Split {index + 1}</Text>
              ) : null}

              <DetailRow label="Source" value={split.source_name} />
              <DetailRow label="Destination" value={split.destination_name} />
              {split.category_name ? <DetailRow label="Category" value={split.category_name} /> : null}
              {split.budget_name ? <DetailRow label="Budget" value={split.budget_name} /> : null}
              {split.bill_name ? <DetailRow label="Bill" value={split.bill_name} /> : null}
              {split.tags?.length > 0 ? <DetailRow label="Tags" value={split.tags.join(', ')} /> : null}
              {split.notes ? <DetailRow label="Notes" value={split.notes} /> : null}
              {split.foreign_amount ? (
                <DetailRow
                  label="Foreign Amount"
                  value={formatCurrency(split.foreign_amount, split.foreign_currency_symbol)}
                />
              ) : null}
              {split.external_id ? <DetailRow label="External ID" value={split.external_id} /> : null}
              {split.internal_reference ? <DetailRow label="Reference" value={split.internal_reference} /> : null}
            </View>
          ))}
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
      <Text className="text-sm text-foreground flex-1">{value}</Text>
    </View>
  );
}
