import express from 'express';
import { Server } from 'socket.io';
import { authenticate, CustomRequest } from '../middleware/auth';

const router = express.Router();

interface MeetingRoom {
  id: string;
  hostId: string;
  participants: Map<string, ParticipantInfo>;
  createdAt: Date;
}

interface ParticipantInfo {
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

const meetings = new Map<string, MeetingRoom>();

// Create meeting
router.post('/create', authenticate, (req: CustomRequest, res) => {
  const { meetingId: providedMeetingId } = req.body;
  const meetingId = providedMeetingId || Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const meeting: MeetingRoom = {
    id: meetingId,
    hostId: req.user!.userId.toString(),
    participants: new Map(),
    createdAt: new Date()
  };
  
  meetings.set(meetingId, meeting);
  console.log(`🎥 Meeting created: ${meetingId} by user ${req.user!.userId}`);
  
  res.json({
    success: true,
    meetingId,
    meetingUrl: `${process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173'}/join/${meetingId}`
  });
});

// Get meeting info
router.get('/:meetingId', (req, res) => {
  const { meetingId } = req.params;
  const meeting = meetings.get(meetingId);
  
  if (!meeting) {
    return res.status(404).json({ success: false, message: 'Meeting not found' });
  }
  
  res.json({
    success: true,
    meeting: {
      id: meeting.id,
      participantCount: meeting.participants.size,
      createdAt: meeting.createdAt
    }
  });
});

// Socket.IO setup for real-time communication
export const setupMeetingSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join meeting
    socket.on('join-meeting', ({ meetingId, userInfo }) => {
      const meeting = meetings.get(meetingId);
      if (!meeting) {
        socket.emit('error', { message: 'Meeting not found' });
        return;
      }

      // Add participant to meeting
      const participant: ParticipantInfo = {
        id: socket.id,
        name: userInfo.name,
        email: userInfo.email,
        isHost: userInfo.isHost || false,
        videoEnabled: userInfo.videoEnabled || true,
        audioEnabled: userInfo.audioEnabled || true,
        screenSharing: false,
        handRaised: false,
        joinedAt: new Date()
      };

      meeting.participants.set(socket.id, participant);
      socket.join(meetingId);

      // Notify all participants about new user
      socket.to(meetingId).emit('user-joined', {
        participant,
        participantCount: meeting.participants.size
      });

      // Send current participants to new user
      const participants = Array.from(meeting.participants.values());
      socket.emit('meeting-joined', {
        participants,
        meetingId
      });

      console.log(`User ${userInfo.name} joined meeting ${meetingId}`);
    });

    // Handle WebRTC signaling
    socket.on('offer', ({ meetingId, offer, targetId }) => {
      socket.to(targetId).emit('offer', {
        offer,
        senderId: socket.id
      });
    });

    socket.on('answer', ({ meetingId, answer, targetId }) => {
      socket.to(targetId).emit('answer', {
        answer,
        senderId: socket.id
      });
    });

    socket.on('ice-candidate', ({ meetingId, candidate, targetId }) => {
      socket.to(targetId).emit('ice-candidate', {
        candidate,
        senderId: socket.id
      });
    });

    // Handle media controls
    socket.on('toggle-video', ({ meetingId, enabled }) => {
      const meeting = meetings.get(meetingId);
      if (meeting && meeting.participants.has(socket.id)) {
        const participant = meeting.participants.get(socket.id)!;
        participant.videoEnabled = enabled;
        socket.to(meetingId).emit('participant-video-toggle', {
          participantId: socket.id,
          enabled
        });
      }
    });

    socket.on('toggle-audio', ({ meetingId, enabled }) => {
      const meeting = meetings.get(meetingId);
      if (meeting && meeting.participants.has(socket.id)) {
        const participant = meeting.participants.get(socket.id)!;
        participant.audioEnabled = enabled;
        socket.to(meetingId).emit('participant-audio-toggle', {
          participantId: socket.id,
          enabled
        });
      }
    });

    socket.on('toggle-screen-share', ({ meetingId, enabled }) => {
      const meeting = meetings.get(meetingId);
      if (meeting && meeting.participants.has(socket.id)) {
        const participant = meeting.participants.get(socket.id)!;
        participant.screenSharing = enabled;
        socket.to(meetingId).emit('participant-screen-share', {
          participantId: socket.id,
          enabled
        });
      }
    });

    socket.on('raise-hand', ({ meetingId, raised }) => {
      const meeting = meetings.get(meetingId);
      if (meeting && meeting.participants.has(socket.id)) {
        const participant = meeting.participants.get(socket.id)!;
        participant.handRaised = raised;
        socket.to(meetingId).emit('participant-hand-raised', {
          participantId: socket.id,
          raised,
          participantName: participant.name
        });
      }
    });

    // Chat messages
    socket.on('send-message', ({ meetingId, message }) => {
      const meeting = meetings.get(meetingId);
      if (meeting && meeting.participants.has(socket.id)) {
        const participant = meeting.participants.get(socket.id)!;
        const chatMessage = {
          id: Date.now().toString(),
          sender: participant.name,
          message,
          timestamp: new Date()
        };
        io.to(meetingId).emit('new-message', chatMessage);
      }
    });
    
    // Join request handling
    socket.on('request-join', ({ meetingId, userInfo }) => {
      const meeting = meetings.get(meetingId);
      if (meeting) {
        const joinRequest = {
          id: socket.id,
          name: userInfo.name,
          email: userInfo.email
        };
        
        // Send join request to host
        const hostId = meeting.hostId;
        const hostParticipant = Array.from(meeting.participants.values()).find(p => p.isHost);
        if (hostParticipant) {
          io.to(hostParticipant.id).emit('join-request', joinRequest);
          console.log(`📬 Join request from ${userInfo.name} sent to host`);
        }
      }
    });
    
    socket.on('approve-join', ({ requestId }) => {
      // Approve the join request
      io.to(requestId).emit('join-approved');
      console.log(`✅ Join request approved for ${requestId}`);
    });
    
    socket.on('reject-join', ({ requestId }) => {
      // Reject the join request
      io.to(requestId).emit('join-rejected');
      console.log(`❌ Join request rejected for ${requestId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove from all meetings
      meetings.forEach((meeting, meetingId) => {
        if (meeting.participants.has(socket.id)) {
          const participant = meeting.participants.get(socket.id)!;
          meeting.participants.delete(socket.id);
          
          // Notify other participants
          socket.to(meetingId).emit('user-left', {
            participantId: socket.id,
            participantName: participant.name,
            participantCount: meeting.participants.size
          });

          // Clean up empty meetings
          if (meeting.participants.size === 0) {
            meetings.delete(meetingId);
          }
        }
      });
    });

    socket.on('leave-meeting', ({ meetingId }) => {
      const meeting = meetings.get(meetingId);
      if (meeting && meeting.participants.has(socket.id)) {
        const participant = meeting.participants.get(socket.id)!;
        meeting.participants.delete(socket.id);
        socket.leave(meetingId);
        
        socket.to(meetingId).emit('user-left', {
          participantId: socket.id,
          participantName: participant.name,
          participantCount: meeting.participants.size
        });

        if (meeting.participants.size === 0) {
          meetings.delete(meetingId);
        }
      }
    });
  });
};

export default router;