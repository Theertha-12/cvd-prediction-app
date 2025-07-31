// src/components/auth/RegisterForm.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Container, Box, Typography, TextField, Button,
  CircularProgress, MenuItem, FormControl, InputLabel, Select
} from "@mui/material";
import { styled } from "@mui/system";
import { Link } from "react-router-dom"; 

const FormContainer = styled(Container)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
}));

const StyledBox = styled(Box)(({ theme }) => ({
  background: "#fff",
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[5],
  width: "100%",
  maxWidth: "400px",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const StyledTextField = styled(TextField)({
  '& .MuiInputBase-input': { color: '#333' },
  '& .MuiInputLabel-root': { color: '#666' },
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: '#bbb' },
    '&:hover fieldset': { borderColor: '#6a11cb' },
    '&.Mui-focused fieldset': { borderColor: '#2575fc' },
  },
});

const GradientButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
  color: "white", height: 48, marginTop: theme.spacing(2),
}));

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: "", full_name: "", password: "", confirmPassword: "", role: "patient"
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, login } = useAuth(); // ✅ also login after registration
  const navigate = useNavigate();

  const validateEmail = (email) =>
    String(email).toLowerCase().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const { email, full_name, password, confirmPassword, role } = formData;
    const newErrors = {};

    if (!email || !validateEmail(email)) newErrors.email = "Valid email required";
    if (!full_name || full_name.length < 3) newErrors.full_name = "Full name too short";
    if (!password || password.length < 8) newErrors.password = "Password must be 8+ chars";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await register({ email, full_name, password, role });
      await login(email, password); // ✅ Auto-login
      navigate("/dashboard");
    } catch (error) {
      let errorMessage = "Registration failed. Please try again.";
      const detail = error.response?.data?.detail;

      if (typeof detail === "string") errorMessage = detail;
      else if (Array.isArray(detail)) errorMessage = detail[0]?.msg;
      else if (detail?.msg) errorMessage = detail.msg;
      else if (error.message) errorMessage = error.message;

      setErrors({ api: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer maxWidth="sm">
      <StyledBox>
        <Typography variant="h4" align="center" color="primary">Register</Typography>
        <form onSubmit={handleSubmit}>
          <StyledTextField label="Email" name="email" value={formData.email}
            onChange={handleChange} fullWidth margin="normal"
            error={!!errors.email} helperText={errors.email} required />
          <StyledTextField label="Full Name" name="full_name" value={formData.full_name}
            onChange={handleChange} fullWidth margin="normal"
            error={!!errors.full_name} helperText={errors.full_name} required />
          <StyledTextField label="Password" name="password" type="password"
            value={formData.password} onChange={handleChange} fullWidth margin="normal"
            error={!!errors.password} helperText={errors.password} required />
          <StyledTextField label="Confirm Password" name="confirmPassword" type="password"
            value={formData.confirmPassword} onChange={handleChange} fullWidth margin="normal"
            error={!!errors.confirmPassword} helperText={errors.confirmPassword} required />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select name="role" value={formData.role} label="Role" onChange={handleChange}>
              <MenuItem value="patient">Patient</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
            </Select>
          </FormControl>
          {errors.api && (
            <Typography color="error" align="center" variant="body2">{errors.api}</Typography>
          )}
          <GradientButton type="submit" fullWidth disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : "Register"}
          </GradientButton>
        </form>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#2575fc", textDecoration: "none" }}>
            Login
          </Link>
        </Typography>
      </StyledBox>
    </FormContainer>
  );
};

export default RegisterForm;





