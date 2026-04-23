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
 * Fetch all orders for the logged-in user with delivery status
 * @returns {Promise<Array>} Array of orders with their delivery information
 */
export const getUserOrders = async () => {
  const response = await fetch('/api/orders', {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

/**
 * Fetch a specific order by ID
 * @param {string} orderId - The ID of the order to fetch
 * @returns {Promise<Object>} Order details including delivery status
 */
export const getOrderById = async (orderId) => {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

/**
 * Fetch delivery status for an order
 * @param {string} orderId - The ID of the order
 * @returns {Promise<Object>} Delivery status information
 */
export const getDeliveryStatus = async (orderId) => {
  const response = await fetch(`/api/deliveries/status/${orderId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

/**
 * Get all deliveries for the logged-in user
 * @returns {Promise<Array>} Array of deliveries with status updates
 */
export const getUserDeliveries = async () => {
  const response = await fetch('/api/deliveries', {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};
