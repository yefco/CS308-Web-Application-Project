import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  Chip,
  Rating,
  TextField,
  MenuItem,
  Paper,
} from '@mui/material';
import { ShoppingCart, FavoriteBorder, Favorite } from '@mui/icons-material';
import '../styles/HomePage.css';

const HomePage = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 1, name: 'All Products', value: 'all' },
    { id: 2, name: 'Laptops', value: 'laptops' },
    { id: 3, name: 'Smartphones', value: 'smartphones' },
    { id: 4, name: 'Tablets', value: 'tablets' },
    { id: 5, name: 'Accessories', value: 'accessories' },
  ];

  const products = [
    {
      id: 1,
      name: 'MacBook Pro 14"',
      category: 'laptops',
      price: 1999,
      originalPrice: 2199,
      image: 'https://via.placeholder.com/300x200?text=MacBook+Pro',
      rating: 4.8,
      reviews: 245,
      stock: 12,
      discount: 9,
      description: 'High-performance laptop with M3 Max chip',
    },
    {
      id: 2,
      name: 'iPhone 15 Pro',
      category: 'smartphones',
      price: 999,
      originalPrice: 1099,
      image: 'https://via.placeholder.com/300x200?text=iPhone+15+Pro',
      rating: 4.7,
      reviews: 512,
      stock: 25,
      discount: 9,
      description: 'Latest flagship smartphone with advanced camera',
    },
    {
      id: 3,
      name: 'iPad Air',
      category: 'tablets',
      price: 599,
      originalPrice: 699,
      image: 'https://via.placeholder.com/300x200?text=iPad+Air',
      rating: 4.5,
      reviews: 189,
      stock: 18,
      discount: 14,
      description: 'Versatile tablet perfect for work and creativity',
    },
    {
      id: 4,
      name: 'AirPods Pro',
      category: 'accessories',
      price: 249,
      originalPrice: 299,
      image: 'https://via.placeholder.com/300x200?text=AirPods+Pro',
      rating: 4.6,
      reviews: 328,
      stock: 45,
      discount: 17,
      description: 'Premium wireless earbuds with noise cancellation',
    },
    {
      id: 5,
      name: 'Dell XPS 13',
      category: 'laptops',
      price: 1299,
      originalPrice: 1499,
      image: 'https://via.placeholder.com/300x200?text=Dell+XPS+13',
      rating: 4.7,
      reviews: 178,
      stock: 15,
      discount: 13,
      description: 'Ultrabook with stunning display and portability',
    },
    {
      id: 6,
      name: 'Samsung Galaxy S24',
      category: 'smartphones',
      price: 899,
      originalPrice: 999,
      image: 'https://via.placeholder.com/300x200?text=Samsung+S24',
      rating: 4.6,
      reviews: 421,
      stock: 30,
      discount: 10,
      description: 'Powerful Android flagship with excellent display',
    },
    {
      id: 7,
      name: 'Magic Keyboard',
      category: 'accessories',
      price: 149,
      originalPrice: 179,
      image: 'https://via.placeholder.com/300x200?text=Magic+Keyboard',
      rating: 4.4,
      reviews: 95,
      stock: 50,
      discount: 17,
      description: 'Wireless keyboard for seamless typing experience',
    },
    {
      id: 8,
      name: 'Lenovo ThinkPad',
      category: 'laptops',
      price: 849,
      originalPrice: 999,
      image: 'https://via.placeholder.com/300x200?text=Lenovo+ThinkPad',
      rating: 4.5,
      reviews: 156,
      stock: 20,
      discount: 15,
      description: 'Business laptop with reliability and performance',
    },
  ];

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  const handleAddToCart = (productId) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setCartCount(cartCount + 1);
  };

  const toggleFavorite = (productId) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <Box className="hero-banner">
        <Container>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2, color: '#fff' }}>
              Welcome to TechStore
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, color: '#f0f0f0' }}>
              Discover the Latest Technology Products at Unbeatable Prices
            </Typography>
            {!isLoggedIn && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/signup')}
                  sx={{ bgcolor: '#fff', color: '#2c3e50', '&:hover': { bgcolor: '#ecf0f1' } }}
                >
                  Sign Up
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{ borderColor: '#fff', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                  Sign In
                </Button>
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      <Container sx={{ py: 6 }}>
        {/* Filters and Search */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                variant="outlined"
                size="small"
              >
                <MenuItem value="popularity">Popularity</MenuItem>
                <MenuItem value="price-low">Price: Low to High</MenuItem>
                <MenuItem value="price-high">Price: High to Low</MenuItem>
                <MenuItem value="rating">Best Rating</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                variant="outlined"
                size="small"
              >
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.value}>{cat.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Typography variant="body2" color="textSecondary">
            Showing {filteredAndSortedProducts.length} products
          </Typography>
        </Paper>

        {/* Products Grid */}
        {filteredAndSortedProducts.length > 0 ? (
          <Grid container spacing={3}>
            {filteredAndSortedProducts.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 } }}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={product.image}
                      alt={product.name}
                    />
                    {product.discount > 0 && (
                      <Chip
                        label={`-${product.discount}%`}
                        color="error"
                        sx={{ position: 'absolute', top: 10, right: 10 }}
                      />
                    )}
                    <Button
                      size="small"
                      onClick={() => toggleFavorite(product.id)}
                      sx={{ position: 'absolute', top: 10, left: 10, bgcolor: 'rgba(255,255,255,0.9)' }}
                    >
                      {favorites.includes(product.id) ? (
                        <Favorite sx={{ color: '#e74c3c' }} />
                      ) : (
                        <FavoriteBorder />
                      )}
                    </Button>
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {product.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Rating value={product.rating} readOnly size="small" />
                      <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                        ({product.reviews})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#27ae60' }}>
                        ${product.price}
                      </Typography>
                      {product.originalPrice > product.price && (
                        <Typography variant="body2" sx={{ textDecoration: 'line-through', color: '#7f8c8d' }}>
                          ${product.originalPrice}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" color={product.stock > 5 ? '#27ae60' : '#e74c3c'}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ShoppingCart />}
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock === 0}
                      sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}
                    >
                      Add to Cart
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="textSecondary">
              No products found matching your criteria
            </Typography>
          </Box>
        )}
      </Container>
    </div>
  );
};

export default HomePage;
