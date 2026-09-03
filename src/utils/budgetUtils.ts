export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const STANDARD_EXPENSE_CATEGORIES = [
  'Influencers',
  'Billboards',
  'LCD Screens',
  'Other'
] as const;

export type StandardCategory = typeof STANDARD_EXPENSE_CATEGORIES[number];

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current month formatted as YYYY-MM
 */
export function getCurrentMonthKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Converts any date ("2026-09-03") or display period ("September 2026") into normalized "YYYY-MM" key
 */
export function toMonthKey(str?: string): string {
  if (!str) return getCurrentMonthKey();
  const trimmed = str.trim();
  
  // Format YYYY-MM or YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}`;
  }

  // Format "Month YYYY" (e.g. "August 2026", "September 2026")
  const parts = trimmed.split(' ');
  if (parts.length === 2) {
    const mIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
    if (mIdx !== -1 && /^\d{4}$/.test(parts[1])) {
      const monthNum = String(mIdx + 1).padStart(2, '0');
      return `${parts[1]}-${monthNum}`;
    }
  }

  return trimmed;
}

/**
 * Converts "YYYY-MM" into readable "Month YYYY" (e.g. "2026-09" -> "September 2026")
 */
export function toMonthDisplay(monthKeyOrDate?: string): string {
  if (!monthKeyOrDate) return toMonthDisplay(getCurrentMonthKey());
  const key = toMonthKey(monthKeyOrDate);
  const match = key.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = match[1];
    const monthIndex = parseInt(match[2], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTH_NAMES[monthIndex]} ${year}`;
    }
  }
  return monthKeyOrDate;
}

/**
 * Generates a list of month options for selectors (6 months prior to 6 months ahead)
 */
export function getSelectableMonths(baseYear = 2026): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const years = [baseYear - 1, baseYear, baseYear + 1];

  for (const yr of years) {
    for (let m = 1; m <= 12; m++) {
      const key = `${yr}-${String(m).padStart(2, '0')}`;
      months.push({
        key,
        label: toMonthDisplay(key)
      });
    }
  }
  return months;
}

/**
 * Format currency with commas and optional cents
 */
export function formatCurrency(amount: number, showCents = false): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: 2
  }).format(num);
}
