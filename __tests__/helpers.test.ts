import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  getTransactionColor,
  getTransactionSign,
  getAccountTypeLabel,
  getAccountIcon,
  getStartOfMonth,
  getEndOfMonth,
  getToday,
  parseAmount,
} from '../lib/helpers';

describe('formatCurrency', () => {
  it('formats a positive number with symbol', () => {
    expect(formatCurrency(1234.56, '$')).toBe('$1,234.56');
  });

  it('formats a negative number', () => {
    expect(formatCurrency(-500, '€')).toBe('-€500.00');
  });

  it('formats a string amount', () => {
    expect(formatCurrency('99.9', '¥')).toBe('¥99.90');
  });

  it('handles zero', () => {
    expect(formatCurrency(0, '$')).toBe('$0.00');
  });

  it('handles NaN', () => {
    expect(formatCurrency('abc', '$')).toBe('0.00');
  });

  it('formats without symbol', () => {
    expect(formatCurrency(1000)).toBe('1,000.00');
  });

  it('uses currency code as fallback', () => {
    expect(formatCurrency(50, undefined, 'USD')).toBe('USD50.00');
  });

  it('handles large numbers', () => {
    expect(formatCurrency(1234567.89, '$')).toBe('$1,234,567.89');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2025-01-15');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty for empty string', () => {
    expect(formatDate('')).toBe('');
  });
});

describe('formatDateShort', () => {
  it('formats a date string short', () => {
    const result = formatDateShort('2025-06-15');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty for empty string', () => {
    expect(formatDateShort('')).toBe('');
  });
});

describe('getTransactionColor', () => {
  it('returns error for withdrawal', () => {
    expect(getTransactionColor('withdrawal')).toBe('error');
  });

  it('returns success for deposit', () => {
    expect(getTransactionColor('deposit')).toBe('success');
  });

  it('returns primary for transfer', () => {
    expect(getTransactionColor('transfer')).toBe('primary');
  });

  it('returns foreground for unknown', () => {
    expect(getTransactionColor('unknown')).toBe('foreground');
  });
});

describe('getTransactionSign', () => {
  it('returns - for withdrawal', () => {
    expect(getTransactionSign('withdrawal')).toBe('-');
  });

  it('returns + for deposit', () => {
    expect(getTransactionSign('deposit')).toBe('+');
  });

  it('returns empty for transfer', () => {
    expect(getTransactionSign('transfer')).toBe('');
  });
});

describe('getAccountTypeLabel', () => {
  it('returns correct label for asset', () => {
    expect(getAccountTypeLabel('asset')).toBe('Asset Accounts');
  });

  it('returns correct label for expense', () => {
    expect(getAccountTypeLabel('expense')).toBe('Expense Accounts');
  });

  it('returns type string for unknown', () => {
    expect(getAccountTypeLabel('custom')).toBe('custom');
  });
});

describe('getAccountIcon', () => {
  it('returns credit-card for ccAsset role', () => {
    expect(getAccountIcon('asset', 'ccAsset')).toBe('credit-card');
  });

  it('returns savings for savingAsset role', () => {
    expect(getAccountIcon('asset', 'savingAsset')).toBe('savings');
  });

  it('returns account-balance for asset type', () => {
    expect(getAccountIcon('asset')).toBe('account-balance');
  });

  it('returns shopping-cart for expense type', () => {
    expect(getAccountIcon('expense')).toBe('shopping-cart');
  });

  it('returns money-off for liability type', () => {
    expect(getAccountIcon('liability')).toBe('money-off');
  });
});

describe('getStartOfMonth', () => {
  it('returns first day of current month', () => {
    const result = getStartOfMonth();
    expect(result).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it('returns first day of given date month', () => {
    const result = getStartOfMonth(new Date(2025, 5, 15));
    expect(result).toBe('2025-06-01');
  });
});

describe('getEndOfMonth', () => {
  it('returns last day of current month', () => {
    const result = getEndOfMonth();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns last day of Feb 2024 (leap year)', () => {
    const result = getEndOfMonth(new Date(2024, 1, 10));
    expect(result).toBe('2024-02-29');
  });
});

describe('getToday', () => {
  it('returns today in YYYY-MM-DD format', () => {
    const result = getToday();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('parseAmount', () => {
  it('parses valid number string', () => {
    expect(parseAmount('123.45')).toBe(123.45);
  });

  it('returns 0 for invalid string', () => {
    expect(parseAmount('abc')).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(parseAmount('')).toBe(0);
  });
});
