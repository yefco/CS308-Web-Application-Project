const API_BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ─── Discount Endpoints ─────────────────────────────────────────

export async function getDiscounts() {
  try {
    const res = await fetch(`${API_BASE}/discounts`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch discounts: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching discounts:', error);
    throw error;
  }
}

export async function createDiscount(discountData) {
  try {
    const res = await fetch(`${API_BASE}/discounts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(discountData),
    });

    if (!res.ok) {
      throw new Error(`Failed to create discount: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error creating discount:', error);
    throw error;
  }
}

export async function updateDiscount(discountId, discountData) {
  try {
    const res = await fetch(`${API_BASE}/discounts/${discountId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(discountData),
    });

    if (!res.ok) {
      throw new Error(`Failed to update discount: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating discount:', error);
    throw error;
  }
}

export async function deleteDiscount(discountId) {
  try {
    const res = await fetch(`${API_BASE}/discounts/${discountId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to delete discount: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error deleting discount:', error);
    throw error;
  }
}

// ─── Product Endpoints ──────────────────────────────────────────

export async function getProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// ─── Revenue & Sales Endpoints ──────────────────────────────────

export async function getRevenueData(startDate, endDate) {
  try {
    // Uses /api/sales/invoices which returns { orders: [...] } — the shape
    // both RevenueReportsTab and RevenueChartsTab expect.
    // Query params are `from` and `to` as the backend DateRangeQuery struct defines.
    const params = new URLSearchParams({
      from: startDate,
      to: endDate,
    });

    const res = await fetch(`${API_BASE}/sales/invoices?${params}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch revenue data: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return { orders: [] };
  }
}

export async function getProfitData(startDate, endDate) {
  try {
    const params = new URLSearchParams({
      from_date: startDate,
      to_date: endDate,
    });

    const res = await fetch(`${API_BASE}/sales/profit?${params}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch profit data: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching profit data:', error);
    // Fallback: return empty object if endpoint not implemented
    return {};
  }
}

export async function getTopProducts(startDate, endDate) {
  try {
    const params = new URLSearchParams({
      from_date: startDate,
      to_date: endDate,
    });

    const res = await fetch(`${API_BASE}/sales/top-products?${params}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch top products: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching top products:', error);
    // Fallback: return empty array if endpoint not implemented
    return [];
  }
}

// ─── Helper to get all orders (for fallback) ────────────────────

export async function getAllOrders(startDate, endDate) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch orders: ${res.statusText}`);
    }

    const allOrders = await res.json();
    
    // Filter by date range client-side if needed
    return {
      orders: Array.isArray(allOrders) ? allOrders : allOrders.orders || [],
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { orders: [] };
  }
}
