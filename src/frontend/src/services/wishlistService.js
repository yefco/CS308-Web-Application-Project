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

export const getWishlist = async () => {
  const response = await fetch('/api/wishlist', {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

export const addToWishlist = async (productId) => {
  const response = await fetch('/api/wishlist/items', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ product_id: productId }),
  });

  return handleResponse(response);
};

export const removeFromWishlist = async (productId) => {
  const response = await fetch(`/api/wishlist/items/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (response.status === 204) {
    return true;
  }

  return handleResponse(response);
};
