const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response) => {
  if (response.status === 204) return { success: true };
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || data?.details || 'Something went wrong.'
    );
  }
  return data;
};

export const getPendingComments = async () => {
  const response = await fetch('/api/reviews/pending', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const approveComment = async (commentId) => {
  const response = await fetch(`/api/reviews/${commentId}/approve`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const rejectComment = async (commentId) => {
  const response = await fetch(`/api/reviews/${commentId}/reject`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};
