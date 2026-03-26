import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import '../styles/AuthPages.css';

const LoginPage = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setGeneralError('Invalid email or password. Please try again.');
        } else {
          setGeneralError(data.message || 'Login failed. Please try again.');
        }
        return;
      }

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));

      if (onLoginSuccess) onLoginSuccess();
      navigate('/');
    } catch (err) {
      setGeneralError('Network error. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box className="auth-page">
      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ width: '100%', p: 4, borderRadius: 2 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                color: '#2c3e50',
                mb: 2,
              }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Sign in to your TechStore account
            </Typography>
          </Box>

          {generalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {generalError}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {/* Email Field */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#3498db', mr: 1 }} />
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              error={!!errors.password}
              helperText={errors.password}
              variant="outlined"
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#3498db', mr: 1 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />

            {/* Forgot Password */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', my: 2 }}>
              <MuiLink
                component="button"
                variant="body2"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                Forgot Password?
              </MuiLink>
            </Box>

            {/* Sign In Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                bgcolor: '#3498db',
                '&:hover': { bgcolor: '#2980b9' },
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Divider */}
            <Box sx={{ position: 'relative', my: 3 }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '1px',
                  bgcolor: '#ecf0f1',
                  transform: 'translateY(-50%)',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  position: 'relative',
                  bgcolor: '#fff',
                  display: 'inline-block',
                  px: 2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#7f8c8d',
                }}
              >
                Don't have an account?
              </Typography>
            </Box>

            {/* Sign Up Link */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              component={Link}
              to="/signup"
              disabled={loading}
              sx={{
                borderColor: '#3498db',
                color: '#3498db',
                '&:hover': {
                  borderColor: '#2980b9',
                  bgcolor: 'rgba(52, 152, 219, 0.05)',
                },
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              Create Account
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
