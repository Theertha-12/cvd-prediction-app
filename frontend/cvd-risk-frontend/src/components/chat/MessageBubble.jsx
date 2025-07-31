import React from 'react';
import { formatDate } from '../../utils/helpers';

const MessageBubble = ({ message, isUser }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
          isUser
            ? 'chat-bubble-user bg-blue-100'
            : 'chat-bubble-ai bg-gray-100'
        }`}
      >
        <div className="text-gray-800">{message.message || message.response}</div>
        <div className="text-xs text-gray-500 mt-1 text-right">
          {formatDate(message.created_at)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

