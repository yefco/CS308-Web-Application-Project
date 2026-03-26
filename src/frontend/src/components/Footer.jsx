import React from 'react';
import { Box, Container, Grid, Typography, Link, Divider, Button } from '@mui/material';
import { Facebook, Twitter, Instagram, LinkedIn } from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ bgcolor: '#2c3e50', color: '#ecf0f1', mt: 8 }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* Company Info */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              TechStore
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#bdc3c7' }}>
              Your trusted online destination for quality technology products at great prices.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" sx={{ color: '#3498db', minWidth: 'auto', p: 0.5 }}>
                <Facebook />
              </Button>
              <Button size="small" sx={{ color: '#3498db', minWidth: 'auto', p: 0.5 }}>
                <Twitter />
              </Button>
              <Button size="small" sx={{ color: '#3498db', minWidth: 'auto', p: 0.5 }}>
                <Instagram />
              </Button>
              <Button size="small" sx={{ color: '#3498db', minWidth: 'auto', p: 0.5 }}>
                <LinkedIn />
              </Button>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" underline="none" sx={{ color: '#bdc3c7', '&:hover': { color: '#3498db' } }}>
                About Us
              </Link>
              <Link href="#" underline="none" sx={{ color: '#bdc3c7', '&:hover': { color: '#3498db' } }}>
                Products
              </Link>
              <Link href="#" underline="none" sx={{ color: '#bdc3c7', '&:hover': { color: '#3498db' } }}>
                Special Offers
              </Link>
              <Link href="#" underline="none" sx={{ color: '#bdc3c7', '&:hover': { color: '#3498db' } }}>
                Blog
              </Link>
            </Box>
          </Grid>

          {/* Customer Service */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Customer Service
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" underline="none" sx={{ color: '#bdc3c7', '&:hover': { color: '#3498db' } }}>
                Contact Us
              </Link>
              <Link href="#" underline="none" sx={{ color: '#bdc3c7', '&:hover': { color: '#3498db' } }}>
                Shipping Info
              </Link>
              <Link href="#" underline="none" sx={{ color: '#bdc3c7', '&:hover': { color: '#3498db' } }}>
                Returns
              </Link>
              <Link href="#" underline="none" sx={{ color: '#bdc3c7', '&:hover': { color: '#3498db' } }}>
                FAQ
              </Link>
            </Box>
          </Grid>

          {/* Legal */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Legal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" underline="none" sx={{ color: '#bdc3c7', '&:hover': { color: '#3498db' } }}>
                Privacy Policy
              </Link>
              <Link href="#" underline="none" sx={{ color: '#bdc3c7', '&:hover': { color: '#3498db' } }}>
                Terms & Conditions
              </Link>
              <Link href="#" underline="none" sx={{ color: '#bdc3c7', '&:hover': { color: '#3498db' } }}>
                Cookie Policy
              </Link>
              <Link href="#" underline="none" sx={{ color: '#bdc3c7', '&:hover': { color: '#3498db' } }}>
                Security
              </Link>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ bgcolor: '#34495e', my: 3 }} />

        {/* Bottom Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#bdc3c7' }}>
            &copy; {currentYear} TechStore. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#bdc3c7' }}>
              Secure Checkout
            </Typography>
            <Typography variant="body2" sx={{ color: '#bdc3c7' }}>
              Free Shipping on Orders Over $50
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
