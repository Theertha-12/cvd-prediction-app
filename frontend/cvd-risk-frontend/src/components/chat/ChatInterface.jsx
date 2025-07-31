import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useAppContext } from '../../context/AppContext';
import MessageBubble from './MessageBubble';
import { sendChatMessage, getChatHistory } from '../../services/chat';
import { PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import PatientChatMenu from './PatientChatMenu';
import DoctorChatMenu from './DoctorChatMenu';
import { isValidSessionId } from '../../utils/helpers';

const ChatInterface = ({ sessionId, onNewChat }) => {
  const { user } = useAuth();
  const { currentPrediction } = useChat();
  const { 
    getChatHistory: getStoredHistory,
    addToChatHistory: saveToHistory,
    clearChatHistory: clearStoredHistory
  } = useAppContext();
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sessionError, setSessionError] = useState(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  // Enhanced helper function to prevent duplicate messages across navigation
  const mergeHistories = useCallback((local, server) => {
    const allMessages = [...(local || []), ...(server || [])];
    const uniqueMessages = [];
    const seenMessages = new Set();
    
    // Create more specific unique keys to prevent duplicates
    allMessages.forEach(msg => {
      // Use message content + source + timestamp (rounded to nearest second) for deduplication
      const timestamp = Math.floor(new Date(msg.created_at).getTime() / 1000);
      const uniqueKey = `${msg.message?.trim()}-${msg.source}-${timestamp}`;
      
      if (!seenMessages.has(uniqueKey)) {
        seenMessages.add(uniqueKey);
        uniqueMessages.push(msg);
      }
    });
    
    // Sort by timestamp
    return uniqueMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, []);

  // Memoized function to fetch history - fixed to prevent duplicates on navigation
  const fetchHistory = useCallback(async () => {
    if (!sessionId || !isValidSessionId(sessionId) || isHistoryLoaded) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get from local storage only - don't merge with server to prevent duplicates
      const storedHistory = getStoredHistory(sessionId);
      const cleanHistory = storedHistory || [];
      
      // Remove any duplicates that might exist in local storage
      const deduplicatedHistory = [];
      const seenMessages = new Set();
      
      cleanHistory.forEach(msg => {
        const uniqueKey = `${msg.message?.trim()}-${msg.source}`;
        if (!seenMessages.has(uniqueKey)) {
          seenMessages.add(uniqueKey);
          deduplicatedHistory.push(msg);
        }
      });
      
      setMessages(deduplicatedHistory);
      console.log(`📝 Loaded ${deduplicatedHistory.length} messages (${cleanHistory.length - deduplicatedHistory.length} duplicates removed)`);
      
      setIsHistoryLoaded(true);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, getStoredHistory, isHistoryLoaded]);

  // Validate session ID when it changes
  useEffect(() => {
    if (sessionId && !isValidSessionId(sessionId)) {
      setSessionError('Invalid session ID provided');
      console.error('Invalid session ID:', sessionId);
      return;
    }
    setSessionError(null);
    setIsHistoryLoaded(false); // Reset history loaded flag when session changes
  }, [sessionId]);

  // Load messages when session changes
  useEffect(() => {
    if (sessionId && isValidSessionId(sessionId) && !isHistoryLoaded) {
      fetchHistory();
    }
  }, [sessionId, fetchHistory, isHistoryLoaded]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fixed message handling - prevent duplicates
  const handleSendMessage = useCallback(async (text = null) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend.trim() || isSending) return;

    // Validation checks
    if (!sessionId || !isValidSessionId(sessionId)) {
      console.error('Cannot send message: Invalid session ID');
      setSessionError('Session not available. Please refresh the page.');
      return;
    }

    const userMessage = {
      id: Date.now() + Math.random(),
      message: messageToSend,
      session_id: sessionId,
      source: 'user',
      created_at: new Date().toISOString()
    };

    // Add to UI immediately
    setMessages(prev => {
      const updated = [...prev, userMessage];
      // Persist to storage immediately
      saveToHistory(sessionId, userMessage);
      return updated;
    });
    
    if (!text) setInputMessage('');

    setIsSending(true);
    try {
      // Include prediction context for doctors
      const predictionContext = user?.role === 'doctor' && currentPrediction 
        ? {
            patientId: currentPrediction.patientId,
            riskScore: currentPrediction.riskScore,
            riskCategory: currentPrediction.riskCategory,
            keyFactors: currentPrediction.keyFactors
          }
        : null;

      console.log('Sending message with sessionId:', sessionId);
      console.log('Prediction context:', predictionContext);

      const aiResponse = await sendChatMessage(
        messageToSend, 
        sessionId,
        predictionContext
      );
      
      const assistantMessage = {
        id: Date.now() + Math.random(),
        message: aiResponse.response || aiResponse.message,
        session_id: sessionId,
        source: 'ai',
        created_at: new Date().toISOString(),
        personalized: aiResponse.personalized
      };

      // Add to UI and persist
      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        saveToHistory(sessionId, assistantMessage);
        return updated;
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Show specific error message based on error type
      let errorMessage = "I'm having trouble responding right now. Please try again later.";
      if (error.response?.status === 422) {
        errorMessage = "There was an issue with your request. Please refresh the page and try again.";
      }
      
      const errorMsg = {
        id: Date.now() + Math.random(),
        message: errorMessage,
        session_id: sessionId,
        source: 'ai',
        created_at: new Date().toISOString(),
        isError: true
      };

      setMessages(prev => {
        const updated = [...prev, errorMsg];
        saveToHistory(sessionId, errorMsg);
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  }, [inputMessage, isSending, sessionId, user?.role, currentPrediction, saveToHistory]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Reset current chat only (not all chats)
  const resetCurrentChat = useCallback(() => {
    setMessages([]);
    setInputMessage('');
    clearStoredHistory(sessionId);
    setIsHistoryLoaded(false);
  }, [sessionId, clearStoredHistory]);

  // Show error state if session is invalid
  if (sessionError) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Session Error</h3>
          <p className="text-gray-600 mb-4">{sessionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading state if no session ID yet
  if (!sessionId) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Updated Header with Persistence Status */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Cardio Health Assistant</h2>
            <p className="text-xs opacity-80 mt-1">
              {user?.role === 'patient' 
                ? "Personalized advice based on your risk profile" 
                : "Clinical decision support system"}
            </p>
            
            {/* Show message count and persistence status */}
            <div className="mt-1 text-xs opacity-70">
              {messages.length > 0 && `💬 ${messages.length} messages • Auto-saved`}
            </div>
            
            {/* Show prediction context for doctors */}
            {user?.role === 'doctor' && currentPrediction && (
              <div className="mt-2 text-xs bg-white/10 p-2 rounded">
                <div className="font-medium">Current Patient Context:</div>
                <div>Patient ID: {currentPrediction.patientId}</div>
                <div>Risk: {currentPrediction.riskCategory} ({Math.round((currentPrediction.riskScore || 0) * 100)}%)</div>
                <div>Key Factors: {currentPrediction.keyFactors?.join(', ')}</div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              className="flex items-center text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
              onClick={resetCurrentChat}
              title="Clear current conversation only"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Clear
            </button>
            
            {onNewChat && (
              <button
                className="flex items-center text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
                onClick={onNewChat}
                title="Start completely new chat (resets patient selection)"
              >
                New Chat
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading conversation...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mb-4 flex items-center justify-center">
              💬
            </div>
            <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
            <p className="max-w-md">
              {user?.role === 'doctor'
                ? "Use the clinical tools below or type your medical query. Your conversations are automatically saved."
                : "Select your current health status to get personalized advice. Your chat history is preserved."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id || `${sessionId}-${index}`}
                message={msg}
                isUser={msg.source === 'user'}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {user?.role === 'patient' && (
        <PatientChatMenu onSelectQuestion={handleSendMessage} />
      )}

      {user?.role === 'doctor' && (
        <DoctorChatMenu onSelectAction={handleSendMessage} />
      )}

      {user?.role === 'doctor' && (
        <div className="p-4 bg-white border-t">
          <div className="flex items-end space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here..."
              className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={1}
              disabled={isSending}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isSending}
              className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Clinical mode: Responses include technical medical guidance • Messages auto-saved
          </p>
        </div>
      )}

      {user?.role === 'patient' && (
        <div className="p-3 bg-blue-50 border-t border-blue-100 text-center">
          <p className="text-xs text-blue-700">
            Responses are in simple, easy-to-understand language • Conversation saved automatically
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;