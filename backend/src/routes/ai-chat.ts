import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import { ChatSession, ChatMessage } from '../models';

const router = Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Generate smart title from message
const generateTitle = (message: string): string => {
  const words = message.split(' ').slice(0, 6).join(' ');
  return words.length > 50 ? words.substring(0, 47) + '...' : words;
};

// Get all chat sessions for user
router.get('/sessions', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const sessions = await ChatSession.find({ user_id: userId })
      .sort({ updated_at: -1 })
      .lean();

    // Get message counts and first messages
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const messageCount = await ChatMessage.countDocuments({ session_id: session._id });
        const firstMessage = await ChatMessage.findOne({ session_id: session._id })
          .sort({ created_at: 1 })
          .select('message')
          .lean();
        
        return {
          ...session,
          message_count: messageCount,
          first_message: firstMessage?.message || null
        };
      })
    );

    res.json({
      success: true,
      sessions: sessionsWithDetails
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get chat sessions' });
  }
});

// Get messages for a specific session
router.get('/sessions/:sessionId/messages', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.userId;

    // Verify session belongs to user
    const session = await ChatSession.findOne({ _id: sessionId, user_id: userId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = await ChatMessage.find({ session_id: sessionId })
      .sort({ created_at: 1 })
      .lean();

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Create new chat session
router.post('/sessions', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { title, firstMessage } = req.body;
    
    const sessionTitle = title || (firstMessage ? generateTitle(firstMessage) : 'New Chat');

    const session = new ChatSession({
      user_id: userId,
      title: sessionTitle
    });

    await session.save();

    res.json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        created_at: session.created_at
      }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Delete chat session
router.delete('/sessions/:sessionId', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.userId;

    // Delete session and its messages
    await ChatSession.deleteOne({ _id: sessionId, user_id: userId });
    await ChatMessage.deleteMany({ session_id: sessionId });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Chat with AI endpoint (Admin only)
router.post('/chat', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body;
    const userId = (req as any).user.userId;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Enhanced prompt for educational context
    const systemPrompt = `You are an AI assistant for a Skill Assessment & Reporting Portal. You help administrators with:
1. Creating quiz questions for various skills
2. Educational content and study materials
3. Skill assessment strategies
4. HR and recruitment insights
5. General educational guidance

Context: This is an educational platform for skill assessment. Please provide helpful, accurate, and professional responses.

User Query: ${message}`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    // Save to database if sessionId provided
    if (sessionId) {
      // Verify session belongs to user
      const session = await ChatSession.findOne({ _id: sessionId, user_id: userId });
      
      if (session) {
        // Save message and response
        const chatMessage = new ChatMessage({
          session_id: sessionId,
          message,
          response: text
        });
        await chatMessage.save();

        // Update session timestamp
        session.updated_at = new Date();
        await session.save();
      }
    }

    res.json({
      success: true,
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;