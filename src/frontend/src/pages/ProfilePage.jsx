import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import { PersonOutline, ReceiptLong, FavoriteBorder } from '@mui/icons-material';

const roleLabel = (role) => {
  if (role === 'SalesManager' || role === 'sales_manager') return 'Sales Manager';
  if (role === 'ProductManager' || role === 'product_manager') return 'Product Manager';
  return 'Customer';
};

const valueOrDash = (value) => (value && `${value}`.trim() ? value : '—');

const ProfilePage = ({ isLoggedIn }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { returnTo: '/profile' } });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('userData') || '{}');
  } catch {
    user = {};
  }

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            My Profile
          </Typography>
          <Typography sx={{ color: '#7f8c8d', mt: 0.5 }}>
            Customer details required by the project are stored here.
          </Typography>
        </Box>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e4e7eb' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <PersonOutline sx={{ color: '#3498db' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                Account Information
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#7f8c8d', textTransform: 'uppercase' }}>
                  User ID
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#2c3e50' }}>
                  {valueOrDash(user.user_id)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#7f8c8d', textTransform: 'uppercase' }}>
                  Account Balance
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#27ae60', fontSize: '1.05rem' }}>
                  ${typeof user.balance === 'number' ? user.balance.toFixed(2) : '0.00'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#7f8c8d', textTransform: 'uppercase' }}>
                  Name
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#2c3e50' }}>
                  {valueOrDash(user.user_name)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#7f8c8d', textTransform: 'uppercase' }}>
                  Email
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#2c3e50' }}>
                  {valueOrDash(user.email)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#7f8c8d', textTransform: 'uppercase' }}>
                  Tax ID
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#2c3e50' }}>
                  {valueOrDash(user.tax_id)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#7f8c8d', textTransform: 'uppercase' }}>
                  Role
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#2c3e50' }}>
                  {roleLabel(user.role)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#7f8c8d', textTransform: 'uppercase' }}>
                  Home Address
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#2c3e50' }}>
                  {valueOrDash(user.home_address)}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<ReceiptLong />}
                onClick={() => navigate('/order-tracking')}
                sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}
              >
                View Orders
              </Button>
              <Button
                variant="outlined"
                startIcon={<FavoriteBorder />}
                onClick={() => navigate('/wishlist')}
                sx={{ borderColor: '#27ae60', color: '#27ae60' }}
              >
                Open Wishlist
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ProfilePage;
