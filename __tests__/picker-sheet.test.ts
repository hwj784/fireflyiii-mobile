import { describe, it, expect } from 'vitest';

// Test the PickerItem interface and filtering logic
describe('PickerSheet filtering logic', () => {
  interface PickerItem {
    id: string;
    label: string;
    sublabel?: string;
  }

  const items: PickerItem[] = [
    { id: '1', label: 'USD - US Dollar', sublabel: 'Symbol: $' },
    { id: '2', label: 'EUR - Euro', sublabel: 'Symbol: €' },
    { id: '3', label: 'GBP - British Pound', sublabel: 'Symbol: £' },
    { id: '4', label: 'JPY - Japanese Yen', sublabel: 'Symbol: ¥' },
    { id: '5', label: 'CNY - Chinese Yuan', sublabel: 'Symbol: ¥' },
  ];

  function filterItems(items: PickerItem[], search: string): PickerItem[] {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(q))
    );
  }

  it('returns all items when search is empty', () => {
    expect(filterItems(items, '')).toHaveLength(5);
    expect(filterItems(items, '  ')).toHaveLength(5);
  });

  it('filters by label', () => {
    const result = filterItems(items, 'USD');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by sublabel', () => {
    const result = filterItems(items, '€');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('is case insensitive', () => {
    const result = filterItems(items, 'euro');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('returns empty when no match', () => {
    expect(filterItems(items, 'XYZ')).toHaveLength(0);
  });

  it('matches partial strings', () => {
    const result = filterItems(items, 'Yen');
    expect(result).toHaveLength(1);
    expect(result[0].label).toContain('Japanese Yen');
  });

  it('matches multiple items', () => {
    const result = filterItems(items, '¥');
    expect(result).toHaveLength(2); // JPY and CNY both have ¥
  });
});

describe('Multi-select logic', () => {
  it('adds item to selection', () => {
    const selected: string[] = ['1', '2'];
    const itemId = '3';
    const exists = selected.includes(itemId);
    const result = exists ? selected.filter((id) => id !== itemId) : [...selected, itemId];
    expect(result).toEqual(['1', '2', '3']);
  });

  it('removes item from selection', () => {
    const selected: string[] = ['1', '2', '3'];
    const itemId = '2';
    const exists = selected.includes(itemId);
    const result = exists ? selected.filter((id) => id !== itemId) : [...selected, itemId];
    expect(result).toEqual(['1', '3']);
  });

  it('handles empty selection', () => {
    const selected: string[] = [];
    const itemId = '1';
    const exists = selected.includes(itemId);
    const result = exists ? selected.filter((id) => id !== itemId) : [...selected, itemId];
    expect(result).toEqual(['1']);
  });
});

describe('Date formatting', () => {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function formatDateDisplay(value: string): string {
    if (!value) return '';
    try {
      const [y, m, d] = value.split('-').map(Number);
      return `${MONTHS[m - 1]} ${d}, ${y}`;
    } catch {
      return value;
    }
  }

  it('formats a date correctly', () => {
    expect(formatDateDisplay('2025-06-15')).toBe('Jun 15, 2025');
  });

  it('formats January correctly', () => {
    expect(formatDateDisplay('2025-01-01')).toBe('Jan 1, 2025');
  });

  it('formats December correctly', () => {
    expect(formatDateDisplay('2025-12-31')).toBe('Dec 31, 2025');
  });

  it('returns empty for empty string', () => {
    expect(formatDateDisplay('')).toBe('');
  });

  it('handles edge case dates', () => {
    expect(formatDateDisplay('2024-02-29')).toBe('Feb 29, 2024');
  });
});

describe('Calendar days generation', () => {
  function generateDays(year: number, month: number): (number | null)[] {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    return arr;
  }

  it('generates correct days for January 2025', () => {
    const days = generateDays(2025, 0); // January
    // Jan 1, 2025 is Wednesday (day 3)
    expect(days.filter((d) => d === null)).toHaveLength(3);
    expect(days.filter((d) => d !== null)).toHaveLength(31);
    expect(days[3]).toBe(1);
    expect(days[days.length - 1]).toBe(31);
  });

  it('generates correct days for February 2024 (leap year)', () => {
    const days = generateDays(2024, 1); // February
    expect(days.filter((d) => d !== null)).toHaveLength(29);
  });

  it('generates correct days for February 2025 (non-leap year)', () => {
    const days = generateDays(2025, 1); // February
    expect(days.filter((d) => d !== null)).toHaveLength(28);
  });

  it('starts with null padding for first day offset', () => {
    const days = generateDays(2025, 0); // Jan 2025, starts on Wed
    expect(days[0]).toBeNull();
    expect(days[1]).toBeNull();
    expect(days[2]).toBeNull();
    expect(days[3]).toBe(1);
  });
});
