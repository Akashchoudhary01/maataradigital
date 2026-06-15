/**
 * Format number as Indian Rupees
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to DD/MM/YYYY
 */
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format date to Month Year (e.g. January 2024)
 */
export const formatMonthYear = (year, month) => {
  return new Date(year, month - 1).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Get status badge class
 */
export const getStatusBadge = (status) => {
  const map = {
    ACTIVE: 'badge-blue',
    COMPLETED: 'badge-green',
    DEFAULTED: 'badge-red',
    PAID: 'badge-green',
    PENDING: 'badge-yellow',
    OVERDUE: 'badge-red',
  };
  return map[status] || 'badge-gray';
};

/**
 * Truncate text
 */
export const truncate = (str, n = 30) =>
  str && str.length > n ? str.substring(0, n) + '...' : str;

/**
 * Calculate days overdue
 */
export const daysOverdue = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

/**
 * Build query string from object (filtering out empty values)
 */
export const buildQueryString = (params) => {
  const filtered = Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined);
  return new URLSearchParams(filtered).toString();
};
