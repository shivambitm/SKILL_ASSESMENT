import { io, Socket } from "socket.io-client";

export interface Participant {
  id: string;
  name: string;
  email?: string;
  isHost: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  joinedAt: Date;
  isSpeaking?: boolean;
  audioLevel?: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}

class WebRTCService {
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private screenStreams: Map<string, MediaStream> = new Map();
  private meetingId: string | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private activeSpeaker: string | null = null;
  private voiceActivityTimer: NodeJS.Timeout | null = null;

  // Event callbacks
  public onParticipantJoined?: (participant: Participant) => void;
  public onParticipantLeft?: (participantId: string) => void;
  public onRemoteStream?: (participantId: string, stream: MediaStream, type: 'camera' | 'screen') => void;
  public onParticipantVideoToggle?: (
    participantId: string,
    enabled: boolean
  ) => void;
  public onParticipantAudioToggle?: (
    participantId: string,
    enabled: boolean
  ) => void;
  public onParticipantScreenShare?: (
    participantId: string,
    enabled: boolean,
    stream?: MediaStream
  ) => void;
  public onParticipantHandRaised?: (
    participantId: string,
    raised: boolean,
    name: string
  ) => void;
  public onNewMessage?: (message: ChatMessage) => void;
  public onMeetingJoined?: (participants: Participant[]) => void;
  public onJoinRequest?: (request: {
    id: string;
    name: string;
    email?: string;
  }) => void;
  public onJoinApproved?: () => void;
  public onJoinRejected?: () => void;
  public onActiveSpeakerChanged?: (participantId: string | null, participantName?: string) => void;
  public onScreenShareStarted?: (participantId: string, stream: MediaStream) => void;
  public onScreenShareStopped?: (participantId: string) => void;

