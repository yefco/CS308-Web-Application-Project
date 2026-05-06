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

/**
 * Submit a rating and/or comment for a product
 * @param {number} productId - The product ID
 * @param {number} rating - Rating from 1-5 stars
 * @param {string} comment - Comment text (optional)
 * @returns {Promise} Response from server
 */
export const submitProductRating = async (productId, rating, comment = '') => {
  const response = await fetch('/api/products/ratings', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      productId,
      rating,
      comment,
    }),
  });

  return handleResponse(response);
};

/**
 * Get all ratings for a product
 * @param {number} productId - The product ID
 * @returns {Promise} List of ratings for the product
 */
export const getProductRatings = async (productId) => {
  const response = await fetch(`/api/products/${productId}/ratings`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

/**
 * Get user's rating for a product (if exists)
 * @param {number} productId - The product ID
 * @returns {Promise} User's rating for the product or null
 */
export const getUserProductRating = async (productId) => {
  const response = await fetch(`/api/products/${productId}/user-rating`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};
