import React, { useState, useEffect } from 'react';
import { Users, Plus, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Breakout {
  breakoutId: string;
  name: string;
  participants: string[];
}

interface BreakoutRoomsProps {
  roomId: string;
  isHost: boolean;
  userEmail: string;
  participants: Array<{ email: string; name: string }>;
}

const BreakoutRooms: React.FC<BreakoutRoomsProps> = ({ 
  roomId, 
  isHost, 
  userEmail, 
  participants 
}) => {
  const [breakouts, setBreakouts] = useState<Breakout[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newBreakoutName, setNewBreakoutName] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentBreakout, setCurrentBreakout] = useState<string | null>(null);

  useEffect(() => {
    console.log('🏠 [BreakoutRooms] Initializing breakout rooms for room:', roomId);
    
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketInstance = io(serverUrl);
    setSocket(socketInstance);

    // Join the main room
    socketInstance.emit('join-room', { roomId, email: userEmail });

    // Listen for breakout updates
    socketInstance.on('breakouts-updated', (updatedBreakouts: Breakout[]) => {
      console.log('🏠 [BreakoutRooms] Breakouts updated:', updatedBreakouts);
      setBreakouts(updatedBreakouts);
    });

    // Listen for recall
    socketInstance.on('breakouts-recall', () => {
      console.log('📢 [BreakoutRooms] Recalled from breakouts');
      setCurrentBreakout(null);
    });

    // Listen for system messages
    socketInstance.on('system', (message: string) => {
      console.log('📢 [BreakoutRooms] System message:', message);
    });

    return () => {
      console.log('🧹 [BreakoutRooms] Cleaning up breakout rooms...');
      socketInstance.disconnect();
    };
  }, [roomId, userEmail]);

  const createBreakout = () => {
    if (!newBreakoutName.trim()) return;
    
    const newBreakout: Breakout = {
      breakoutId: `breakout-${Date.now()}`,
      name: newBreakoutName.trim(),
      participants: []
    };
    
    const updatedBreakouts = [...breakouts, newBreakout];
    console.log('🏠 [BreakoutRooms] Creating breakout:', newBreakout);
    
    if (socket) {
      socket.emit('create-breakouts', { roomId, breakouts: updatedBreakouts });
    }
    
    setNewBreakoutName('');
    setIsCreating(false);
  };

  const moveToBreakout = (breakoutId: string) => {
    console.log('🚶 [BreakoutRooms] Moving to breakout:', breakoutId);
    
    if (socket) {
      socket.emit('move-to-breakout', { roomId, email: userEmail, breakoutId });
      setCurrentBreakout(breakoutId);
    }
  };

  const recallAll = () => {
    console.log('📢 [BreakoutRooms] Recalling all participants');
    
    if (socket) {
      socket.emit('recall-from-breakouts', { roomId });
    }
  };

  const moveParticipant = (participantEmail: string, breakoutId: string) => {
    console.log('🚶 [BreakoutRooms] Moving participant:', participantEmail, 'to', breakoutId);
    
    if (socket) {
      socket.emit('move-to-breakout', { roomId, email: participantEmail, breakoutId });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Breakout Rooms
          </h3>
        </div>
        
        {isHost && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Room
            </button>
            
            {breakouts.length > 0 && (
              <button
                onClick={recallAll}
                className="flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Recall All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Breakout Form */}
      {isCreating && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newBreakoutName}
              onChange={(e) => setNewBreakoutName(e.target.value)}
              placeholder="Enter breakout room name"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && createBreakout()}
            />
            <button
              onClick={createBreakout}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
            >
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current Status */}
      {currentBreakout && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            📍 You are currently in: <strong>{breakouts.find(b => b.breakoutId === currentBreakout)?.name}</strong>
          </p>
        </div>
      )}

      {/* Breakout Rooms List */}
      {breakouts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">No breakout rooms created yet</p>
          {isHost && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Create breakout rooms to split participants into smaller groups
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {breakouts.map((breakout) => (
            <div
              key={breakout.breakoutId}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {breakout.name}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({breakout.participants.length} participants)
                  </span>
                </div>
                
                {!isHost && currentBreakout !== breakout.breakoutId && (
                  <button
                    onClick={() => moveToBreakout(breakout.breakoutId)}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-all"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Join
                  </button>
                )}
              </div>
              
              {/* Participants in this breakout */}
              <div className="space-y-2">
                {breakout.participants.map((email) => {
                  const participant = participants.find(p => p.email === email);
                  return (
                    <div
                      key={email}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {participant?.name || email}
                      </span>
                      
                      {isHost && (
                        <button
                          onClick={() => moveParticipant(email, '')}
                          className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
                
                {breakout.participants.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No participants in this room
                  </p>
                )}
              </div>
              
              {/* Host controls */}
              {isHost && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex flex-wrap gap-2">
                    {participants
                      .filter(p => !breakouts.some(b => b.participants.includes(p.email)))
                      .map((participant) => (
                        <button
                          key={participant.email}
                          onClick={() => moveParticipant(participant.email, breakout.breakoutId)}
                          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded"
                        >
                          + {participant.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BreakoutRooms;