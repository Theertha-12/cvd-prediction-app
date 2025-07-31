import api from './api';

export const sendChatMessage = async (message, sessionId, predictionContext = null) => {
  // Ensure message is not empty
  if (!message || !message.trim()) {
    throw new Error('Message cannot be empty');
  }

  // Ensure sessionId is valid
  if (!sessionId || !sessionId.trim()) {
    throw new Error('Session ID is required');
  }

  // ENHANCED: Transform predictionContext to match backend schema expectations
  let transformedContext = null;
  if (predictionContext) {
    transformedContext = {
      patientId: predictionContext.patientId || predictionContext.patient_id,
      patientName: predictionContext.patientName || predictionContext.patient_name,
      age: predictionContext.age,
      riskScore: predictionContext.riskScore || predictionContext.risk_score,
      riskCategory: predictionContext.riskCategory || predictionContext.risk_category,
      keyFactors: predictionContext.keyFactors || predictionContext.key_factors || [],
      source: predictionContext.source || 'manual',
      batchFile: predictionContext.batchFile
    };

    // Only include if we have at least some required data
    if (!transformedContext.patientId && !transformedContext.riskScore && !transformedContext.riskCategory) {
      transformedContext = null;
    }
  }

  try {
    console.log('💬 Sending chat message:', {
      sessionId: sessionId.substring(0, 8) + '...',
      messageLength: message.length,
      hasContext: !!transformedContext,
      contextType: transformedContext?.source
    });

    const response = await api.post('/chat/message', { 
      message: message.trim(),
      session_id: sessionId.trim(),
      prediction_context: transformedContext
    });

    console.log('✅ Chat message sent successfully');
    return response.data;
  } catch (error) {
    // Enhanced error logging for debugging
    console.error('❌ Chat API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      requestData: {
        message: message.trim(),
        session_id: sessionId.trim(),
        prediction_context: transformedContext
      }
    });
    throw error;
  }
};

export const getChatHistory = async (sessionId, limit = 50) => {
  if (!sessionId || !sessionId.trim()) {
    throw new Error('Session ID is required for chat history');
  }

  try {
    console.log('📚 Fetching chat history for session:', sessionId.substring(0, 8) + '...');
    
    const response = await api.get(`/chat/history/${sessionId.trim()}`, { 
      params: { limit }
    });
    
    const messages = response.data.messages || response.data;
    console.log(`✅ Retrieved ${messages.length} messages from server`);
    
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    console.error('❌ Chat History Error:', {
      message: error.message,
      status: error.response?.status,
      sessionId: sessionId.substring(0, 8) + '...'
    });
    
    // Don't throw error - let caller handle fallback to local storage
    return [];
  }
};

export const createNewChatSession = async (sessionName = 'New Chat') => {
  try {
    console.log('🆕 Creating new chat session:', sessionName);
    
    const response = await api.post('/chat/new-session', {
      session_name: sessionName
    });
    
    console.log('✅ New chat session created:', response.data?.session_id?.substring(0, 8) + '...');
    return response.data;
  } catch (error) {
    console.error('❌ Create Session Error:', error);
    throw error;
  }
};

export const getUserChatSessions = async () => {
  try {
    console.log('📋 Fetching user chat sessions...');
    
    const response = await api.get('/chat/sessions');
    const sessions = response.data;
    
    console.log(`✅ Retrieved ${sessions?.length || 0} chat sessions`);
    return Array.isArray(sessions) ? sessions : [];
  } catch (error) {
    console.error('❌ Get Sessions Error:', error);
    
    // Don't throw error - return empty array for graceful degradation
    return [];
  }
};

export const renameChatSession = async (sessionId, newName) => {
  try {
    console.log('✏️ Renaming chat session:', sessionId.substring(0, 8) + '...', 'to:', newName);
    
    const response = await api.put(`/chat/session/${sessionId}/rename`, {
      new_name: newName
    });
    
    console.log('✅ Chat session renamed successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Rename Session Error:', error);
    throw error;
  }
};

// ENHANCED: Delete chat session with cleanup
export const deleteChatSession = async (sessionId) => {
  try {
    console.log('🗑️ Deleting chat session:', sessionId.substring(0, 8) + '...');
    
    const response = await api.delete(`/chat/session/${sessionId}`);
    
    console.log('✅ Chat session deleted successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Delete Session Error:', error);
    throw error;
  }
};

// ENHANCED: Sync local messages with server
export const syncChatHistory = async (sessionId, localMessages = []) => {
  try {
    console.log('🔄 Syncing chat history with server...');
    
    // Get server messages
    const serverMessages = await getChatHistory(sessionId);
    
    // Simple merge strategy: combine and deduplicate by timestamp and content
    const combined = [...localMessages];
    const localIds = new Set(localMessages.map(msg => 
      `${msg.message}-${msg.source}-${msg.created_at}`
    ));
    
    serverMessages.forEach(serverMsg => {
      const msgId = `${serverMsg.message}-${serverMsg.source}-${serverMsg.created_at}`;
      if (!localIds.has(msgId)) {
        combined.push(serverMsg);
      }
    });
    
    // Sort by timestamp
    combined.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    console.log(`✅ Synced ${combined.length} total messages (${localMessages.length} local, ${serverMessages.length} server)`);
    return combined;
  } catch (error) {
    console.error('❌ Sync Error:', error);
    // Fallback to local messages
    return localMessages;
  }
};

// ENHANCED: Batch upload chat messages to server
export const uploadChatHistory = async (sessionId, messages) => {
  try {
    console.log('📤 Uploading chat history to server...');
    
    const response = await api.post(`/chat/session/${sessionId}/upload-history`, {
      messages: messages
    });
    
    console.log('✅ Chat history uploaded successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Upload History Error:', error);
    // Don't throw error - uploading is not critical
    return null;
  }
};