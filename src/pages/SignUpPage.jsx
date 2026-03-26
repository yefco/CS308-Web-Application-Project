import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
  Checkbox,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person, LocationOn, Phone } from '@mui/icons-material';
import '../styles/AuthPages.css';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    taxId: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
    }

    return newErrors;
  };

  const getPasswordStrength = () => {
    let strength = 0;
    if (formData.password.length >= 8) strength += 25;
    if (formData.password.length >= 12) strength += 25;
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) strength += 25;
    if (/(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password)) strength += 25;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setGeneralError('');

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      console.log('Sign up attempt:', formData);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userData', JSON.stringify(formData));
      navigate('/');
    }, 1500);
  };

  const passwordStrength = getPasswordStrength();
  const passwordStrengthColor = passwordStrength < 50 ? 'error' : passwordStrength < 75 ? 'warning' : 'success';

  return (
    <Box className="auth-page">
      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh', py: 4 }}>
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
              Create Account
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Join TechStore and start shopping
            </Typography>
          </Box>

          {generalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {generalError}
            </Alert>
          )}

          {/* Sign Up Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {/* Full Name */}
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={!!errors.fullName}
              helperText={errors.fullName}
              variant="outlined"
              margin="normal"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#3498db', mr: 1 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Email */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
              margin="normal"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#3498db', mr: 1 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Phone */}
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              variant="outlined"
              margin="normal"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone sx={{ color: '#3498db', mr: 1 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Address */}
            <TextField
              fullWidth
              label="Home Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={!!errors.address}
              helperText={errors.address}
              variant="outlined"
              margin="normal"
              multiline
              rows={2}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn sx={{ color: '#3498db', mr: 1 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Tax ID */}
            <TextField
              fullWidth
              label="Tax ID (Optional)"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              variant="outlined"
              margin="normal"
              disabled={loading}
              helperText="For business purposes"
            />

            {/* Password */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              variant="outlined"
              margin="normal"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#3498db', mr: 1 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={loading}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Password Strength Indicator */}
            {formData.password && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Password Strength
                  </Typography>
                  <Typography variant="body2" color={passwordStrengthColor}>
                    {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Medium' : 'Strong'}
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={passwordStrength} color={passwordStrengthColor} />
              </Box>
            )}

            {/* Confirm Password */}
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              variant="outlined"
              margin="normal"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#3498db', mr: 1 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" disabled={loading}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Terms and Conditions */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (errors.agreeTerms) setErrors({ ...errors, agreeTerms: '' });
                  }}
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <span style={{ color: '#3498db', cursor: 'pointer' }}>
                    Terms and Conditions
                  </span>{' '}
                  and{' '}
                  <span style={{ color: '#3498db', cursor: 'pointer' }}>
                    Privacy Policy
                  </span>
                </Typography>
              }
              sx={{ mt: 2, mb: 1 }}
            />
            {errors.agreeTerms && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                {errors.agreeTerms}
              </Typography>
            )}

            {/* Sign Up Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                bgcolor: '#27ae60',
                '&:hover': { bgcolor: '#229954' },
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Sign In Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#3498db', textDecoration: 'none', fontWeight: 'bold' }}>
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>

          {/* Info Box */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              Your password must be at least 8 characters and contain uppercase, lowercase, and numbers.
            </Typography>
          </Alert>
        </Paper>
      </Container>
    </Box>
  );
};

export default SignUpPage;
