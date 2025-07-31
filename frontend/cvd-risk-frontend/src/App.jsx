import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import BatchPredict from './pages/BatchPredict';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6a11cb',
    },
    secondary: {
      main: '#2575fc',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppProvider>
          <AuthProvider>
            <ChatProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/predict" element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor']}>
                    <Predict />
                  </ProtectedRoute>
                } />
                <Route path="/batch-predict" element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <BatchPredict />
                  </ProtectedRoute>
                } />
                <Route path="/chat" element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor']}>
                    <Chat />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor']}>
                    <Profile />
                  </ProtectedRoute>
                } />
              </Routes>
            </ChatProvider>
          </AuthProvider>
        </AppProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;