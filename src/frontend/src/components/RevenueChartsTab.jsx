import React, { useState, useEffect } from 'react';
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
import { getRevenueData, getTopProducts } from '../services/salesManagerService';

const COLORS = ['#27ae60', '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];

function RevenueChartsTab({ refreshTrigger }) {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [trendData, setTrendData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadChartData();
  }, [refreshTrigger]);

  const loadChartData = async () => {
    try {
      setLoading(true);

      // Get revenue data
      const revenueData = await getRevenueData(startDate, endDate);
      const orders = Array.isArray(revenueData.orders) ? revenueData.orders : [];

      // Process trend data (daily revenue)
      const dailyRevenue = {};
      orders.forEach((order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(order.total_amount);
      });

      const trendChartData = Object.entries(dailyRevenue)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, revenue]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: parseFloat(revenue.toFixed(2)),
          profit: parseFloat((revenue * 0.25).toFixed(2)), // Mock: 25% profit
        }));

      setTrendData(trendChartData);

      // Profit data (weekly)
      const weeklyProfit = {};
      orders.forEach((order) => {
        const date = new Date(order.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const week = weekStart.toISOString().split('T')[0];
        weeklyProfit[week] = (weeklyProfit[week] || 0) + parseFloat(order.total_amount) * 0.25;
      });

      const profitChartData = Object.entries(weeklyProfit)
        .sort(([weekA], [weekB]) => weekA.localeCompare(weekB))
        .map(([week, profit]) => ({
          week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          profit: parseFloat(profit.toFixed(2)),
        }));

      setProfitData(profitChartData);

      // Status distribution
      const statusCount = {
        processing: 0,
        in_transit: 0,
        delivered: 0,
        cancelled: 0,
        returned: 0,
      };

      orders.forEach((order) => {
        const status = order.status?.toLowerCase().replace('-', '_') || 'processing';
        if (status in statusCount) {
          statusCount[status]++;
        }
      });

      setStatusData(
        Object.entries(statusCount).map(([name, value]) => ({
          name: name.replace('_', ' ').charAt(0).toUpperCase() + name.slice(1),
          value,
        }))
      );

      // Top products
      const topProductsData = await getTopProducts(startDate, endDate);
      setTopProducts(
        Array.isArray(topProductsData)
          ? topProductsData.slice(0, 10)
          : topProductsData?.products?.slice(0, 10) || []
      );
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to load chart data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 150 }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 150 }}
        />
        <Button variant="contained" onClick={loadChartData} sx={{ bgcolor: '#3498db' }}>
          Update Charts
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Revenue Trend */}
          <Paper sx={{ p: 3, mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
              Revenue Trend
            </Typography>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#27ae60"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#3498db"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Alert severity="info">No data to display</Alert>
            )}
          </Paper>

          {/* Profit Chart */}
          <Paper sx={{ p: 3, mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
              Weekly Profit
            </Typography>
            {profitData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="profit" fill="#9b59b6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Alert severity="info">No data to display</Alert>
            )}
          </Paper>

          {/* Order Status Distribution */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
                  Order Status Distribution
                </Typography>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert severity="info">No data to display</Alert>
                )}
              </Paper>
            </Grid>

            {/* Top Products */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
                  Top 10 Products
                </Typography>
                {topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={topProducts.map((p) => ({
                        name: p.product_name?.substring(0, 15),
                        sales: parseFloat(p.total_sales || 0),
                      }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      <Bar dataKey="sales" fill="#e74c3c" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert severity="info">No data to display</Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}

export default RevenueChartsTab;
