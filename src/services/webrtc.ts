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
  private meetingId: string | null = null;

  // Event callbacks
  public onParticipantJoined?: (participant: Participant) => void;
  public onParticipantLeft?: (participantId: string) => void;
  public onRemoteStream?: (participantId: string, stream: MediaStream) => void;
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
    enabled: boolean
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

  private iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  connect() {
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log("🎥 [WebRTC] Connecting to WebRTC server at:", serverUrl);

    console.log("Connecting to WebRTC server:", serverUrl);
    this.socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
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

    this.socket.on("participant-screen-share", ({ participantId, enabled }) => {
      this.onParticipantScreenShare?.(participantId, enabled);
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
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

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
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.remoteStreams.set(participantId, remoteStream);
      this.onRemoteStream?.(participantId, remoteStream);
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

    this.peerConnections.set(participantId, peerConnection);

    // Create and send offer
    this.createOffer(participantId);
  }

  private async createOffer(participantId: string) {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection || !this.socket) return;

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      this.socket.emit("offer", {
        meetingId: this.meetingId,
        offer,
        targetId: participantId,
      });
    } catch (error) {
      console.error("Failed to create offer:", error);
    }
  }

  private async handleOffer(
    offer: RTCSessionDescriptionInit,
    senderId: string
  ) {
    let peerConnection = this.peerConnections.get(senderId);

    if (!peerConnection) {
      peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        this.remoteStreams.set(senderId, remoteStream);
        this.onRemoteStream?.(senderId, remoteStream);
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

      this.peerConnections.set(senderId, peerConnection);
    }

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (this.socket) {
        this.socket.emit("answer", {
          meetingId: this.meetingId,
          answer,
          targetId: senderId,
        });
      }
    } catch (error) {
      console.error("Failed to handle offer:", error);
    }
  }

  private async handleAnswer(
    answer: RTCSessionDescriptionInit,
    senderId: string
  ) {
    const peerConnection = this.peerConnections.get(senderId);
    if (!peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error("Failed to handle answer:", error);
    }
  }

  private async handleIceCandidate(
    candidate: RTCIceCandidateInit,
    senderId: string
  ) {
    const peerConnection = this.peerConnections.get(senderId);
    if (!peerConnection) return;

    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error("Failed to handle ICE candidate:", error);
    }
  }

  private removePeerConnection(participantId: string) {
    const peerConnection = this.peerConnections.get(participantId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(participantId);
    }
    this.remoteStreams.delete(participantId);
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
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      // Replace video track in all peer connections
      const videoTrack = this.screenStream.getVideoTracks()[0];
      this.peerConnections.forEach(async (peerConnection) => {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });

      if (this.socket) {
        this.socket.emit("toggle-screen-share", {
          meetingId: this.meetingId,
          enabled: true,
        });
      }

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return true;
    } catch (error) {
      console.error("Failed to start screen share:", error);
      return false;
    }
  }

  async stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Replace back to camera
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      this.peerConnections.forEach(async (peerConnection) => {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });
    }

    if (this.socket) {
      this.socket.emit("toggle-screen-share", {
        meetingId: this.meetingId,
        enabled: false,
      });
    }
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
    if (this.socket) {
      this.socket.emit("leave-meeting", { meetingId: this.meetingId });
    }

    // Clean up streams
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.remoteStreams.clear();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
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
}

export const webRTCService = new WebRTCService();