  private iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ];

  connect() {
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log("🎥 [WebRTC] Connecting to WebRTC server at:", serverUrl);

    console.log("Connecting to WebRTC server:", serverUrl);
    this.socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Connected to WebRTC server");
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from WebRTC server");
    });

    this.socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });

    this.socket.on("meeting-joined", ({ participants }) => {
      console.log("📹 Meeting joined with participants:", participants);
      this.onMeetingJoined?.(participants);
    });

    this.socket.on("user-joined", ({ participant }) => {
      this.createPeerConnection(participant.id);
      this.onParticipantJoined?.(participant);
    });

    this.socket.on("user-left", ({ participantId }) => {
      this.removePeerConnection(participantId);
      this.onParticipantLeft?.(participantId);
    });

    this.socket.on("offer", async ({ offer, senderId }) => {
      await this.handleOffer(offer, senderId);
    });

    this.socket.on("answer", async ({ answer, senderId }) => {
      await this.handleAnswer(answer, senderId);
    });

    this.socket.on("ice-candidate", async ({ candidate, senderId }) => {
      await this.handleIceCandidate(candidate, senderId);
    });

    this.socket.on("participant-video-toggle", ({ participantId, enabled }) => {
      this.onParticipantVideoToggle?.(participantId, enabled);
    });

    this.socket.on("participant-audio-toggle", ({ participantId, enabled }) => {
      this.onParticipantAudioToggle?.(participantId, enabled);
    });

    this.socket.on("participant-screen-share", ({ participantId, enabled, stream }) => {
      console.log(`📺 [WebRTC] Screen share ${enabled ? 'started' : 'stopped'} by ${participantId}`);
      this.onParticipantScreenShare?.(participantId, enabled, stream);
      
      if (enabled && stream) {
        this.onScreenShareStarted?.(participantId, stream);
      } else {
        this.onScreenShareStopped?.(participantId);
      }
    });

    this.socket.on(
      "participant-hand-raised",
      ({ participantId, raised, participantName }) => {
        this.onParticipantHandRaised?.(participantId, raised, participantName);
      }
    );

    this.socket.on("new-message", (message) => {
      this.onNewMessage?.(message);
    });

    this.socket.on("join-request", (request) => {
      this.onJoinRequest?.(request);
    });

    this.socket.on("join-approved", () => {
      this.onJoinApproved?.();
    });

    this.socket.on("join-rejected", () => {
      this.onJoinRejected?.();
    });

    // Voice activity detection
    this.socket.on("voice-activity", ({ participantId, participantName, isActive }) => {
      console.log(`🎤 [WebRTC] Voice activity: ${participantName} (${participantId}) - ${isActive ? 'speaking' : 'silent'}`);
      
      if (isActive && this.activeSpeaker !== participantId) {
        this.activeSpeaker = participantId;
        this.onActiveSpeakerChanged?.(participantId, participantName);
      } else if (!isActive && this.activeSpeaker === participantId) {
        // Clear active speaker after a delay
        if (this.voiceActivityTimer) {
          clearTimeout(this.voiceActivityTimer);
        }
        this.voiceActivityTimer = setTimeout(() => {
          this.activeSpeaker = null;
          this.onActiveSpeakerChanged?.(null);
        }, 1000);
      }
    });

    // Screen share stream handling
    this.socket.on("screen-share-stream", ({ participantId, stream }) => {
      console.log(`📺 [WebRTC] Received screen share stream from ${participantId}`);
      this.screenStreams.set(participantId, stream);
      this.onScreenShareStarted?.(participantId, stream);
    });
  }

  async joinMeeting(
    meetingId: string,
    userInfo: { name: string; email?: string; isHost?: boolean }
  ) {
    console.log("🎥 [WebRTC] Starting joinMeeting process...");
    console.log("🎥 [WebRTC] Meeting ID:", meetingId);
    console.log("🎥 [WebRTC] User Info:", userInfo);
    console.log("🎥 [WebRTC] Socket connected:", !!this.socket);

    if (!this.socket) {
      console.error("❌ [WebRTC] No socket connection available");
      return;
    }

    this.meetingId = meetingId;

    try {
      console.log("🎥 [WebRTC] Requesting user media...");
      console.log("🎥 [WebRTC] Media constraints:", {
        video: true,
        audio: true,
      });

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser");
      }

      // Get user media first
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      // Setup voice activity detection
      this.setupVoiceActivityDetection();

      console.log("✅ [WebRTC] Got local stream successfully");
      console.log(
        "🎥 [WebRTC] Stream tracks:",
        this.localStream.getTracks().map((t) => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
          label: t.label,
        }))
      );

      // Verify stream is active
      const videoTrack = this.localStream.getVideoTracks()[0];
      const audioTrack = this.localStream.getAudioTracks()[0];

      if (videoTrack) {
        console.log("📹 [WebRTC] Video track details:", {
          enabled: videoTrack.enabled,
          readyState: videoTrack.readyState,
          settings: videoTrack.getSettings(),
          constraints: videoTrack.getConstraints(),
        });
      } else {
        console.warn("⚠️ [WebRTC] No video track found in stream");
      }

      if (audioTrack) {
        console.log("🎤 [WebRTC] Audio track details:", {
          enabled: audioTrack.enabled,
          readyState: audioTrack.readyState,
          settings: audioTrack.getSettings(),
        });
      } else {
        console.warn("⚠️ [WebRTC] No audio track found in stream");
      }

      // Ensure stream is ready before proceeding
      console.log("⏳ [WebRTC] Waiting for stream to stabilize...");
      await new Promise((resolve) => setTimeout(resolve, 200));

      console.log("📡 [WebRTC] Emitting join-meeting event...");
      this.socket.emit("join-meeting", { meetingId, userInfo });
    } catch (error) {
      console.error("❌ [WebRTC] Failed to get user media:", error);
      console.error("❌ [WebRTC] Error details:", {
        name: error.name,
        message: error.message,
        constraint: error.constraint,
      });

      // Try with lower constraints if the initial request fails
      if (
        error.name === "OverconstrainedError" ||
        error.name === "NotReadableError"
      ) {
        console.log("🔄 [WebRTC] Retrying with basic constraints...");
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          console.log("✅ [WebRTC] Got local stream with basic constraints");
          this.socket.emit("join-meeting", { meetingId, userInfo });
        } catch (retryError) {
          console.error("❌ [WebRTC] Retry also failed:", retryError);
          throw retryError;
        }
      } else {
        throw error;
      }
    }
  }

  private createPeerConnection(participantId: string) {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10,
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        const sender = peerConnection.addTrack(track, this.localStream!);
        console.log(`📡 [WebRTC] Added ${track.kind} track to peer connection for ${participantId}`);
      });
    }

    // Handle remote stream with better detection
    peerConnection.ontrack = (event) => {
      console.log(`📡 [WebRTC] Received ${event.track.kind} track from ${participantId}`);
      const [remoteStream] = event.streams;
      
      // Determine if this is a screen share stream
      const isScreenShare = event.track.label.includes('screen') || 
                           event.track.label.includes('window') ||
                           event.track.label.includes('tab');
      
      if (isScreenShare) {
        console.log(`📺 [WebRTC] Screen share stream received from ${participantId}`);
        this.screenStreams.set(participantId, remoteStream);
        this.onRemoteStream?.(participantId, remoteStream, 'screen');
        this.onScreenShareStarted?.(participantId, remoteStream);
      } else {
        console.log(`📹 [WebRTC] Camera stream received from ${participantId}`);
        this.remoteStreams.set(participantId, remoteStream);
        this.onRemoteStream?.(participantId, remoteStream, 'camera');
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit("ice-candidate", {
          meetingId: this.meetingId,
          candidate: event.candidate,
          targetId: participantId,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔗 [WebRTC] Connection state with ${participantId}: ${peerConnection.connectionState}`);
      if (peerConnection.connectionState === 'failed') {
        console.log(`🔄 [WebRTC] Attempting to restart ICE for ${participantId}`);
        peerConnection.restartIce();
      }
    };

    this.peerConnections.set(participantId, peerConnection);

    // Create and send offer
    this.createOffer(participantId);
  }

  private async createOffer(participantId: string) {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection || !this.socket) return;

    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peerConnection.setLocalDescription(offer);

      console.log(`📤 [WebRTC] Sending offer to ${participantId}`);
      this.socket.emit("offer", {
        meetingId: this.meetingId,
        offer,
        targetId: participantId,
      });
    } catch (error) {
      console.error(`❌ [WebRTC] Failed to create offer for ${participantId}:`, error);
    }
  }

  private async handleOffer(
    offer: RTCSessionDescriptionInit,
    senderId: string
  ) {
    console.log(`📥 [WebRTC] Received offer from ${senderId}`);
    let peerConnection = this.peerConnections.get(senderId);

    if (!peerConnection) {
      peerConnection = new RTCPeerConnection({ 
        iceServers: this.iceServers,
        iceCandidatePoolSize: 10,
      });

      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          peerConnection!.addTrack(track, this.localStream!);
          console.log(`📡 [WebRTC] Added ${track.kind} track for ${senderId}`);
        });
      }

      // Handle remote stream with better detection
      peerConnection.ontrack = (event) => {
        console.log(`📡 [WebRTC] Received ${event.track.kind} track from ${senderId}`);
        const [remoteStream] = event.streams;
        
        // Determine if this is a screen share stream
        const isScreenShare = event.track.label.includes('screen') || 
                             event.track.label.includes('window') ||
                             event.track.label.includes('tab');
        
        if (isScreenShare) {
          console.log(`📺 [WebRTC] Screen share stream received from ${senderId}`);
          this.screenStreams.set(senderId, remoteStream);
          this.onRemoteStream?.(senderId, remoteStream, 'screen');
          this.onScreenShareStarted?.(senderId, remoteStream);
        } else {
          console.log(`📹 [WebRTC] Camera stream received from ${senderId}`);
          this.remoteStreams.set(senderId, remoteStream);
          this.onRemoteStream?.(senderId, remoteStream, 'camera');
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.socket) {
          this.socket.emit("ice-candidate", {
            meetingId: this.meetingId,
            candidate: event.candidate,
            targetId: senderId,
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`🔗 [WebRTC] Connection state with ${senderId}: ${peerConnection!.connectionState}`);
        if (peerConnection!.connectionState === 'failed') {
          console.log(`🔄 [WebRTC] Attempting to restart ICE for ${senderId}`);
          peerConnection!.restartIce();
        }
      };

      this.peerConnections.set(senderId, peerConnection);
    }

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log(`📤 [WebRTC] Sending answer to ${senderId}`);
      if (this.socket) {
        this.socket.emit("answer", {
          meetingId: this.meetingId,
          answer,
          targetId: senderId,
        });
      }
    } catch (error) {
      console.error(`❌ [WebRTC] Failed to handle offer from ${senderId}:`, error);
    }
  }

  private async handleAnswer(
    answer: RTCSessionDescriptionInit,
    senderId: string
  ) {
    console.log(`📥 [WebRTC] Received answer from ${senderId}`);
    const peerConnection = this.peerConnections.get(senderId);
    if (!peerConnection) {
      console.warn(`⚠️ [WebRTC] No peer connection found for ${senderId}`);
      return;
    }

    try {
      await peerConnection.setRemoteDescription(answer);
      console.log(`✅ [WebRTC] Set remote description for ${senderId}`);
    } catch (error) {
      console.error(`❌ [WebRTC] Failed to handle answer from ${senderId}:`, error);
    }
  }

  private async handleIceCandidate(
    candidate: RTCIceCandidateInit,
    senderId: string
  ) {
    const peerConnection = this.peerConnections.get(senderId);
    if (!peerConnection) {
      console.warn(`⚠️ [WebRTC] No peer connection found for ICE candidate from ${senderId}`);
      return;
    }

    try {
      await peerConnection.addIceCandidate(candidate);
      console.log(`✅ [WebRTC] Added ICE candidate from ${senderId}`);
    } catch (error) {
      console.error(`❌ [WebRTC] Failed to handle ICE candidate from ${senderId}:`, error);
    }
  }

  private removePeerConnection(participantId: string) {
    console.log(`🔌 [WebRTC] Removing peer connection for ${participantId}`);
    
    const peerConnection = this.peerConnections.get(participantId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(participantId);
    }
    
    this.remoteStreams.delete(participantId);
    this.screenStreams.delete(participantId);
    
    // Clear active speaker if it was this participant
    if (this.activeSpeaker === participantId) {
      this.activeSpeaker = null;
      this.onActiveSpeakerChanged?.(null);
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream && this.socket) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
        this.socket.emit("toggle-video", {
          meetingId: this.meetingId,
          enabled,
        });
      }
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream && this.socket) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
        this.socket.emit("toggle-audio", {
          meetingId: this.meetingId,
          enabled,
        });
      }
    }
  }

  async startScreenShare() {
    try {
      console.log('🖥️ [WebRTC] Starting screen share...');
      
      // Request screen share with audio if possible
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      console.log('✅ [WebRTC] Screen share stream obtained');
      console.log('📺 [WebRTC] Screen tracks:', this.screenStream.getTracks().map(t => ({ kind: t.kind, label: t.label })));

      // Replace video track in all peer connections
      const videoTrack = this.screenStream.getVideoTracks()[0];
      if (videoTrack) {
        console.log('🔄 [WebRTC] Replacing video tracks with screen share...');
        
        const replacePromises = Array.from(this.peerConnections.entries()).map(async ([participantId, peerConnection]) => {
          try {
            const sender = peerConnection
              .getSenders()
              .find((s) => s.track && s.track.kind === "video");
            if (sender) {
              await sender.replaceTrack(videoTrack);
              console.log(`✅ [WebRTC] Replaced video track for ${participantId}`);
            } else {
              // Add the track if no video sender exists
              peerConnection.addTrack(videoTrack, this.screenStream!);
              console.log(`➕ [WebRTC] Added screen share track for ${participantId}`);
            }
          } catch (error) {
            console.error(`❌ [WebRTC] Failed to replace track for ${participantId}:`, error);
          }
        });

        await Promise.all(replacePromises);
      }

      // Handle audio track if present
      const audioTrack = this.screenStream.getAudioTracks()[0];
      if (audioTrack) {
        console.log('🔊 [WebRTC] Screen share includes audio');
        // Optionally handle screen audio
      }

      if (this.socket) {
        this.socket.emit("toggle-screen-share", {
          meetingId: this.meetingId,
          enabled: true,
        });
      }

      // Handle screen share end
      videoTrack.onended = () => {
        console.log('🛑 [WebRTC] Screen share ended by user');
        this.stopScreenShare();
      };

      return true;
    } catch (error) {
      console.error("❌ [WebRTC] Failed to start screen share:", error);
      
      // Provide user-friendly error messages
      if (error.name === 'NotAllowedError') {
        alert('Screen sharing was denied. Please allow screen sharing and try again.');
      } else if (error.name === 'NotSupportedError') {
        alert('Screen sharing is not supported in this browser.');
      } else {
        alert('Failed to start screen sharing. Please try again.');
      }
      
      return false;
    }
  }

  async stopScreenShare() {
    console.log('🛑 [WebRTC] Stopping screen share...');
    
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`🛑 [WebRTC] Stopped ${track.kind} track`);
      });
      this.screenStream = null;
    }

    // Replace back to camera
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        console.log('🔄 [WebRTC] Switching back to camera...');
        
        const replacePromises = Array.from(this.peerConnections.entries()).map(async ([participantId, peerConnection]) => {
          try {
            const sender = peerConnection
              .getSenders()
              .find((s) => s.track && s.track.kind === "video");
            if (sender) {
              await sender.replaceTrack(videoTrack);
              console.log(`✅ [WebRTC] Restored camera for ${participantId}`);
            }
          } catch (error) {
            console.error(`❌ [WebRTC] Failed to restore camera for ${participantId}:`, error);
          }
        });

        await Promise.all(replacePromises);
      }
    }

    if (this.socket) {
      this.socket.emit("toggle-screen-share", {
        meetingId: this.meetingId,
        enabled: false,
      });
    }

    console.log('✅ [WebRTC] Screen share stopped successfully');
  }

  raiseHand(raised: boolean) {
    if (this.socket) {
      this.socket.emit("raise-hand", { meetingId: this.meetingId, raised });
    }
  }

  sendMessage(message: string) {
    if (this.socket) {
      this.socket.emit("send-message", { meetingId: this.meetingId, message });
    }
  }

  requestToJoin(
    meetingId: string,
    userInfo: { name: string; email?: string; isHost?: boolean }
  ) {
    if (this.socket) {
      this.socket.emit("request-join", { meetingId, userInfo });
    }
  }

  approveJoinRequest(requestId: string) {
    if (this.socket) {
      this.socket.emit("approve-join", { requestId });
    }
  }

  rejectJoinRequest(requestId: string) {
    if (this.socket) {
      this.socket.emit("reject-join", { requestId });
    }
  }

  leaveMeeting() {
    console.log('👋 [WebRTC] Leaving meeting...');
    
    if (this.socket) {
      this.socket.emit("leave-meeting", { meetingId: this.meetingId });
    }

    // Clean up voice activity detection
    if (this.voiceActivityTimer) {
      clearTimeout(this.voiceActivityTimer);
      this.voiceActivityTimer = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clean up streams
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`🛑 [WebRTC] Stopped local ${track.kind} track`);
      });
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`🛑 [WebRTC] Stopped screen ${track.kind} track`);
      });
      this.screenStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((pc, participantId) => {
      pc.close();
      console.log(`🔌 [WebRTC] Closed peer connection for ${participantId}`);
    });
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.screenStreams.clear();

    // Reset state
    this.activeSpeaker = null;
    this.meetingId = null;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 [WebRTC] Disconnected from server');
    }

    console.log('✅ [WebRTC] Meeting left successfully');
  }

  getLocalStream() {
    console.log(
      "🔍 [WebRTC] Getting local stream:",
      this.localStream ? "Available" : "Not available"
    );
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      console.log(
        "🔍 [WebRTC] Stream tracks:",
        tracks.map((t) => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
          id: t.id,
        }))
      );
      console.log("🔍 [WebRTC] Stream active:", this.localStream.active);
      console.log("🔍 [WebRTC] Stream ID:", this.localStream.id);
    } else {
      console.warn("⚠️ [WebRTC] Local stream is null or undefined");
    }
    return this.localStream;
  }

  getRemoteStream(participantId: string) {
    return this.remoteStreams.get(participantId);
  }

  getScreenStream(participantId: string) {
    return this.screenStreams.get(participantId);
  }

  getActiveSpeaker() {
    return this.activeSpeaker;
  }

  // Voice Activity Detection
  private setupVoiceActivityDetection() {
    if (!this.localStream) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.analyser = this.audioContext.createAnalyser();
      
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let isSpeaking = false;
      const SPEAKING_THRESHOLD = 30; // Adjust as needed
      const SILENCE_THRESHOLD = 15;
      
      const checkVoiceActivity = () => {
        if (!this.analyser) return;
        
        this.analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        
        const wasSpeaking = isSpeaking;
        isSpeaking = average > SPEAKING_THRESHOLD;
        
        // Only emit when state changes
        if (isSpeaking !== wasSpeaking) {
          if (this.socket && this.meetingId) {
            this.socket.emit('voice-activity', {
              meetingId: this.meetingId,
              isActive: isSpeaking,
              audioLevel: average
            });
          }
        }
        
        // Continue monitoring
        requestAnimationFrame(checkVoiceActivity);
      };
      
      checkVoiceActivity();
      console.log('🎤 [WebRTC] Voice activity detection setup complete');
    } catch (error) {
      console.warn('⚠️ [WebRTC] Failed to setup voice activity detection:', error);
    }
  }

  isLocalStreamReady() {
    const isReady =
      this.localStream !== null &&
      this.localStream.getTracks().length > 0 &&
      this.localStream.active;
    console.log("🔍 [WebRTC] Stream ready check:", {
      hasStream: !!this.localStream,
      trackCount: this.localStream?.getTracks().length || 0,
      isActive: this.localStream?.active || false,
      isReady,
    });
    return isReady;
  }

  // Enhanced screen sharing with better error handling
  async requestScreenShare(): Promise<boolean> {
    try {
      // Check if screen sharing is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing is not supported in this browser');
      }

      return await this.startScreenShare();
    } catch (error) {
      console.error('❌ [WebRTC] Screen share request failed:', error);
      return false;
    }
  }

  // Get all remote streams (both camera and screen)
  getAllRemoteStreams() {
    return {
      camera: new Map(this.remoteStreams),
      screen: new Map(this.screenStreams)
    };
  }

  // Check if participant is sharing screen
  isParticipantSharingScreen(participantId: string): boolean {
    return this.screenStreams.has(participantId);
  }

  // Get connection quality info
  async getConnectionStats(participantId: string) {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection) return null;

    try {
      const stats = await peerConnection.getStats();
      const connectionStats = {
        bytesReceived: 0,
        bytesSent: 0,
        packetsLost: 0,
        roundTripTime: 0,
        jitter: 0
      };

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp') {
          connectionStats.bytesReceived += report.bytesReceived || 0;
          connectionStats.packetsLost += report.packetsLost || 0;
          connectionStats.jitter += report.jitter || 0;
        } else if (report.type === 'outbound-rtp') {
          connectionStats.bytesSent += report.bytesSent || 0;
        } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          connectionStats.roundTripTime = report.currentRoundTripTime || 0;
        }
      });

      return connectionStats;
    } catch (error) {
      console.error('Failed to get connection stats:', error);
      return null;
    }
  }
}

export const webRTCService = new WebRTCService();