import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Phone, User, Settings, Camera, Hand, Users, Monitor, Share, Send, MessageCircle, Copy, Check, RotateCcw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { webRTCService, Participant, ChatMessage } from '../services/webrtc';

const JoinMeeting: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { showSuccess, showError, showInfo } = useToast();

  useEffect(() => {
    // Setup WebRTC event listeners only
    webRTCService.onMeetingJoined = (participants) => {
      setParticipants(participants);
    };
    
    webRTCService.onParticipantJoined = (participant) => {
      setParticipants(prev => [...prev, participant]);
    };
    
    webRTCService.onParticipantLeft = (participantId) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    };
    
    webRTCService.onRemoteStream = (participantId, stream) => {
      const videoElement = remoteVideoRefs.current.get(participantId);
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    };
    
    webRTCService.onParticipantVideoToggle = (participantId, enabled) => {
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, videoEnabled: enabled } : p
      ));
    };
    
    webRTCService.onParticipantAudioToggle = (participantId, enabled) => {
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, audioEnabled: enabled } : p
      ));
    };
    
    webRTCService.onParticipantScreenShare = (participantId, enabled) => {
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, screenSharing: enabled } : p
      ));
    };
    
    webRTCService.onNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
      // Auto-scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };
    
    // Handle join approval/rejection
    webRTCService.onJoinApproved = async () => {
      setIsWaiting(false);
      showSuccess('You have been admitted to the meeting!');
      
      // Actually join the meeting now
      const userInfo = {
        name: name.trim(),
        email: email.trim() || undefined,
        isHost: false
      };
      
      try {
        await webRTCService.joinMeeting(meetingId!, userInfo);
        
        // Wait for the stream to be properly set up with multiple retries
        const setupVideo = (attempt = 1) => {
          console.log(`📹 [JoinMeeting] Setup candidate video attempt ${attempt}`);
          console.log(`📹 [JoinMeeting] Video ref available:`, !!videoRef.current);
          
          const localStream = webRTCService.getLocalStream();
          const streamReady = webRTCService.isLocalStreamReady();
          
          console.log(`📹 [JoinMeeting] Stream status:`, {
            hasStream: !!localStream,
            streamReady,
            videoRefExists: !!videoRef.current
          });
          
          if (localStream && videoRef.current && streamReady) {
            try {
              videoRef.current.srcObject = localStream;
              console.log(`✅ [JoinMeeting] Candidate video element set with stream (attempt ${attempt})`);
              console.log(`📹 [JoinMeeting] Video element srcObject set:`, !!videoRef.current.srcObject);
              
              // Add event listeners to track video loading
              videoRef.current.onloadedmetadata = () => {
                console.log(`✅ [JoinMeeting] Candidate video metadata loaded`);
                console.log(`📹 [JoinMeeting] Video dimensions:`, {
                  videoWidth: videoRef.current?.videoWidth,
                  videoHeight: videoRef.current?.videoHeight
                });
              };
              
              videoRef.current.oncanplay = () => {
                console.log(`✅ [JoinMeeting] Candidate video can play`);
              };
              
              videoRef.current.onerror = (error) => {
                console.error(`❌ [JoinMeeting] Candidate video error:`, error);
              };
              
            } catch (error) {
              console.error(`❌ [JoinMeeting] Error setting candidate video srcObject:`, error);
              if (attempt < 5) {
                setTimeout(() => setupVideo(attempt + 1), 200 * attempt);
              }
            }
          } else if (attempt < 5) {
            console.log(`⏳ [JoinMeeting] Waiting for candidate stream... attempt ${attempt}`);
            console.log(`⏳ [JoinMeeting] Missing:`, {
              stream: !localStream,
              videoRef: !videoRef.current,
              streamNotReady: !streamReady
            });
            setTimeout(() => setupVideo(attempt + 1), 200 * attempt);
          } else {
            console.error('❌ [JoinMeeting] Failed to get candidate local stream after 5 attempts');
            console.error('❌ [JoinMeeting] Final state:', {
              hasStream: !!localStream,
              streamReady,
              videoRefExists: !!videoRef.current
            });
          }
        };
        
        console.log('📹 [JoinMeeting] Starting candidate video setup in 100ms...');
        setTimeout(() => setupVideo(), 100);
        
        setHasJoined(true);
      } catch (error) {
        console.error('Failed to join after approval:', error);
        showError('Failed to join meeting after approval');
      }
    };
    
    webRTCService.onJoinRejected = () => {
      setIsWaiting(false);
      showError('Your request to join was declined by the host.');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    };
    
    return () => {
      // Clean up any existing stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      webRTCService.leaveMeeting();
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoEnabled, 
        audio: audioEnabled 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to access camera:', error);
    }
  };

  const toggleVideo = () => {
    const newVideoEnabled = !videoEnabled;
    setVideoEnabled(newVideoEnabled);
    if (hasJoined) {
      webRTCService.toggleVideo(newVideoEnabled);
    } else if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = newVideoEnabled;
      }
    }
  };

  const toggleAudio = () => {
    const newAudioEnabled = !audioEnabled;
    setAudioEnabled(newAudioEnabled);
    if (hasJoined) {
      webRTCService.toggleAudio(newAudioEnabled);
    } else if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = newAudioEnabled;
      }
    }
  };

  const joinMeeting = async () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsJoining(true);
    
    try {
      console.log('🔄 Requesting to join meeting:', meetingId);
      
      // Show waiting room
      setIsWaiting(true);
      setWaitingMessage('Sending join request to host...');
      showInfo('Requesting permission to join meeting...');
      
      // Initialize camera and microphone for preview
      if (videoEnabled || audioEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: videoEnabled, 
            audio: audioEnabled 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (mediaError) {
          console.warn('Media access denied:', mediaError);
          setVideoEnabled(false);
          setAudioEnabled(false);
        }
      }
      
      // Connect to WebRTC and request to join
      webRTCService.connect();
      
      const userInfo = {
        name: name.trim(),
        email: email.trim() || undefined,
        isHost: false
      };
      
      // Send join request (this will be handled by admin approval)
      webRTCService.requestToJoin(meetingId!, userInfo);
      
      setWaitingMessage('Waiting for host approval...');
      
    } catch (error) {
      console.error('❌ Failed to request meeting join:', error);
      showError('Failed to send join request. Please try again.');
      setIsWaiting(false);
    } finally {
      setIsJoining(false);
    }
  };

  const leaveMeeting = () => {
    // Stop all media tracks
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      videoRef.current.srcObject = null;
    }
    
    // Reset states
    setVideoEnabled(false);
    setAudioEnabled(false);
    
    webRTCService.leaveMeeting();
    
    // Redirect to skills.shivastra.in
    window.location.href = 'https://skills.shivastra.in';
  };

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/join/${meetingId}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setLinkCopied(true);
      showSuccess('Meeting link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      showError('Failed to copy link');
    }
  };

  const sendChatMessage = () => {
    if (newMessage.trim() && hasJoined) {
      webRTCService.sendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'anime':
        return {
          background: 'bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-purple-900 dark:via-pink-900 dark:to-indigo-900',
          card: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-pink-200 dark:border-pink-800',
          button: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
        };
      case 'light':
        return {
          background: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
          card: 'bg-white border-slate-200 shadow-sm',
          button: 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800'
        };
      default:
        return {
          background: 'bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900',
          card: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          button: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Waiting Room
  if (isWaiting) {
    return (
      <div className={`min-h-screen ${themeStyles.background} flex items-center justify-center p-6`}>
        <div className={`max-w-2xl w-full ${themeStyles.card} rounded-2xl p-8 border shadow-lg text-center`}>
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Waiting for Host Approval</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {waitingMessage}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Meeting ID: {meetingId}</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Please wait while the host reviews your request to join.</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasJoined) {
    return (
      <div className={`h-screen ${themeStyles.background} flex flex-col`}>
        {/* Meeting Header */}
        <div className={`${themeStyles.card} border-b p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Interview Room</h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">Meeting ID: {meetingId}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">• {participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Share Invite Button */}
            <button
              onClick={copyInviteLink}
              className={`
                relative overflow-hidden
                bg-white/10 dark:bg-gray-800/10
                backdrop-blur-md
                border-2 border-white/20 dark:border-gray-700/20
                text-blue-600 dark:text-blue-400
                px-6 py-3
                rounded-full
                font-bold text-sm
                transition-all duration-300
                hover:bg-blue-600/90 hover:text-white
                hover:transform hover:scale-105
                hover:shadow-lg hover:shadow-blue-500/25
                flex items-center gap-2
                group
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-2">
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share className="w-4 h-4" />
                    <span>Share Invite</span>
                  </>
                )}
              </div>
            </button>
            
            {/* Chat Toggle */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-3 rounded-full transition-all ${
                showChat 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Toggle Chat"
            >
              <MessageCircle className="w-5 h-5" />
              {messages.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {messages.length > 9 ? '9+' : messages.length}
                </div>
              )}
            </button>
            
            <span className="text-sm text-gray-500 dark:text-gray-400">Connected as {name}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Video Area */}
          <div className={`${showChat ? 'flex-1' : 'w-full'} p-4`}>
            <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Local Video */}
              <div className="bg-gray-900 rounded-lg relative overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${mirrorVideo ? 'scale-x-[-1]' : ''}`}
                  onLoadedMetadata={() => {
                    console.log('✅ [JoinMeeting] Candidate video metadata loaded');
                    console.log('📹 [JoinMeeting] Video element details:', {
                      videoWidth: videoRef.current?.videoWidth,
                      videoHeight: videoRef.current?.videoHeight,
                      readyState: videoRef.current?.readyState,
                      currentTime: videoRef.current?.currentTime
                    });
                  }}
                  onCanPlay={() => console.log('✅ [JoinMeeting] Candidate video can play')}
                  onPlay={() => console.log('✅ [JoinMeeting] Candidate video started playing')}
                  onError={(e) => console.error('❌ [JoinMeeting] Candidate video error:', e)}
                />
                
                {/* Mirror Toggle */}
                <button
                  onClick={() => setMirrorVideo(!mirrorVideo)}
                  className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/80 transition-all"
                  title={mirrorVideo ? 'Disable mirror' : 'Enable mirror'}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                
                {!videoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-white text-sm font-medium">{name}</p>
                      <p className="text-gray-400 text-xs">(You)</p>
                    </div>
                  </div>
                )}

                {/* Status indicators */}
                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                  <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
                    <span className="text-white text-xs font-medium">{name} (You)</span>
                    {!audioEnabled && <MicOff className="w-3 h-3 text-red-400" />}
                    {!videoEnabled && <VideoOff className="w-3 h-3 text-red-400" />}
                  </div>
                </div>
              </div>

              {/* Remote Videos */}
              {participants.filter(p => p.name !== name).map((participant) => (
                <div key={participant.id} className="bg-gray-900 rounded-lg relative overflow-hidden aspect-video">
                <video
                  ref={(el) => {
                    if (el) {
                      remoteVideoRefs.current.set(participant.id, el);
                      const stream = webRTCService.getRemoteStream(participant.id);
                      if (stream) {
                        el.srcObject = stream;
                      }
                    }
                  }}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${!participant.videoEnabled ? 'hidden' : ''}`}
                />
                
                {!participant.videoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-white text-sm font-medium">{participant.name}</p>
                      {participant.isHost && <p className="text-yellow-400 text-xs">(Host)</p>}
                    </div>
                  </div>
                )}

                {/* Status indicators */}
                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                  <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
                    <span className="text-white text-xs font-medium">
                      {participant.name}
                      {participant.isHost && <span className="text-yellow-400 ml-1">(Host)</span>}
                    </span>
                    {!participant.audioEnabled && <MicOff className="w-3 h-3 text-red-400" />}
                    {!participant.videoEnabled && <VideoOff className="w-3 h-3 text-red-400" />}
                    {participant.handRaised && <Hand className="w-3 h-3 text-yellow-400" />}
                  </div>
                </div>

                  {participant.screenSharing && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Monitor className="w-3 h-3" />
                      Sharing Screen
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat Panel */}
          {showChat && (
            <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat</h3>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <MessageCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {message.sender}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-1"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Meeting Controls */}
        <div className={`${themeStyles.card} border-t p-4`}>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-all ${
                audioEnabled 
                  ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-all ${
                videoEnabled 
                  ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            
            {/* Screen Share for candidate */}
            <button
              onClick={async () => {
                try {
                  if (screenSharing) {
                    await webRTCService.stopScreenShare();
                    setScreenSharing(false);
                  } else {
                    const success = await webRTCService.startScreenShare();
                    if (success) {
                      setScreenSharing(true);
                    }
                  }
                } catch (error) {
                  console.error('Screen share error:', error);
                }
              }}
              className={`p-3 rounded-full transition-all ${
                screenSharing 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={screenSharing ? 'Stop sharing screen' : 'Share screen'}
            >
              <Monitor className="w-5 h-5" />
            </button>

            <button
              onClick={leaveMeeting}
              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all ml-4"
            >
              <Phone className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeStyles.background} flex items-center justify-center p-6`}>
      <div className={`max-w-2xl w-full ${themeStyles.card} rounded-2xl p-8 border shadow-lg`}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join Interview</h1>
          <p className="text-gray-600 dark:text-gray-400">Meeting ID: {meetingId}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {participants.length} participant{participants.length !== 1 ? 's' : ''} in meeting
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Camera Preview */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Camera Preview</h3>
            <div className="bg-gray-900 rounded-lg aspect-video relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-white text-lg font-medium">Camera Off</p>
                  <p className="text-gray-400 text-sm">Camera will activate when you join</p>
                </div>
              </div>
            </div>

            {/* Camera Controls */}
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-all ${
                  audioEnabled 
                    ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-all ${
                  videoEnabled 
                    ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setMirrorVideo(!mirrorVideo)}
                className={`p-3 rounded-full transition-all ${
                  mirrorVideo 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={mirrorVideo ? 'Disable mirror' : 'Enable mirror'}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mirror Toggle Info */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mirror: {mirrorVideo ? 'On' : 'Off'} (like Zoom/Meet)
              </p>
            </div>
          </div>

          {/* Join Form */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={joinMeeting}
                disabled={!name.trim() || isJoining}
                className={`w-full ${themeStyles.button} text-white py-3 px-6 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {isJoining ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5" />
                    Join Meeting
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinMeeting;