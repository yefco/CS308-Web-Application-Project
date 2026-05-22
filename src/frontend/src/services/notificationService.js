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
    throw new Error(data?.message || data?.error || 'Request failed.');
  }
  return data;
};

export const getNotifications = async () => {
  const res = await fetch('/api/notifications', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const markAllRead = async () => {
  const res = await fetch('/api/notifications/read', {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};
