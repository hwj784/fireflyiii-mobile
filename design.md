# Firefly III Mobile App - Design Document

## Overview

A full-featured mobile client for Firefly III personal finance manager. The app connects to any self-hosted Firefly III server via its REST API v1, authenticated with Personal Access Tokens. The design follows Apple Human Interface Guidelines for a native iOS feel.

## Screen List

### Authentication
1. **Server Setup Screen** - Enter Firefly III server URL and Personal Access Token
2. **Connection Test** - Validates credentials and shows server info

### Main Tab Bar (5 tabs)
1. **Dashboard** (Home) - Financial overview with balance summaries, recent transactions, budget progress
2. **Accounts** - List all accounts grouped by type (asset, expense, revenue, liability)
3. **Transactions** - Full transaction list with search, filter, and create
4. **Budgets** - Budget overview with spending progress bars
5. **More** - Access to Categories, Tags, Piggy Banks, Bills, Rules, Recurring, Reports, Settings

### Detail / Modal Screens
- **Account Detail** - Account info + transaction history for that account
- **Transaction Detail** - Full transaction info with splits, tags, attachments
- **Create/Edit Transaction** - Form with type selector (withdrawal/deposit/transfer), amount, accounts, category, budget, tags, notes
- **Budget Detail** - Budget limits and spending breakdown
- **Category Detail** - Category transactions list
- **Tag Detail** - Tag transactions list
- **Piggy Bank Detail** - Progress, events, add/remove money
- **Bill Detail** - Bill info, linked transactions, rules
- **Rule Detail** - Rule triggers and actions
- **Recurring Transaction Detail** - Schedule and transaction template
- **Report Screen** - Charts for account balances, budget overview, category breakdown
- **Search Screen** - Global transaction search
- **Settings Screen** - Server info, preferences, currency management
- **Currency Management** - Enable/disable currencies, set primary

## Primary Content and Functionality

### Dashboard
- Net worth summary card (total assets - total liabilities)
- Balance cards for each asset account
- Recent transactions list (last 10)
- Budget progress bars for current period
- Bills due soon indicator
- Quick action FAB: New Transaction

### Accounts
- Grouped sections: Asset Accounts, Expense Accounts, Revenue Accounts, Liabilities
- Each card shows: name, current balance, currency, last activity
- Tap to view account detail with transaction history
- Swipe to edit/delete
- FAB: Create new account

### Transactions
- Infinite scroll list with date grouping
- Each row: description, amount (color-coded), source/destination accounts, category icon
- Filter bar: date range, type (withdrawal/deposit/transfer), account
- Search with Firefly III search syntax
- FAB: Create new transaction

### Transaction Form
- Type selector: Withdrawal / Deposit / Transfer
- Amount input with currency selector
- Source account picker (autocomplete)
- Destination account picker (autocomplete)
- Description field
- Date/time picker
- Category picker (autocomplete)
- Budget picker (autocomplete)
- Tags multi-select (autocomplete)
- Notes field
- Split transaction support (add multiple splits)

### Budgets
- List of budgets with progress bars
- Each shows: name, spent amount, limit amount, percentage
- Period selector (monthly)
- Tap for budget detail with transaction list

### Categories
- Alphabetical list with transaction count
- Tap for category transactions
- Create/edit/delete

### Tags
- Tag cloud or list view
- Tap for tag transactions
- Create/edit/delete

### Piggy Banks
- List with progress bars (current vs target)
- Each shows: name, current amount, target, percentage
- Tap for detail with events history
- Add/remove money action

### Bills
- List of recurring bills
- Each shows: name, amount range, frequency, next expected date
- Status indicator (paid/unpaid for current period)
- Tap for detail with linked transactions

### Rules & Rule Groups
- Grouped list of rules
- Each shows: title, triggers summary, active/inactive toggle
- Test rule / trigger rule actions

### Recurring Transactions
- List of recurring transaction templates
- Each shows: title, amount, frequency, next fire date
- Tap for detail

### Reports / Charts
- Account balance over time (line chart)
- Budget overview (bar chart)
- Category spending (pie chart)
- Income vs Expense (bar chart)
- Period selector

### Settings
- Server URL display
- Current user info
- Currency management
- Preferences
- About / version info
- Disconnect / logout

## Key User Flows

### First Launch
1. App opens → Server Setup Screen
2. User enters server URL → validates format
3. User enters Personal Access Token
4. Tap "Connect" → tests connection via GET /v1/about
5. Success → saves credentials securely → navigates to Dashboard
6. Failure → shows error message, retry

### Create Transaction
1. Tap FAB on Dashboard or Transactions tab
2. Select type: Withdrawal / Deposit / Transfer
3. Enter amount
4. Select/search source account
5. Select/search destination account
6. Add description
7. Optionally: set category, budget, tags, date, notes
8. Tap "Save" → POST /v1/transactions
9. Success → returns to previous screen, list refreshes

### Check Budget Status
1. Tap Budgets tab
2. See all budgets with progress bars
3. Tap a budget → see detail with limit info and transactions
4. Optionally adjust budget limit

### Manage Piggy Bank
1. Navigate to More → Piggy Banks
2. See list with progress
3. Tap piggy bank → detail screen
4. Tap "Add Money" → enter amount → confirms
5. Progress updates

## Color Choices

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| primary | #2563EB | #3B82F6 | Main accent (blue - finance/trust) |
| background | #F8FAFC | #0F172A | Screen backgrounds |
| surface | #FFFFFF | #1E293B | Cards and elevated surfaces |
| foreground | #0F172A | #F1F5F9 | Primary text |
| muted | #64748B | #94A3B8 | Secondary text |
| border | #E2E8F0 | #334155 | Dividers and borders |
| success | #16A34A | #4ADE80 | Income, positive amounts |
| warning | #D97706 | #FBBF24 | Pending, warnings |
| error | #DC2626 | #F87171 | Expenses, negative amounts, errors |
| income | #16A34A | #4ADE80 | Deposit amounts |
| expense | #DC2626 | #F87171 | Withdrawal amounts |
| transfer | #2563EB | #3B82F6 | Transfer amounts |

## Typography
- Large titles: 34pt bold (screen headers)
- Section headers: 20pt semibold
- Body: 17pt regular
- Caption: 13pt regular, muted color
- Amounts: 17pt-24pt semibold, monospace-style

## Navigation Structure
```
Root Stack
├── Auth Stack (no tabs)
│   └── Server Setup Screen
├── Main Tab Bar
│   ├── Dashboard Tab
│   │   ├── Dashboard Screen
│   │   └── (push) Account Detail, Transaction Detail
│   ├── Accounts Tab
│   │   ├── Accounts List Screen
│   │   ├── (push) Account Detail
│   │   └── (push) Create/Edit Account
│   ├── Transactions Tab
│   │   ├── Transactions List Screen
│   │   ├── (push) Transaction Detail
│   │   └── (push) Search Screen
│   ├── Budgets Tab
│   │   ├── Budgets List Screen
│   │   └── (push) Budget Detail
│   └── More Tab
│       ├── More Menu Screen
│       ├── (push) Categories List → Category Detail
│       ├── (push) Tags List → Tag Detail
│       ├── (push) Piggy Banks List → Piggy Bank Detail
│       ├── (push) Bills List → Bill Detail
│       ├── (push) Rules List → Rule Detail
│       ├── (push) Recurring List → Recurring Detail
│       ├── (push) Reports Screen
│       └── (push) Settings Screen
└── Modal Stack
    ├── Create/Edit Transaction
    ├── Create/Edit Budget
    └── Create/Edit Account
```
