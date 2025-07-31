import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { useAppContext } from './AppContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { addToChatHistory, getChatHistory, clearChatHistory } = useAppContext();
  
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [errorSessions, setErrorSessions] = useState(null);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState([]);

  const fetchSessions = useCallback(async () => {
    if (!isAuthenticated) {
      setSessions([]);
      setLoadingSessions(false);
      setErrorSessions("Not authenticated.");
      return;
    }

    setLoadingSessions(true);
    setErrorSessions(null);
    try {
      const response = await api.get('/chat/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      setErrorSessions(error.response?.data?.detail || 'Failed to load chat sessions.');
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Load conversation when active session changes
  useEffect(() => {
    if (activeSessionId) {
      const savedConversation = getChatHistory(activeSessionId);
      setCurrentConversation(savedConversation);
    } else {
      setCurrentConversation([]);
    }
  }, [activeSessionId, getChatHistory]);

  const createSession = useCallback(async (title) => {
    if (!isAuthenticated) {
      setErrorSessions("Not authenticated. Cannot create session.");
      throw new Error("Not authenticated.");
    }
    try {
      const response = await api.post('/chat/sessions', { title });
      setSessions((prevSessions) => [...prevSessions, response.data]);
      return response.data;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      setErrorSessions(error.response?.data?.detail || 'Failed to create chat session.');
      throw error;
    }
  }, [isAuthenticated]);

  // Enhanced message handling with persistence
  const addMessage = useCallback((message) => {
    const messageWithId = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...message
    };

    setCurrentConversation(prev => [...prev, messageWithId]);
    
    // Persist to AppContext
    if (activeSessionId) {
      addToChatHistory(activeSessionId, messageWithId);
    }
    
    return messageWithId;
  }, [activeSessionId, addToChatHistory]);

  const sendMessage = useCallback(async (message, sessionId) => {
    if (!isAuthenticated || !sessionId) {
      throw new Error("Not authenticated or no session selected.");
    }

    try {
      // Add user message to conversation
      const userMessage = addMessage({
        role: 'user',
        content: message,
        sessionId
      });

      // Make API call to get response
      const response = await api.post(`/chat/sessions/${sessionId}/messages`, {
        message,
        prediction_context: currentPrediction
      });

      // Add assistant response to conversation
      const assistantMessage = addMessage({
        role: 'assistant',
        content: response.data.response,
        sessionId,
        metadata: response.data.metadata || {}
      });

      return { userMessage, assistantMessage };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [isAuthenticated, currentPrediction, addMessage]);

  const switchSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId);
  }, []);

  const clearCurrentSession = useCallback(() => {
    if (activeSessionId) {
      clearChatHistory(activeSessionId);
      setCurrentConversation([]);
    }
  }, [activeSessionId, clearChatHistory]);

  const deleteSession = useCallback(async (sessionId) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated.");
    }

    try {
      await api.delete(`/chat/sessions/${sessionId}`);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // Clear from local storage
      clearChatHistory(sessionId);
      
      // If this was the active session, clear it
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setCurrentConversation([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }, [isAuthenticated, activeSessionId, clearChatHistory]);

  const getSessionHistory = useCallback(async (sessionId) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated.");
    }

    try {
      const response = await api.get(`/chat/sessions/${sessionId}/messages`);
      
      // Update local storage with server data
      const messages = response.data.messages || [];
      messages.forEach(message => {
        addToChatHistory(sessionId, message);
      });
      
      return messages;
    } catch (error) {
      console.error('Failed to fetch session history:', error);
      // Fallback to local storage
      return getChatHistory(sessionId);
    }
  }, [isAuthenticated, addToChatHistory, getChatHistory]);

  const value = {
    // Existing functionality
    sessions,
    loadingSessions,
    errorSessions,
    fetchSessions,
    createSession,
    currentPrediction,
    setCurrentPrediction,
    
    // Enhanced functionality
    activeSessionId,
    currentConversation,
    switchSession,
    addMessage,
    sendMessage,
    clearCurrentSession,
    deleteSession,
    getSessionHistory
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};