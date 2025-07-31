import React, { useState } from 'react';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

const SessionSidebar = ({ activeSession, setActiveSession }) => {
  const [sessions, setSessions] = useState([
    { id: '1', name: 'Heart Health Advice', date: '2023-10-15T14:30:00Z' },
    { id: '2', name: 'Diet Questions', date: '2023-10-12T10:15:00Z' },
    { id: '3', name: 'Exercise Recommendations', date: '2023-10-10T16:45:00Z' },
  ]);
  const [newSessionName, setNewSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSession = () => {
    if (newSessionName.trim()) {
      const newSession = {
        id: Date.now().toString(),
        name: newSessionName,
        date: new Date().toISOString()
      };
      setSessions([newSession, ...sessions]);
      setActiveSession(newSession.id);
      setNewSessionName('');
    }
    setIsCreating(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Chat Sessions</h2>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        {isCreating && (
          <div className="mt-3 flex">
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="New session name"
              className="flex-grow px-3 py-1 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              onClick={handleCreateSession}
              className="px-3 py-1 bg-primary-600 text-white rounded-r-lg hover:bg-primary-700"
            >
              Add
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-gray-200">
          {sessions.map((session) => (
            <li
              key={session.id}
              className={`p-3 hover:bg-gray-50 cursor-pointer ${
                activeSession === session.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setActiveSession(session.id)}
            >
              <div className="flex justify-between">
                <span className={`font-medium ${
                  activeSession === session.id ? 'text-primary-600' : 'text-gray-800'
                }`}>
                  {session.name}
                </span>
                <button className="text-gray-400 hover:text-gray-600">
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(session.date).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SessionSidebar;
