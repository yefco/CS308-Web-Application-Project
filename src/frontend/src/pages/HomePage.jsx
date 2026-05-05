import React, { useState, useEffect } from 'react';
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
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ShoppingCart, FavoriteBorder, Favorite, RateReview } from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import RatingsModal from '../components/RatingsModal';
import ProductDetailModal from '../components/ProductDetailModal';
import '../styles/HomePage.css';

// Fallback images by product name
const PRODUCT_IMAGES = {
  'MacBook Pro 14"': 'https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111902_mbp14-silver2.png',
  'iPhone 15 Pro': 'https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-15-pro-max.png',
  'iPad Air': 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-finish-select-gallery-202405-13inch-blue-wifi?wid=5120&hei=2880&fmt=p-jpg&qlt=80&sp=yes&strip=yes&trim&ex=536&ey=402&align=center&resizesource&unsharp=1.5x1+0.7+0.02&cox=0&coy=0&cdx=536&cdy=402',
  'AirPods Pro': 'https://productimages.hepsiburada.net/s/337/375-375/110000088116931.jpg',
  'Dell XPS 13': 'https://m.media-amazon.com/images/I/710EGJBdIML._AC_UF894,1000_QL80_.jpg',
  'Samsung Galaxy S24': 'https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MMS_135895764?x=536&y=402&format=jpg&quality=80&sp=yes&strip=yes&trim&ex=536&ey=402&align=center&resizesource&unsharp=1.5x1+0.7+0.02&cox=0&coy=0&cdx=536&cdy=402',
  'Magic Keyboard': 'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/148699-1_large.jpg',
  'Lenovo ThinkPad': 'https://p1-ofp.static.pub/fes/cms/2023/02/13/5tlm0hunv3l71hzse5hlxsafgw4aw0954514.png',
};

const HomePage = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [products, setProducts] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const [ratingsModalOpen, setRatingsModalOpen] = useState(false);
  const [selectedProductForRating, setSelectedProductForRating] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);

  const fetchReviewsForProducts = async (productList) => {
    const reviewResults = await Promise.all(
      productList.map(p =>
        fetch(`/api/products/${p.id}/ratings`)
          .then(r => r.json())
          .catch(() => ({ average_rating: 0, total_reviews: 0 }))
      )
    );
    return productList.map((p, i) => ({
      ...p,
      rating: reviewResults[i].average_rating || 0,
      reviews: reviewResults[i].total_reviews || 0,
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        const rawProducts = Array.isArray(productsData) ? productsData : (productsData.products ?? []);
        const rawCategories = Array.isArray(categoriesData) ? categoriesData : (categoriesData.categories ?? []);

        setApiCategories(rawCategories);

        const mapped = rawProducts.map(p => ({
          id: p.product_id,
          name: p.product_name,
          category: rawCategories.find(c => c.category_id === p.category_id)?.category_name ?? '',
          price: parseFloat(p.price),
          originalPrice: parseFloat(p.price),
          image: PRODUCT_IMAGES[p.product_name] || null,
          rating: 0,
          reviews: 0,
          stock: p.stock_quantity,
          discount: 0,
          description: p.description ?? '',
        }));

        const withReviews = await fetchReviewsForProducts(mapped);
        setProducts(withReviews);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = [
    { id: 0, name: 'All Products', value: 'all' },
    ...apiCategories.map(c => ({ id: c.category_id, name: c.category_name, value: c.category_name })),
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

  const handleAddToCart = (product) => {
    addItem(product, 1);
    setSnackbarMessage(`${product.name} added to cart!`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const toggleFavorite = (productId) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  const handleOpenRatingsModal = (product) => {
    setSelectedProductForRating(product);
    setRatingsModalOpen(true);
  };

  const handleCloseRatingsModal = () => {
    setRatingsModalOpen(false);
    setSelectedProductForRating(null);
  };

  const handleOpenDetail = (product) => {
    setSelectedProductForDetail(product);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedProductForDetail(null);
  };

  const handleRatingSuccess = async () => {
    setSnackbarMessage('Thank you for your rating!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    if (selectedProductForRating) {
      try {
        const res = await fetch(`/api/products/${selectedProductForRating.id}/ratings`);
        const data = await res.json();
        setProducts(prev =>
          prev.map(p =>
            p.id === selectedProductForRating.id
              ? { ...p, rating: data.average_rating || 0, reviews: data.total_reviews || 0 }
              : p
          )
        );
      } catch {
        // ignore refresh error
      }
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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredAndSortedProducts.length > 0 ? (
          <Grid container spacing={3}>
            {filteredAndSortedProducts.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card sx={{ height: '500px', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 }, cursor: 'pointer' }}>
                  <Box sx={{ position: 'relative' }} onClick={() => handleOpenDetail(product)}>
                    <div className="product-image-container">
                      {product.image && !imageErrors[product.id] ? (
                        <CardMedia
                          component="img"
                          image={product.image}
                          alt={product.name}
                          sx={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain' }}
                          onError={() => setImageErrors(prev => ({ ...prev, [product.id]: true }))}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#bbb' }}>
                          <Typography variant="caption" color="textSecondary">No Image</Typography>
                        </Box>
                      )}
                    </div>
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
                  <CardContent sx={{ flexGrow: 1 }} onClick={() => handleOpenDetail(product)}>
                    <Typography gutterBottom variant="h6" component="h3" sx={{ fontWeight: 'bold', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '3.5rem' }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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
                        ${product.price.toFixed(2)}
                      </Typography>
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
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}
                    >
                      Add to Cart
                    </Button>
                  </CardActions>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<RateReview />}
                      onClick={() => handleOpenRatingsModal(product)}
                      sx={{ color: '#27ae60', borderColor: '#27ae60', '&:hover': { bgcolor: '#f0f8f4' } }}
                    >
                      Rate & Review
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

      {/* Product Detail Modal */}
      <ProductDetailModal
        open={detailModalOpen}
        product={selectedProductForDetail}
        onClose={handleCloseDetail}
        onOpenRatings={handleOpenRatingsModal}
        isLoggedIn={isLoggedIn}
      />

      {/* Ratings Modal */}
      {selectedProductForRating && (
        <RatingsModal
          open={ratingsModalOpen}
          productId={selectedProductForRating.id}
          productName={selectedProductForRating.name}
          onClose={handleCloseRatingsModal}
          onSuccess={handleRatingSuccess}
          isLoggedIn={isLoggedIn}
        />
      )}

      {/* Snackbar for cart feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default HomePage;
