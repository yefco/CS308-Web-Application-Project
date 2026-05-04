const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        data?.details ||
        'Something went wrong.'
    );
  }

  return data;
};

export const getPendingComments = async () => {
  const response = await fetch('/api/products/ratings/pending', {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

export const approveComment = async (ratingId) => {
  const response = await fetch(`/api/products/ratings/${ratingId}/approve`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

export const rejectComment = async (ratingId) => {
  const response = await fetch(`/api/products/ratings/${ratingId}/reject`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};