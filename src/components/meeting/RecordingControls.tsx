import React, { useState, useEffect } from 'react';
import { Play, Square, Download, Clock, AlertCircle } from 'lucide-react';

interface Recording {
  id: string;
  fileName: string;
  driveUrl: string;
  startTime: string;
  duration: number;
  fileSize: number;
  expiryDate: string;
}

interface RecordingControlsProps {
  roomId: string;
  isHost: boolean;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({ roomId, isHost }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkRecordingStatus();
    fetchRecordings();
  }, [roomId]);

  const checkRecordingStatus = async () => {
    try {
      const response = await fetch(`/api/recording/${roomId}/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setIsRecording(data.isRecording);
      }
    } catch (error) {
      console.error('Failed to check recording status:', error);
    }
  };

  const fetchRecordings = async () => {
    try {
      const response = await fetch(`/api/recording/${roomId}/recordings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setRecordings(data.recordings);
      }
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    }
  };

  const startRecording = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recording/${roomId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setIsRecording(true);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording');
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recording/${roomId}/stop`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setIsRecording(false);
        fetchRecordings();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert('Failed to stop recording');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  return (
    <div className="space-y-4">
      {isHost && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            {isRecording ? (
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Recording...</span>
              </div>
            ) : (
              <span className="text-gray-600 dark:text-gray-400">Ready to record</span>
            )}
          </div>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-50`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isRecording ? (
              <Square className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
      )}

      {!isHost && isRecording && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-700 dark:text-red-300 font-medium">
            This meeting is being recorded
          </span>
        </div>
      )}

      {recordings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Previous Recordings</h3>
          
          {recordings.map((recording) => {
            const daysLeft = getDaysUntilExpiry(recording.expiryDate);
            
            return (
              <div key={recording.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {recording.fileName}
                    </h4>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(recording.duration)}
                      </span>
                      <span>{formatFileSize(recording.fileSize)}</span>
                      <span>{new Date(recording.startTime).toLocaleDateString()}</span>
                    </div>
                    
                    {daysLeft <= 7 && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          {daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} days`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <a
                    href={recording.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    View
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecordingControls;