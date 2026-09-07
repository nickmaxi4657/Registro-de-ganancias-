export function formatCurrency(amount: number, currency: string = '$'): string {
  const num = Number(amount) || 0;
  // Format with thousands separator and up to 2 decimal places if needed
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num);

  return `${currency} ${formatted}`;
}

export function formatPercent(percent: number, decimals: number = 1): string {
  const num = Number(percent) || 0;
  return `${num.toFixed(decimals)}%`;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDateShort(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
}
