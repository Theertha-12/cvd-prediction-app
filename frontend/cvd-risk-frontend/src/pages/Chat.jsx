import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import DashboardLayout from '../layouts/DashboardLayout';
import ChatInterface from '../components/chat/ChatInterface';
import { MessageSquare, Plus, RotateCcw } from 'lucide-react';
import { generateSessionId, isValidSessionId } from '../utils/helpers';
import { createNewChatSession, getUserChatSessions } from '../services/chat';

const Chat = () => {
  const { user } = useAuth();
  const { 
    chatHistory, 
    addToChatHistory, 
    getChatHistory, 
    clearChatHistory 
  } = useAppContext();
  const { 
    setCurrentPrediction, 
    currentPrediction 
  } = useChat();
  
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoized function to create new session
  const createNewSession = useCallback(async () => {
    try {
      const sessionName = `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      const newSession = await createNewChatSession(sessionName);
      
      if (newSession && newSession.session_id) {
        setCurrentSessionId(newSession.session_id);
        localStorage.setItem('activeSessionId', newSession.session_id);
        setSessions(prev => [newSession, ...prev]);
        return newSession.session_id;
      } else {
        throw new Error('Invalid session response');
      }
    } catch (error) {
      console.error('Failed to create new session:', error);
      // Fallback to local session
      const fallbackSessionId = generateSessionId();
      setCurrentSessionId(fallbackSessionId);
      localStorage.setItem('activeSessionId', fallbackSessionId);
      setError('Using offline mode. Messages may not be saved.');
      return fallbackSessionId;
    }
  }, []);

  // Memoized initialization function
  const initializeChat = useCallback(async () => {
    if (isInitialized) return; // Prevent multiple initializations
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to load existing sessions first
      const userSessions = await getUserChatSessions();
      setSessions(userSessions || []);

      // Check if we have a stored active session
      const storedSessionId = localStorage.getItem('activeSessionId');
      if (storedSessionId && isValidSessionId(storedSessionId)) {
        // Verify session still exists on server
        const sessionExists = userSessions?.some(s => s.session_id === storedSessionId);
        if (sessionExists) {
          setCurrentSessionId(storedSessionId);
          setIsInitialized(true);
          return;
        }
      }

      // If user has existing sessions, use the most recent one
      if (userSessions && userSessions.length > 0) {
        const mostRecent = userSessions[0];
        if (isValidSessionId(mostRecent.session_id)) {
          setCurrentSessionId(mostRecent.session_id);
          localStorage.setItem('activeSessionId', mostRecent.session_id);
        } else {
          // Invalid session ID, create new one
          await createNewSession();
        }
      } else {
        // No existing sessions, create a new one
        await createNewSession();
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize chat sessions:', error);
      // Fallback: create a local session ID
      const fallbackSessionId = generateSessionId();
      setCurrentSessionId(fallbackSessionId);
      localStorage.setItem('activeSessionId', fallbackSessionId);
      setError('Using offline mode. Some features may be limited.');
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, createNewSession]);

  // Initialize chat session when component mounts - ONLY ONCE
  useEffect(() => {
    if (!isInitialized) {
      initializeChat();
    }
  }, [initializeChat, isInitialized]);

  // ENHANCED: Complete reset when starting new chat
  const handleNewChat = useCallback(async () => {
    try {
      // 1. Clear current prediction context (resets selected patient from batch)
      setCurrentPrediction(null);
      
      // 2. Clear current session history
      if (currentSessionId) {
        clearChatHistory(currentSessionId);
      }
      
      // 3. Create completely new session
      await createNewSession();
      
      // 4. Show success feedback
      console.log('✅ New chat started - all context cleared');
      
    } catch (error) {
      console.error('Error starting new chat:', error);
      setError('Failed to start new chat. Please try again.');
    }
  }, [currentSessionId, setCurrentPrediction, clearChatHistory, createNewSession]);

  // ENHANCED: Reset everything including selected patient
  const handleResetEverything = useCallback(() => {
    // Clear all chat history
    clearChatHistory();
    
    // Clear current prediction context
    setCurrentPrediction(null);
    
    // Clear stored session
    localStorage.removeItem('activeSessionId');
    
    // Reset initialization flag and reinitialize
    setIsInitialized(false);
    setCurrentSessionId(null);
    initializeChat();
  }, [clearChatHistory, setCurrentPrediction, initializeChat]);

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state if no session ID could be created
  if (!currentSessionId && isInitialized) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Initialize Chat</h3>
            <p className="text-gray-600 mb-4">There was a problem setting up your chat session.</p>
            <button
              onClick={() => {
                setIsInitialized(false);
                initializeChat();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Health Assistant</h1>
              <p className="mt-2 text-lg text-gray-600">
                Get personalized advice about your cardiovascular health
              </p>
              
              {/* Show current context */}
              {currentPrediction && user?.role === 'doctor' && (
                <div className="mt-2 text-sm bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <span className="text-blue-800 font-medium">
                    💬 Discussing: {currentPrediction.patientId || 'Selected Patient'} 
                    ({currentPrediction.riskCategory} Risk - {Math.round((currentPrediction.riskScore || 0) * 100)}%)
                  </span>
                </div>
              )}
              
              {error && (
                <p className="mt-1 text-sm text-orange-600">
                  {error}
                </p>
              )}
            </div>
          </div>
          
          {/* Enhanced action buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleNewChat}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
              title="Start new chat (clears current conversation and patient selection)"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
            
            {/* Reset everything button for doctors */}
            {user?.role === 'doctor' && (
              <button
                onClick={handleResetEverything}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center space-x-2"
                title="Reset everything (clears all chats and patient selections)"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All</span>
              </button>
            )}
          </div>
        </div>
                
        <div className="bg-white rounded-xl shadow-lg">
          {currentSessionId && (
            <ChatInterface 
              sessionId={currentSessionId} 
              onNewChat={handleNewChat}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Chat;