export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const getRiskCategoryInfo = (category) => {
  const categories = {
    Low: {
      label: 'Low Risk',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300'
    },
    Moderate: {
      label: 'Moderate Risk',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300'
    },
    High: {
      label: 'High Risk',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300'
    }
  };
  return categories[category] || categories.Low;
};

export const generateCSV = (data, headers) => {
  const headerRow = headers.map(h => `"${h.label}"`).join(',');
  const rows = data.map(item => 
    headers.map(h => {
      const value = item[h.key];
      return typeof value === 'string' ? `"${value}"` : value;
    }).join(',')
  );
  return [headerRow, ...rows].join('\n');
};

export const downloadFile = (content, filename, type = 'text/csv') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// Session ID generation
export const generateSessionId = () => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${randomStr}`;
};

// Alternative UUID-like generator (if you don't want to install uuid package)
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Validate session ID format
export const isValidSessionId = (sessionId) => {
  if (!sessionId || typeof sessionId !== 'string') return false;
  return sessionId.trim().length > 0;
};

// Format timestamp for display
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

// Sanitize message text
export const sanitizeMessage = (message) => {
  if (!message || typeof message !== 'string') return '';
  return message.trim().replace(/\s+/g, ' '); // Remove extra whitespace
};

// Generate session name based on current time
export const generateSessionName = () => {
  const now = new Date();
  return `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
};