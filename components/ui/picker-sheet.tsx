import React, { useState, useMemo } from 'react';
import {
  Text, View, TextInput, TouchableOpacity, FlatList, Modal,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface PickerItem {
  id: string;
  label: string;
  sublabel?: string;
  icon?: string;
  color?: string;
}

interface PickerSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: PickerItem[];
  selectedId?: string;
  selectedIds?: string[];
  onSelect: (item: PickerItem) => void;
  onMultiSelect?: (items: PickerItem[]) => void;
  multiSelect?: boolean;
  searchable?: boolean;
  allowCustom?: boolean;
  customPlaceholder?: string;
  onCustomSubmit?: (value: string) => void;
  loading?: boolean;
}

export function PickerSheet({
  visible, onClose, title, items, selectedId, selectedIds = [], onSelect, onMultiSelect,
  multiSelect = false, searchable = true, allowCustom = false, customPlaceholder = 'Enter custom value...',
  onCustomSubmit, loading = false,
}: PickerSheetProps) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q) || (item.sublabel && item.sublabel.toLowerCase().includes(q)));
  }, [items, search]);

  const handleSelect = (item: PickerItem) => {
    if (multiSelect) {
      setLocalSelectedIds((prev) => prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]);
    } else {
      onSelect(item); setSearch(''); onClose();
    }
  };

  const handleDone = () => {
    if (multiSelect && onMultiSelect) onMultiSelect(items.filter((item) => localSelectedIds.includes(item.id)));
    setSearch(''); onClose();
  };

  const handleCustomSubmit = () => {
    if (search.trim() && onCustomSubmit) { onCustomSubmit(search.trim()); setSearch(''); onClose(); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => { setSearch(''); onClose(); }} />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text>
            {multiSelect ? (
              <TouchableOpacity onPress={handleDone} style={[styles.doneBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => { setSearch(''); onClose(); }} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="close" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search */}
          {searchable ? (
            <View style={styles.searchRow}>
              <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialIcons name="search" size={18} color={colors.muted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Search..."
                  placeholderTextColor={colors.muted}
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                  returnKeyType={allowCustom ? 'done' : 'search'}
                  onSubmitEditing={allowCustom ? handleCustomSubmit : undefined}
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <MaterialIcons name="close" size={16} color={colors.muted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Items */}
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = multiSelect ? localSelectedIds.includes(item.id) : item.id === selectedId;
              return (
                <TouchableOpacity style={[styles.itemRow, { borderBottomColor: colors.border + '30' }]} onPress={() => handleSelect(item)} activeOpacity={0.6}>
                  {item.icon ? (
                    <View style={[styles.itemIcon, { backgroundColor: (item.color || colors.primary) + '14' }]}>
                      <MaterialIcons name={item.icon as any} size={16} color={item.color || colors.primary} />
                    </View>
                  ) : item.color ? (
                    <View style={[styles.itemIcon, { backgroundColor: item.color + '14' }]}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: item.color }}>{item.label.charAt(0).toUpperCase()}</Text>
                    </View>
                  ) : null}
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemLabel, { color: colors.foreground }]} numberOfLines={1}>{item.label}</Text>
                    {item.sublabel ? <Text style={[styles.itemSublabel, { color: colors.muted }]} numberOfLines={1}>{item.sublabel}</Text> : null}
                  </View>
                  {isSelected ? (
                    <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                      <MaterialIcons name="check" size={14} color="#FFFFFF" />
                    </View>
                  ) : multiSelect ? (
                    <View style={[styles.uncheckBadge, { borderColor: colors.border }]} />
                  ) : null}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {loading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : allowCustom && search.trim() ? (
                  <TouchableOpacity style={styles.customRow} onPress={handleCustomSubmit}>
                    <View style={[styles.addIcon, { backgroundColor: colors.primary + '14' }]}>
                      <MaterialIcons name="add" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.customText, { color: colors.primary }]}>Create "{search.trim()}"</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.emptyText, { color: colors.muted }]}>No items found</Text>
                )}
              </View>
            }
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface PickerFieldProps {
  label: string; value: string; placeholder: string; onPress: () => void; required?: boolean; icon?: string;
}

export function PickerField({ label, value, placeholder, onPress, required, icon }: PickerFieldProps) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 4 }}>{label}{required ? ' *' : ''}</Text>
      <TouchableOpacity
        style={[styles.fieldBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPress} activeOpacity={0.7}
      >
        {icon ? <MaterialIcons name={icon as any} size={18} color={colors.muted} style={{ marginRight: 8 }} /> : null}
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: value ? colors.foreground : colors.muted }} numberOfLines={1}>{value || placeholder}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

interface MultiPickerFieldProps {
  label: string; values: string[]; placeholder: string; onPress: () => void; onRemove?: (value: string) => void;
}

export function MultiPickerField({ label, values, placeholder, onPress, onRemove }: MultiPickerFieldProps) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 4 }}>{label}</Text>
      <TouchableOpacity style={[styles.fieldBox, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
        {values.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {values.map((v) => (
              <View key={v} style={[styles.tagBadge, { backgroundColor: colors.primary + '14' }]}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary, marginRight: 4 }}>{v}</Text>
                {onRemove ? (
                  <TouchableOpacity onPress={() => onRemove(v)}>
                    <MaterialIcons name="close" size={12} color={colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
            <Text style={{ fontSize: 15, color: colors.muted }}>{placeholder}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.muted} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', minHeight: 300, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 20 },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  doneBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  doneBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 15 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  itemIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemContent: { flex: 1, marginRight: 8 },
  itemLabel: { fontSize: 15, fontWeight: '500' },
  itemSublabel: { fontSize: 12, marginTop: 1 },
  checkBadge: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  uncheckBadge: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5 },
  emptyState: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '500' },
  customRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  addIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  customText: { fontSize: 15, fontWeight: '600' },
  fieldBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
});
