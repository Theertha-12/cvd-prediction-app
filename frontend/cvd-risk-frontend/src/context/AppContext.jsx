import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentChat, setCurrentChat] = useState([]);
  const [predictionData, setPredictionData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  
  // ENHANCED: Batch results persistence with better integration  
  const [batchResults, setBatchResults] = useState(null);
  const [batchFileName, setBatchFileName] = useState('');
  
  // ENHANCED: Complete chat history management with session support
  const [chatHistory, setChatHistory] = useState({}); // Store all conversations by session
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const navigate = useNavigate();

  // CRITICAL FIX: Get user-specific localStorage keys
  const getUserSpecificKey = (key) => {
    const userId = localStorage.getItem('current_user_id');
    return userId ? `${key}_user_${userId}` : key;
  };

  // CRITICAL FIX: Clear all data for current user
  const clearUserSpecificData = () => {
    const userId = localStorage.getItem('current_user_id');
    if (!userId) return;

    // Remove user-specific keys
    const keysToRemove = [
      `currentChat_user_${userId}`,
      `predictionData_user_${userId}`,
      `dashboardData_user_${userId}`,
      `batchResults_user_${userId}`,
      `batchFileName_user_${userId}`,
      `chatHistory_user_${userId}`,
      `activeSessionId_user_${userId}`
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(`🗑️ Cleared user-specific data for user ${userId}`);
  };

  // CRITICAL FIX: Clear ALL user data (for switching users)
  const clearAllUserData = () => {
    console.log('🗑️ Clearing ALL user data...');
    
    // Clear current state
    setCurrentChat([]);
    setPredictionData(null);
    setDashboardData(null);
    setBatchResults(null);
    setBatchFileName('');
    setChatHistory({});
    setActiveSessionId(null);

    // Remove all possible user-specific keys
    const allKeys = Object.keys(localStorage);
    const userDataKeys = allKeys.filter(key => 
      key.includes('currentChat_') || 
      key.includes('predictionData_') || 
      key.includes('dashboardData_') || 
      key.includes('batchResults_') || 
      key.includes('batchFileName_') || 
      key.includes('chatHistory_') || 
      key.includes('activeSessionId_')
    );

    userDataKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Also remove non-user-specific keys (fallback)
    [
      'currentChat',
      'predictionData', 
      'dashboardData',
      'batchResults',
      'batchFileName',
      'chatHistory',
      'activeSessionId'
    ].forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('✅ All user data cleared');
  };

  // ENHANCED: Initialize from localStorage with user-specific keys
  useEffect(() => {
    try {
      const userId = localStorage.getItem('current_user_id');
      if (!userId) {
        console.log('ℹ️ No user ID found, skipping data load');
        return;
      }

      console.log(`📂 Loading data for user ${userId}...`);

      // Load user-specific data
      const savedChat = localStorage.getItem(getUserSpecificKey('currentChat'));
      const savedPrediction = localStorage.getItem(getUserSpecificKey('predictionData'));
      const savedDashboard = localStorage.getItem(getUserSpecificKey('dashboardData'));
      const savedBatchResults = localStorage.getItem(getUserSpecificKey('batchResults'));
      const savedBatchFileName = localStorage.getItem(getUserSpecificKey('batchFileName'));
      const savedChatHistory = localStorage.getItem(getUserSpecificKey('chatHistory'));
      const savedActiveSession = localStorage.getItem(getUserSpecificKey('activeSessionId'));

      if (savedChat) {
        const parsedChat = JSON.parse(savedChat);
        if (Array.isArray(parsedChat)) setCurrentChat(parsedChat);
      }
      
      if (savedPrediction) {
        const parsedPrediction = JSON.parse(savedPrediction);
        setPredictionData(parsedPrediction);
      }
      
      if (savedDashboard) {
        const parsedDashboard = JSON.parse(savedDashboard);  
        setDashboardData(parsedDashboard);
      }
      
      if (savedBatchResults) {
        const parsedBatchResults = JSON.parse(savedBatchResults);
        if (Array.isArray(parsedBatchResults)) setBatchResults(parsedBatchResults);
      }
      
      if (savedBatchFileName) setBatchFileName(savedBatchFileName);
      
      if (savedChatHistory) {
        const parsedHistory = JSON.parse(savedChatHistory);
        if (typeof parsedHistory === 'object') setChatHistory(parsedHistory);
      }
      
      if (savedActiveSession) setActiveSessionId(savedActiveSession);

      console.log(`✅ User-specific data loaded for user ${userId}`);
    } catch (error) {
      console.error('Error loading saved data:', error);
      // Clear corrupted data
      clearAllUserData();
    }
  }, []); // Only run once on mount

  // ENHANCED: Auto-save with user-specific keys and debouncing
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (currentChat.length > 0) {
        localStorage.setItem(getUserSpecificKey('currentChat'), JSON.stringify(currentChat));
      }
    }, 500);
    
    return () => clearTimeout(saveTimeout);
  }, [currentChat]);

  useEffect(() => {
    if (predictionData) {
      localStorage.setItem(getUserSpecificKey('predictionData'), JSON.stringify(predictionData));
    }
  }, [predictionData]);

  useEffect(() => {
    if (dashboardData) {
      localStorage.setItem(getUserSpecificKey('dashboardData'), JSON.stringify(dashboardData));
    }
  }, [dashboardData]);

  useEffect(() => {
    if (batchResults && Array.isArray(batchResults) && batchResults.length > 0) {
      localStorage.setItem(getUserSpecificKey('batchResults'), JSON.stringify(batchResults));
    } else {
      localStorage.removeItem(getUserSpecificKey('batchResults'));
    }
  }, [batchResults]);

  useEffect(() => {
    if (batchFileName && batchFileName.trim()) {
      localStorage.setItem(getUserSpecificKey('batchFileName'), batchFileName);
    } else {
      localStorage.removeItem(getUserSpecificKey('batchFileName'));
    }
  }, [batchFileName]);

  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (Object.keys(chatHistory).length > 0) {
        localStorage.setItem(getUserSpecificKey('chatHistory'), JSON.stringify(chatHistory));
      }
    }, 500);
    
    return () => clearTimeout(saveTimeout);
  }, [chatHistory]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(getUserSpecificKey('activeSessionId'), activeSessionId);
    } else {
      localStorage.removeItem(getUserSpecificKey('activeSessionId'));
    }
  }, [activeSessionId]);

  // ENHANCED: Chat management with better session handling
  const addToChatHistory = (sessionId, message) => {
    if (!sessionId || !message) return;
    
    setChatHistory(prev => {
      const sessionMessages = prev[sessionId] || [];
      
      // Prevent duplicates based on message content and timestamp
      const isDuplicate = sessionMessages.some(msg => 
        msg.message === message.message && 
        msg.source === message.source &&
        Math.abs(new Date(msg.created_at) - new Date(message.created_at)) < 1000 // Within 1 second
      );
      
      if (isDuplicate) return prev;
      
      return {
        ...prev,
        [sessionId]: [...sessionMessages, {
          ...message,
          id: message.id || Date.now() + Math.random(),
          timestamp: message.created_at || new Date().toISOString()
        }]
      };
    });
  };

  const getChatHistory = (sessionId) => {
    if (!sessionId) return [];
    return chatHistory[sessionId] || [];
  };

  const clearChatHistory = (sessionId = null) => {
    if (sessionId) {
      setChatHistory(prev => {
        const newHistory = { ...prev };
        delete newHistory[sessionId];
        return newHistory;
      });
    } else {
      // Clear all chat history
      setChatHistory({});
      localStorage.removeItem(getUserSpecificKey('chatHistory'));
      console.log('🗑️ All chat history cleared');
    }
  };

  // ENHANCED: Batch results management with dashboard integration
  const setBatchPredictionResults = (results, fileName = '') => {
    if (!Array.isArray(results)) {
      console.error('Batch results must be an array');
      return;
    }
    
    setBatchResults(results);
    setBatchFileName(fileName);
    
    console.log(`📊 Batch results saved: ${results.length} patients from ${fileName}`);
    
    // Trigger dashboard refresh by clearing cached data
    setDashboardData(prev => prev ? { ...prev, _refreshNeeded: true } : null);
  };

  const clearBatchResults = () => {
    setBatchResults(null);
    setBatchFileName('');
    
    // Remove from localStorage
    localStorage.removeItem(getUserSpecificKey('batchResults'));
    localStorage.removeItem(getUserSpecificKey('batchFileName'));
    
    // Trigger dashboard refresh
    setDashboardData(prev => prev ? { ...prev, _refreshNeeded: true } : null);
    
    console.log('🗑️ Batch results cleared');
  };

  // Session management
  const setActiveSession = (sessionId) => {
    setActiveSessionId(sessionId);
  };

  const getActiveSession = () => {
    return activeSessionId;
  };

  // CRITICAL FIX: Reset functions now use user-specific keys
  const resetChat = () => {
    setCurrentChat([]);
    localStorage.removeItem(getUserSpecificKey('currentChat'));
  };

  const resetPrediction = () => {
    setPredictionData(null);
    localStorage.removeItem(getUserSpecificKey('predictionData'));
  };

  const resetDashboard = () => {
    setDashboardData(null);
    localStorage.removeItem(getUserSpecificKey('dashboardData'));
  };

  // ENHANCED: Complete logout with thorough cleanup
  const logout = () => {
    console.log('🚪 Logging out and clearing all app data...');
    
    // Clear user-specific data
    clearUserSpecificData();
    
    // Clear app state
    setCurrentChat([]);
    setPredictionData(null);
    setDashboardData(null);
    setBatchResults(null);
    setBatchFileName('');
    setChatHistory({});
    setActiveSessionId(null);
    
    // Clear auth-related storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('current_user_id');
    
    // Clear any other app-specific keys
    ['currentPrediction', 'selectedPatient', 'chatSettings'].forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Navigate with error handling
    try {
      navigate('/login');
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/login';
    }
  };

  // ENHANCED: Get dashboard statistics including batch data
  const getDashboardStats = () => {
    const stats = {
      totalPredictions: 0,
      totalPatients: 0,
      batchAnalyses: 0,
      chatSessions: Object.keys(chatHistory).length,
      totalMessages: Object.values(chatHistory).reduce((total, messages) => total + messages.length, 0)
    };

    // Add batch results to stats
    if (batchResults && Array.isArray(batchResults)) {
      stats.batchAnalyses = 1;
      stats.totalPatients += batchResults.length;
      stats.totalPredictions += batchResults.length;
    }

    return stats;
  };

  const contextValue = {
    // Existing functionality
    currentChat,
    setCurrentChat,
    predictionData,
    setPredictionData,
    dashboardData,
    setDashboardData,
    resetChat,
    resetPrediction,
    resetDashboard,
    logout,
    
    // ENHANCED: Batch functionality with dashboard integration
    batchResults,
    batchFileName,
    setBatchPredictionResults,
    clearBatchResults,
    
    // ENHANCED: Chat functionality with session management
    chatHistory,
    addToChatHistory,
    getChatHistory,
    clearChatHistory,
    activeSessionId,
    setActiveSession,
    getActiveSession,
    
    // CRITICAL FIX: New functions for user data management
    clearAllUserData,
    clearUserSpecificData,
    
    // Additional utilities
    getDashboardStats
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};