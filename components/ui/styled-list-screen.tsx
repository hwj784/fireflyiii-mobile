import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/** Reusable nav bar for detail/list screens */
export function ScreenNavBar({ title, onBack, rightActions }: {
  title: string;
  onBack?: () => void;
  rightActions?: React.ReactNode;
}) {
  const colors = useColors();
  const router = useRouter();
  return (
    <View style={styles.navBar}>
      <TouchableOpacity onPress={onBack || (() => router.back())} style={[styles.navBtn, { backgroundColor: colors.surface }]}>
        <MaterialIcons name="arrow-back" size={22} color={colors.foreground} />
      </TouchableOpacity>
      <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
      <View style={styles.navActions}>{rightActions}</View>
    </View>
  );
}

/** Reusable empty state */
export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  const colors = useColors();
  return (
    <View style={styles.emptyState}>
      <MaterialIcons name={icon as any} size={48} color={colors.border} />
      <Text style={[styles.emptyTitle, { color: colors.muted }]}>{title}</Text>
      {subtitle ? <Text style={[styles.emptySubtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
    </View>
  );
}

/** Reusable FAB */
export function FloatingActionButton({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={onPress} activeOpacity={0.85}>
      <MaterialIcons name="add" size={26} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

/** Reusable action button for nav bar */
export function NavActionButton({ icon, color, bgColor, onPress }: {
  icon: string; color: string; bgColor: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.navBtn, { backgroundColor: bgColor }]}>
      <MaterialIcons name={icon as any} size={20} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: -0.3,
  },
  navActions: {
    flexDirection: 'row',
    gap: 8,
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
    bottom: 32,
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
