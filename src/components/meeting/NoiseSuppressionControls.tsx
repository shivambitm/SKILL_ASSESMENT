import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings, Mic } from 'lucide-react';

interface NoiseSuppressionControlsProps {
  localStream: MediaStream | null;
  onSettingsChange?: (settings: AudioSettings) => void;
}

interface AudioSettings {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  volume: number;
}

const NoiseSuppressionControls: React.FC<NoiseSuppressionControlsProps> = ({ 
  localStream, 
  onSettingsChange 
}) => {
  const [settings, setSettings] = useState<AudioSettings>({
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    volume: 100
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (localStream) {
      setupAudioLevelMonitoring();
    }
  }, [localStream]);

  const setupAudioLevelMonitoring = () => {
    if (!localStream) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(localStream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        setAudioLevel(Math.min(100, (average / 128) * 100));
        requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (error) {
      console.warn('Failed to setup audio level monitoring:', error);
    }
  };

  const updateAudioConstraints = async (newSettings: Partial<AudioSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);

    if (localStream) {
      try {
        // Get new stream with updated constraints
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: updatedSettings.echoCancellation,
            noiseSuppression: updatedSettings.noiseSuppression,
            autoGainControl: updatedSettings.autoGainControl,
            volume: updatedSettings.volume / 100
          },
          video: true
        });

        // Replace audio track
        const audioTrack = newStream.getAudioTracks()[0];
        const oldAudioTrack = localStream.getAudioTracks()[0];
        
        if (oldAudioTrack && audioTrack) {
          localStream.removeTrack(oldAudioTrack);
          localStream.addTrack(audioTrack);
          oldAudioTrack.stop();
        }
      } catch (error) {
        console.error('Failed to update audio constraints:', error);
      }
    }
  };

  const getAudioLevelColor = () => {
    if (audioLevel < 20) return 'bg-gray-300';
    if (audioLevel < 50) return 'bg-green-400';
    if (audioLevel < 80) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Audio Level Indicator */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Mic className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Microphone Level
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round(audioLevel)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-150 ${getAudioLevelColor()}`}
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateAudioConstraints({ noiseSuppression: !settings.noiseSuppression })}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            settings.noiseSuppression
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {settings.noiseSuppression ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          Noise Suppression
        </button>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Advanced
        </button>
      </div>

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white">Audio Settings</h4>
          
          {/* Echo Cancellation */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Echo Cancellation
            </label>
            <button
              onClick={() => updateAudioConstraints({ echoCancellation: !settings.echoCancellation })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.echoCancellation ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.echoCancellation ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Auto Gain Control */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Auto Gain Control
            </label>
            <button
              onClick={() => updateAudioConstraints({ autoGainControl: !settings.autoGainControl })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoGainControl ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoGainControl ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Microphone Volume
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {settings.volume}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={(e) => updateAudioConstraints({ volume: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Audio Quality Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Echo Cancellation: Removes audio feedback</p>
            <p>• Noise Suppression: Filters background noise</p>
            <p>• Auto Gain Control: Maintains consistent volume</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoiseSuppressionControls;