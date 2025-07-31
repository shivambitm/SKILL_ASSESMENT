import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import { pool } from '../config/database';

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
    
    const [rows] = await pool.execute(
      `SELECT cs.*, 
       (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id) as message_count,
       (SELECT message FROM chat_messages WHERE session_id = cs.id ORDER BY created_at ASC LIMIT 1) as first_message
       FROM chat_sessions cs 
       WHERE cs.user_id = ? 
       ORDER BY cs.updated_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      sessions: rows
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
    const [sessionRows] = await pool.execute(
      'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if ((sessionRows as any[]).length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const [messages] = await pool.execute(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );

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

    const [result] = await pool.execute(
      'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
      [userId, sessionTitle]
    );

    const sessionId = (result as any).lastInsertRowid;

    res.json({
      success: true,
      session: {
        id: sessionId,
        title: sessionTitle,
        created_at: new Date().toISOString()
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

    await pool.execute(
      'DELETE FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

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
      const [sessionRows] = await pool.execute(
        'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
        [sessionId, userId]
      );

      if ((sessionRows as any[]).length > 0) {
        // Save message and response
        await pool.execute(
          'INSERT INTO chat_messages (session_id, message, response) VALUES (?, ?, ?)',
          [sessionId, message, text]
        );

        // Update session timestamp
        await pool.execute(
          'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [sessionId]
        );
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