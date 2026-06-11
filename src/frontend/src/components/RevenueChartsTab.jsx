import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Alert,
  Snackbar,
  Grid,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const REVENUE_STATUSES = new Set(['processing', 'in_transit', 'delivered']);
const PIE_COLORS = ['#f39c12', '#3498db', '#27ae60', '#e74c3c', '#8e44ad'];
const STATUS_LABELS = { processing: 'Processing', in_transit: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned' };

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function RevenueChartsTab({ refreshTrigger }) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [trendData, setTrendData]       = useState([]);
  const [summaryData, setSummaryData]   = useState([]);
  const [topProducts, setTopProducts]   = useState([]);
  const [statusData, setStatusData]     = useState([]);
  const [loading, setLoading]           = useState(false);
  const [snack, setSnack]               = useState({ open: false, message: '', severity: 'success' });

  const loadChartData = useCallback(async () => {
    setLoading(true);
    try {
      // Both fetches in parallel
      const [invoiceRes, revenueRes] = await Promise.all([
        fetch(`/api/sales/invoices?from=${startDate}&to=${endDate}`, { headers: authHeaders() }),
        fetch(`/api/sales/revenue?from=${startDate}&to=${endDate}`,  { headers: authHeaders() }),
      ]);

      const invoiceData = invoiceRes.ok  ? await invoiceRes.json()  : { orders: [] };
      const revenueData = revenueRes.ok  ? await revenueRes.json()  : {};

      const orders = invoiceData.orders ?? [];

      // ── Daily trend: revenue vs refunds ──────────────────────
      const byDate = {};
      orders.forEach((o) => {
        const date = o.created_at.split('T')[0];
        if (!byDate[date]) byDate[date] = { revenue: 0, refunds: 0 };
        const amt = parseFloat(o.total_amount) || 0;
        if (o.status === 'returned')              byDate[date].refunds  += amt;
        else if (REVENUE_STATUSES.has(o.status)) byDate[date].revenue  += amt;
      });

      setTrendData(
        Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, { revenue, refunds }]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            Revenue: +revenue.toFixed(2),
            Refunds: +refunds.toFixed(2),
            Net:     +(revenue - refunds).toFixed(2),
          }))
      );

      // ── Period summary bar from /revenue endpoint ─────────────
      if (revenueData.revenue !== undefined) {
        setSummaryData([
          { name: 'Revenue',     value: +(revenueData.revenue     ?? 0).toFixed(2) },
          { name: 'Refunds',     value: +(revenueData.refunds     ?? 0).toFixed(2) },
          { name: 'Net Revenue', value: +(revenueData.net_revenue ?? 0).toFixed(2) },
        ]);
      }

      // ── Top products (from delivered/processing/in_transit orders) ──
      const productMap = {};
      orders
        .filter((o) => REVENUE_STATUSES.has(o.status))
        .forEach((o) => {
          (o.items ?? []).forEach((item) => {
            const key = item.product_name;
            if (!productMap[key]) productMap[key] = 0;
            productMap[key] += parseFloat(item.subtotal) || 0;
          });
        });

      setTopProducts(
        Object.entries(productMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([name, revenue]) => ({ name: name.length > 18 ? name.slice(0, 16) + '…' : name, revenue: +revenue.toFixed(2) }))
      );

      // ── Status distribution ───────────────────────────────────
      const statusCount = {};
      orders.forEach((o) => {
        const s = o.status ?? 'unknown';
        statusCount[s] = (statusCount[s] || 0) + 1;
      });

      setStatusData(
        Object.entries(statusCount)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => ({ name: STATUS_LABELS[name] ?? name, value }))
      );
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to load chart data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { loadChartData(); }, [refreshTrigger]);

  return (
    <>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField label="Start Date" type="date" value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
        <TextField label="End Date" type="date" value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
        <Button variant="contained" onClick={loadChartData}
          sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}>
          Update Charts
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>

          {/* Revenue & Refunds Daily Trend */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
                Daily Revenue vs Refunds
              </Typography>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="Revenue" stroke="#27ae60" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Refunds" stroke="#e74c3c" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Net" stroke="#3498db" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No orders in the selected date range.</Alert>
              )}
            </Paper>
          </Grid>

          {/* Profit / Loss Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 0.5 }}>
                Profit / Loss by Day
              </Typography>
              <Typography variant="body2" sx={{ color: '#7f8c8d', mb: 2 }}>
                Net = Revenue − Refunds. Green bars = profit, red bars = loss (refunds exceeded revenue).
              </Typography>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v, name) => [`$${Number(v).toFixed(2)}`, name]} />
                    <Legend />
                    <Bar dataKey="Revenue" fill="#27ae60" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Refunds" fill="#e74c3c" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Net" radius={[4, 4, 0, 0]}>
                      {trendData.map((entry, i) => (
                        <Cell key={i} fill={entry.Net >= 0 ? '#2980b9' : '#c0392b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No orders in the selected date range.</Alert>
              )}
            </Paper>
          </Grid>

          {/* Period Summary Bar */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
                Period Summary
              </Typography>
              {summaryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={summaryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {summaryData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.name === 'Refunds' ? '#e74c3c' : entry.name === 'Net Revenue' ? '#3498db' : '#27ae60'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No summary data available.</Alert>
              )}
            </Paper>
          </Grid>

          {/* Order Status Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
                Order Status Distribution
              </Typography>
              {statusData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%"
                      outerRadius={90} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No order data available.</Alert>
              )}
            </Paper>
          </Grid>

          {/* Top 10 Products */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
                Top Products by Revenue (delivered orders only)
              </Typography>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="#9b59b6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No product revenue data for this period.</Alert>
              )}
            </Paper>
          </Grid>

        </Grid>
      )}

      <Snackbar open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}

export default RevenueChartsTab;
