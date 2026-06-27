import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', options ?? {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export function formatPrice(amount: number, currency: string): string {
  if (amount === 0) return 'Kostenlos';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getUniqueValues<T>(items: T[], getter: (item: T) => string | undefined): string[] {
  const values = new Set<string>();
  for (const item of items) {
    const val = getter(item);
    if (val) values.add(val);
  }
  return Array.from(values).sort();
}
