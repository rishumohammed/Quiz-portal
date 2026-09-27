import { useAuthStore } from '@/stores/auth';

export function useAppDate() {
  const authStore = useAuthStore();

  const getTimezone = () => {
    return authStore.user?.timezone || 'Asia/Kolkata';
  };

  const formatDate = (dateStr: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => {
    if (!dateStr) return '—';
    try {
      const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('en-IN', {
        timeZone: getTimezone(),
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        ...options
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  const formatDateOnly = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return '—';
    try {
      const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-IN', {
        timeZone: getTimezone(),
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  const formatTimeOnly = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return '—';
    try {
      const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleTimeString('en-IN', {
        timeZone: getTimezone(),
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  const toISODate = (d: Date = new Date()) => {
    const tz = getTimezone();
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(d);
    } catch (e) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  };

  return {
    getTimezone,
    formatDate,
    formatDateOnly,
    formatTimeOnly,
    toISODate
  };
}
