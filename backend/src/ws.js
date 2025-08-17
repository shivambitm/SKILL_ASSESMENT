console.log('🔌 [WebSocket] Initializing WebSocket server...');
const { Server } = require('socket.io');
const Meeting = require('./models/Meeting');

function attachWs(server) {
  console.log('🔌 [WebSocket] Setting up Socket.IO server...');
  
  const io = new Server(server, { 
    path: process.env.WS_PATH || '/socket.io', 
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173' } 
  });

  io.on('connection', (socket) => {
    console.log('🔌 [WebSocket] Client connected:', socket.id);

    socket.on('join-room', ({ roomId, email }) => {
      console.log(`👤 [WebSocket] User ${email} joining room ${roomId}`);
      socket.data = { roomId, email, breakoutId: null };
      socket.join(roomId);
      io.to(roomId).emit('presence', { email, type:'join' });
    });

    socket.on('create-breakouts', async ({ roomId, breakouts }) => {
      console.log(`🏠 [WebSocket] Creating breakouts for room ${roomId}:`, breakouts);
      
      try {
        // breakouts: [{ breakoutId, name }]
        const meeting = await Meeting.findOne({ roomId });
        if (!meeting) {
          console.error('❌ [WebSocket] Meeting not found:', roomId);
          return;
        }
        
        meeting.breakouts = breakouts.map(b => ({ ...b, participants: [] }));
        await meeting.save();
        
        console.log('✅ [WebSocket] Breakouts created successfully');
        io.to(roomId).emit('breakouts-updated', meeting.breakouts);
      } catch (error) {
        console.error('❌ [WebSocket] Failed to create breakouts:', error);
      }
    });

    socket.on('move-to-breakout', async ({ roomId, email, breakoutId }) => {
      console.log(`🚶 [WebSocket] Moving ${email} to breakout ${breakoutId} in room ${roomId}`);
      
      try {
        const meeting = await Meeting.findOne({ roomId });
        if (!meeting) {
          console.error('❌ [WebSocket] Meeting not found:', roomId);
          return;
        }
        
        const breakout = meeting.breakouts.find(b => b.breakoutId === breakoutId);
        if (!breakout) {
          console.error('❌ [WebSocket] Breakout not found:', breakoutId);
          return;
        }
        
        // Update membership
        meeting.breakouts.forEach(b => { 
          b.participants = b.participants.filter(e => e !== email); 
        });
        breakout.participants.push(email);
        await meeting.save();

        // Leave main room and join breakout channel
        const prev = socket.data.breakoutId;
        if (prev) socket.leave(`${roomId}:${prev}`);
        socket.join(`${roomId}:${breakoutId}`);
        socket.data.breakoutId = breakoutId;

        console.log(`✅ [WebSocket] User moved to breakout successfully`);
        io.to(roomId).emit('breakouts-updated', meeting.breakouts);
        io.to(`${roomId}:${breakoutId}`).emit('system', `${email} joined breakout ${breakout.name}`);
      } catch (error) {
        console.error('❌ [WebSocket] Failed to move to breakout:', error);
      }
    });

    socket.on('recall-from-breakouts', async ({ roomId }) => {
      console.log(`📢 [WebSocket] Recalling all participants from breakouts in room ${roomId}`);
      
      try {
        const meeting = await Meeting.findOne({ roomId });
        if (!meeting) {
          console.error('❌ [WebSocket] Meeting not found:', roomId);
          return;
        }
        
        meeting.breakouts.forEach(b => b.participants = []);
        await meeting.save();
        
        console.log('✅ [WebSocket] All participants recalled from breakouts');
        // Move sockets back logically; clients should leave breakout and subscribe to main
        io.to(roomId).emit('breakouts-recall');
      } catch (error) {
        console.error('❌ [WebSocket] Failed to recall from breakouts:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 [WebSocket] Client disconnected:', socket.id);
      const { roomId, email } = socket.data || {};
      if (roomId && email) {
        console.log(`👋 [WebSocket] User ${email} left room ${roomId}`);
        io.to(roomId).emit('presence', { email, type:'leave' });
      }
    });
  });

  console.log('✅ [WebSocket] WebSocket server initialized successfully');
  return io;
}

module.exports = { attachWs };