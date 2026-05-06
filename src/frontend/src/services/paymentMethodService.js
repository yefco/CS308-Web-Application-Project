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

export const getPaymentMethods = async () => {
  const response = await fetch('/api/payment-methods', {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

export const createPaymentMethod = async (payload) => {
  const response = await fetch('/api/payment-methods', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const getPaymentMethodById = async (paymentId) => {
  const response = await fetch(`/api/payment-methods/${paymentId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

export const updatePaymentMethod = async (paymentId, payload) => {
  const response = await fetch(`/api/payment-methods/${paymentId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const deletePaymentMethod = async (paymentId) => {
  const response = await fetch(`/api/payment-methods/${paymentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let data = null;

    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    throw new Error(
      data?.message ||
        data?.error ||
        data?.details ||
        'Failed to delete payment method.'
    );
  }

  return true;
};