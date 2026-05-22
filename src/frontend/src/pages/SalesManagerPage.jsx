import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  LocalOffer as DiscountIcon,
  TrendingUp as RevenueIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import DiscountManagementTab from '../components/DiscountManagementTab';
import RevenueReportsTab from '../components/RevenueReportsTab';
import RevenueChartsTab from '../components/RevenueChartsTab';
import '../styles/SalesManagerPage.css';

function SalesManagerPage({ isLoggedIn }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { returnTo: '/sales-manager' } });
      return;
    }

    // Check if user is sales_manager
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.role !== 'sales_manager' && userData.role !== 'SalesManager') {
        navigate('/');
      }
    } catch {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
            Sales Manager Dashboard
          </Typography>
          <Typography sx={{ color: '#7f8c8d' }}>
            Manage discounts, view revenue reports, and analyze sales performance
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            sx={{
              borderBottom: '1px solid #e0e0e0',
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: 15,
                color: '#7f8c8d',
                '&.Mui-selected': {
                  color: '#3498db',
                },
              },
            }}
          >
            <Tab
              icon={<DiscountIcon sx={{ mr: 1 }} />}
              iconPosition="start"
              label="Discount Management"
            />
            <Tab
              icon={<RevenueIcon sx={{ mr: 1 }} />}
              iconPosition="start"
              label="Revenue Reports"
            />
            <Tab
              icon={<ChartIcon sx={{ mr: 1 }} />}
              iconPosition="start"
              label="Analytics & Charts"
            />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <DiscountManagementTab onRefresh={handleRefresh} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 1 && (
              <RevenueReportsTab onRefresh={handleRefresh} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 2 && (
              <RevenueChartsTab onRefresh={handleRefresh} refreshTrigger={refreshTrigger} />
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default SalesManagerPage;
