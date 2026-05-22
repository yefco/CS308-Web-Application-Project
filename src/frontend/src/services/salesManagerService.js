const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || data?.error || data?.details || 'Request failed.');
  }
  return data;
};

export const setDiscount = async (productId, discountPercent) => {
  const res = await fetch(`/api/products/${productId}/discount`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ discount_percent: discountPercent }),
  });
  return handleResponse(res);
};

export const getRevenueReport = async (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await fetch(`/api/sales/revenue?${params}`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const getInvoices = async (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await fetch(`/api/sales/invoices?${params}`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const getPendingReturns = async () => {
  const res = await fetch('/api/returns/pending', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const approveReturn = async (requestId) => {
  const res = await fetch(`/api/returns/${requestId}/approve`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const rejectReturn = async (requestId) => {
  const res = await fetch(`/api/returns/${requestId}/reject`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};
