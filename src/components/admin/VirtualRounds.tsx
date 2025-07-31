import React, { useState, useRef, useEffect } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Users,
  Settings,
  Phone,
  Copy,
  Check,
  MessageSquare,
  Hand,
  Grid3X3,
  Maximize2,
  Volume2,
  VolumeX,
  Camera,
  MoreVertical,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { webRTCService, Participant, ChatMessage } from "../../services/webrtc";
import { useAuth } from "../../contexts/AuthContext";

const VirtualRounds: React.FC = () => {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "speaker">("grid");
  const [copied, setCopied] = useState(false);
  const [joinRequests, setJoinRequests] = useState<
    { id: string; name: string; email?: string }[]
  >([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const { theme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    // Generate random meeting ID
    setMeetingId(Math.random().toString(36).substring(2, 10).toUpperCase());

    // Don't initialize camera until meeting starts

    // Setup WebRTC event listeners
    webRTCService.onMeetingJoined = (participants) => {
      setParticipants(participants);
    };

    webRTCService.onParticipantJoined = (participant) => {
      setParticipants((prev) => [...prev, participant]);
    };

    webRTCService.onParticipantLeft = (participantId) => {
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    };

    webRTCService.onRemoteStream = (participantId, stream) => {
      const videoElement = remoteVideoRefs.current.get(participantId);
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    };

    webRTCService.onParticipantVideoToggle = (participantId, enabled) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, videoEnabled: enabled } : p
        )
      );
    };

    webRTCService.onParticipantAudioToggle = (participantId, enabled) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, audioEnabled: enabled } : p
        )
      );
    };

    webRTCService.onParticipantScreenShare = (participantId, enabled) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, screenSharing: enabled } : p
        )
      );
    };

    webRTCService.onParticipantHandRaised = (participantId, raised, name) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, handRaised: raised } : p
        )
      );
    };

    webRTCService.onNewMessage = (message) => {
      setChatMessages((prev) => [...prev, message]);
    };

    // Handle join requests from candidates
    webRTCService.onJoinRequest = (request) => {
      console.log("📨 Received join request:", request);
      setJoinRequests((prev) => [...prev, request]);
    };

    return () => {
      // Clean up camera stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      webRTCService.leaveMeeting();
    };
  }, []);

  const generateMeetingLink = () => {
    // Use current origin for development, production URL for production
    const baseUrl =
      import.meta.env.NODE_ENV === "production"
        ? import.meta.env.CORS_ORIGIN || "https://skills.shivastra.in"
        : window.location.origin;
    return `${baseUrl}/join/${meetingId}`;
  };

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(generateMeetingLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const startMeeting = async () => {
    try {
      // First create the meeting via API with the current meetingId
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/meeting/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ meetingId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create meeting");
      }

      const data = await response.json();
      console.log("Meeting created:", data);

      // Connect to WebRTC first
      webRTCService.connect();

      const userInfo = {
        name: user?.firstName + " " + user?.lastName || "Admin User",
        email: user?.email,
        isHost: true,
      };

      // Join meeting and wait for stream
      await webRTCService.joinMeeting(meetingId, userInfo);

      // Wait for the stream to be properly set up with multiple retries
      const setupVideo = (attempt = 1) => {
        console.log(`📹 [VirtualRounds] Setup video attempt ${attempt}`);
        console.log(
          `📹 [VirtualRounds] Video ref available:`,
          !!videoRef.current
        );

        const localStream = webRTCService.getLocalStream();
        const streamReady = webRTCService.isLocalStreamReady();

        console.log(`📹 [VirtualRounds] Stream status:`, {
          hasStream: !!localStream,
          streamReady,
          videoRefExists: !!videoRef.current,
        });

        if (localStream && videoRef.current && streamReady) {
          try {
            videoRef.current.srcObject = localStream;
            console.log(
              `✅ [VirtualRounds] Admin video element set with stream (attempt ${attempt})`
            );
            console.log(
              `📹 [VirtualRounds] Video element srcObject set:`,
              !!videoRef.current.srcObject
            );

            // Add event listeners to track video loading
            videoRef.current.onloadedmetadata = () => {
              console.log(`✅ [VirtualRounds] Video metadata loaded`);
              console.log(`📹 [VirtualRounds] Video dimensions:`, {
                videoWidth: videoRef.current?.videoWidth,
                videoHeight: videoRef.current?.videoHeight,
              });
            };

            videoRef.current.oncanplay = () => {
              console.log(`✅ [VirtualRounds] Video can play`);
            };

            videoRef.current.onerror = (error) => {
              console.error(`❌ [VirtualRounds] Video error:`, error);
            };

            setVideoEnabled(true);
            setAudioEnabled(true);
          } catch (error) {
            console.error(
              `❌ [VirtualRounds] Error setting video srcObject:`,
              error
            );
            if (attempt < 5) {
              setTimeout(() => setupVideo(attempt + 1), 200 * attempt);
            }
          }
        } else if (attempt < 5) {
          console.log(
            `⏳ [VirtualRounds] Waiting for stream... attempt ${attempt}`
          );
          console.log(`⏳ [VirtualRounds] Missing:`, {
            stream: !localStream,
            videoRef: !videoRef.current,
            streamNotReady: !streamReady,
          });
          setTimeout(() => setupVideo(attempt + 1), 200 * attempt);
        } else {
          console.error(
            "❌ [VirtualRounds] Failed to get local stream after 5 attempts"
          );
          console.error("❌ [VirtualRounds] Final state:", {
            hasStream: !!localStream,
            streamReady,
            videoRefExists: !!videoRef.current,
          });
          setVideoEnabled(false);
          setAudioEnabled(false);
        }
      };

      console.log("📹 [VirtualRounds] Starting video setup in 100ms...");
      setTimeout(() => setupVideo(), 100);

      setIsInMeeting(true);
    } catch (error) {
      console.error("Failed to start meeting:", error);
      alert("Failed to start meeting. Please try again.");
    }
  };

  const endMeeting = () => {
    // Stop all media tracks
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      videoRef.current.srcObject = null;
    }

    // Reset states
    setVideoEnabled(false);
    setAudioEnabled(false);

    webRTCService.leaveMeeting();
    setIsInMeeting(false);
    setParticipants([]);
    setChatMessages([]);

    // Redirect to skills.shivastra.in
    window.location.href = "https://skills.shivastra.in";
  };

  const toggleVideo = () => {
    const newVideoEnabled = !videoEnabled;
    setVideoEnabled(newVideoEnabled);
    webRTCService.toggleVideo(newVideoEnabled);
  };

  const toggleAudio = () => {
    const newAudioEnabled = !audioEnabled;
    setAudioEnabled(newAudioEnabled);
    webRTCService.toggleAudio(newAudioEnabled);
  };

  const startScreenShare = async () => {
    if (screenSharing) {
      await webRTCService.stopScreenShare();
      setScreenSharing(false);
    } else {
      const success = await webRTCService.startScreenShare();
      if (success) {
        setScreenSharing(true);
      }
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    webRTCService.sendMessage(newMessage);
    setNewMessage("");
  };

  const getThemeStyles = () => {
    switch (theme) {
      case "anime":
        return {
          background:
            "bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-purple-900 dark:via-pink-900 dark:to-indigo-900",
          card: "bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-pink-200 dark:border-pink-800",
          button:
            "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700",
          accent: "text-pink-600 dark:text-pink-400",
        };
      case "light":
        return {
          background:
            "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50",
          card: "bg-white border-slate-200 shadow-sm",
          button:
            "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800",
          accent: "text-blue-600",
        };
      default:
        return {
          background:
            "bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900",
          card: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
          button:
            "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
          accent: "text-blue-600 dark:text-blue-400",
        };
    }
  };

  const themeStyles = getThemeStyles();

  if (!isInMeeting) {
    return (
      <div className={`min-h-screen ${themeStyles.background} p-6`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Virtual Interviews
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Conduct professional video interviews with advanced features and
              seamless collaboration
            </p>
          </div>

          {/* Meeting Setup */}
          <div
            className={`${themeStyles.card} rounded-3xl p-10 border shadow-2xl backdrop-blur-sm`}
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* Start New Meeting */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <Video className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Start New Meeting
                  </h2>
                </div>

                {/* Camera Preview - Off by default */}
                <div className="mb-6">
                  <div className="bg-gray-900 rounded-lg aspect-video relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-white text-lg font-medium">
                          Camera Off
                        </p>
                        <p className="text-gray-400 text-sm">
                          Camera will activate when you start the meeting
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      value={meetingId}
                      readOnly
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-center text-lg font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meeting Link
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 break-all mb-2">
                      {generateMeetingLink()}
                    </div>
                    <button
                      onClick={copyMeetingLink}
                      className={`w-full flex items-center justify-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Invite Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={startMeeting}
                    className={`w-full ${themeStyles.button} text-white py-4 px-8 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105`}
                  >
                    <Video className="w-6 h-6" />
                    Start Meeting
                  </button>
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Features
                  </h2>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Video, text: "HD Video & Audio" },
                    { icon: Monitor, text: "Screen Sharing" },
                    { icon: MessageSquare, text: "Real-time Chat" },
                    { icon: Hand, text: "Raise Hand" },
                    { icon: Users, text: "Multiple Participants" },
                    { icon: Settings, text: "Meeting Controls" },
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`p-2 ${themeStyles.button} rounded-lg`}>
                        <feature.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen ${themeStyles.background} flex flex-col`}>
      {/* Meeting Header */}
      <div
        className={`${themeStyles.card} border-b p-4 flex items-center justify-between`}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Interview Room
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Meeting ID: {meetingId}
          </span>
          <button
            onClick={copyMeetingLink}
            className={`flex items-center gap-2 px-3 py-1 ${themeStyles.button} text-white rounded-lg text-sm font-medium transition-all hover:scale-105`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Share Invite
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-4">
          {joinRequests.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                {joinRequests.length} waiting
              </span>
            </div>
          )}
          <button
            onClick={() =>
              setViewMode(viewMode === "grid" ? "speaker" : "grid")
            }
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Toggle view mode"
          >
            {viewMode === "grid" ? (
              <Maximize2 className="w-5 h-5" />
            ) : (
              <Grid3X3 className="w-5 h-5" />
            )}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {participants.length} participants
          </span>
        </div>
      </div>

      {/* Join Requests Modal */}
      {joinRequests.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`${themeStyles.card} rounded-2xl p-6 max-w-md w-full mx-4 border shadow-2xl`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Join Requests
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {joinRequests.length} waiting
              </span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {joinRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {request.name}
                    </p>
                    {request.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {request.email}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        webRTCService.approveJoinRequest(request.id);
                        setJoinRequests((prev) =>
                          prev.filter((r) => r.id !== request.id)
                        );
                      }}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        webRTCService.rejectJoinRequest(request.id);
                        setJoinRequests((prev) =>
                          prev.filter((r) => r.id !== request.id)
                        );
                      }}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  joinRequests.forEach((req) =>
                    webRTCService.approveJoinRequest(req.id)
                  );
                  setJoinRequests([]);
                }}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={() => {
                  joinRequests.forEach((req) =>
                    webRTCService.rejectJoinRequest(req.id)
                  );
                  setJoinRequests([]);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Reject All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className="flex-1 p-4">
          {viewMode === "grid" ? (
            /* Grid View */
            <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Local Video */}
              <div className="bg-gray-900 rounded-lg relative overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    console.log(
                      "✅ [VirtualRounds] Admin video metadata loaded"
                    );
                    console.log("📹 [VirtualRounds] Video element details:", {
                      videoWidth: videoRef.current?.videoWidth,
                      videoHeight: videoRef.current?.videoHeight,
                      readyState: videoRef.current?.readyState,
                      currentTime: videoRef.current?.currentTime,
                    });
                  }}
                  onCanPlay={() =>
                    console.log("✅ [VirtualRounds] Admin video can play")
                  }
                  onPlay={() =>
                    console.log(
                      "✅ [VirtualRounds] Admin video started playing"
                    )
                  }
                  onError={(e) =>
                    console.error("❌ [VirtualRounds] Admin video error:", e)
                  }
                />

                {!videoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-white text-sm font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-gray-400 text-xs">(You)</p>
                    </div>
                  </div>
                )}

                {/* Status indicators */}
                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                  <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
                    <span className="text-white text-xs font-medium">
                      {user?.firstName} {user?.lastName} (You)
                    </span>
                    {!audioEnabled && (
                      <MicOff className="w-3 h-3 text-red-400" />
                    )}
                    {!videoEnabled && (
                      <VideoOff className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                </div>

                {screenSharing && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    Sharing Screen
                  </div>
                )}
              </div>

              {/* Remote Videos */}
              {participants
                .filter(
                  (p) => p.name !== user?.firstName + " " + user?.lastName
                )
                .map((participant) => (
                  <div
                    key={participant.id}
                    className="bg-gray-900 rounded-lg relative overflow-hidden aspect-video"
                  >
                    <video
                      ref={(el) => {
                        if (el) {
                          remoteVideoRefs.current.set(participant.id, el);
                          const stream = webRTCService.getRemoteStream(
                            participant.id
                          );
                          if (stream) {
                            el.srcObject = stream;
                          }
                        }
                      }}
                      autoPlay
                      playsInline
                      className={`w-full h-full object-cover ${
                        !participant.videoEnabled ? "hidden" : ""
                      }`}
                    />

                    {!participant.videoEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
                            <Camera className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-white text-sm font-medium">
                            {participant.name}
                          </p>
                          {participant.isHost && (
                            <p className="text-yellow-400 text-xs">(Host)</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status indicators */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-2">
                      <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
                        <span className="text-white text-xs font-medium">
                          {participant.name}
                          {participant.isHost && (
                            <span className="text-yellow-400 ml-1">(Host)</span>
                          )}
                        </span>
                        {!participant.audioEnabled && (
                          <MicOff className="w-3 h-3 text-red-400" />
                        )}
                        {!participant.videoEnabled && (
                          <VideoOff className="w-3 h-3 text-red-400" />
                        )}
                        {participant.handRaised && (
                          <Hand className="w-3 h-3 text-yellow-400" />
                        )}
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
          ) : (
            /* Speaker View */
            <div className="h-full flex flex-col">
              {/* Main Speaker */}
              <div className="flex-1 bg-gray-900 rounded-lg relative overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />

                {!videoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-white">
                        {user?.firstName} {user?.lastName} (You)
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName} {user?.lastName} (You)
                  </span>
                </div>

                {screenSharing && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Sharing Screen
                  </div>
                )}
              </div>

              {/* Participant Thumbnails */}
              {participants.filter(
                (p) => p.name !== user?.firstName + " " + user?.lastName
              ).length > 0 && (
                <div className="flex gap-2 h-24">
                  {participants
                    .filter(
                      (p) => p.name !== user?.firstName + " " + user?.lastName
                    )
                    .map((participant) => (
                      <div
                        key={participant.id}
                        className="w-32 bg-gray-900 rounded relative overflow-hidden"
                      >
                        <video
                          ref={(el) => {
                            if (el) {
                              remoteVideoRefs.current.set(participant.id, el);
                              const stream = webRTCService.getRemoteStream(
                                participant.id
                              );
                              if (stream) {
                                el.srcObject = stream;
                              }
                            }
                          }}
                          autoPlay
                          className="w-full h-full object-cover"
                        />

                        {!participant.videoEnabled && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                            <Camera className="w-6 h-6 text-gray-400" />
                          </div>
                        )}

                        <div className="absolute bottom-1 left-1 bg-black/50 backdrop-blur-sm rounded px-1">
                          <span className="text-white text-xs">
                            {participant.name.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        {chatOpen && (
          <div className={`w-80 ${themeStyles.card} border-l flex flex-col`}>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Chat
                </h3>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {msg.sender}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className={`p-2 ${themeStyles.button} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Meeting Controls */}
      <div className={`${themeStyles.card} border-t p-4`}>
        <div className="flex items-center justify-center gap-4">
          {/* Audio Control */}
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-all ${
              audioEnabled
                ? "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
            title={audioEnabled ? "Mute" : "Unmute"}
          >
            {audioEnabled ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>

          {/* Video Control */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-all ${
              videoEnabled
                ? "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
            title={videoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {videoEnabled ? (
              <Video className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={startScreenShare}
            className={`p-3 rounded-full transition-all ${
              screenSharing
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title={screenSharing ? "Stop sharing screen" : "Share screen"}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Raise Hand */}
          <button
            onClick={() => {
              const newHandRaised = !handRaised;
              setHandRaised(newHandRaised);
              webRTCService.raiseHand(newHandRaised);
            }}
            className={`p-3 rounded-full transition-all ${
              handRaised
                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Raise hand"
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-all"
            title="Toggle chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* End Meeting */}
          <button
            onClick={endMeeting}
            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all ml-4"
            title="End meeting"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualRounds;
