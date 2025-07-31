import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Brain, BookOpen, Lightbulb, Search, Database, Zap, Plus, MessageSquare, Trash2, Menu, X, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { aiApi } from '../../services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  first_message?: string;
}

interface SearchStep {
  id: number;
  text: string;
  completed: boolean;
  icon: React.ElementType;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { theme } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, searchSteps, streamingText]);

  useEffect(() => {
    loadSessions();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (date: Date) => {
    const timeString = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    const dateString = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    return `${timeString} - ${dateString}`;
  };

  const loadSessions = async () => {
    try {
      const response = await aiApi.getSessions();
      setSessions(response.data.sessions || []);
      
      // Load first session if exists
      if (response.data.sessions && response.data.sessions.length > 0 && !currentSession) {
        loadSession(response.data.sessions[0]);
      } else if (!currentSession) {
        createNewSession();
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      createNewSession();
    }
  };

  const loadSession = async (session: ChatSession) => {
    try {
      const response = await aiApi.getSessionMessages(session.id);
      const loadedMessages: Message[] = [];
      
      // Add welcome message
      loadedMessages.push({
        id: '0',
        text: "Hello! I'm your AI assistant for the Skill Assessment Portal. I can help you with:\n\n• Creating quiz questions for any skill\n• Educational content and study materials\n• Skill assessment strategies\n• HR and recruitment insights\n• General educational guidance\n\nWhat would you like to know?",
        isUser: false,
        timestamp: new Date(session.created_at)
      });

      // Add conversation history
      response.data.messages.forEach((msg: any, index: number) => {
        loadedMessages.push({
          id: `user-${index}`,
          text: msg.message,
          isUser: true,
          timestamp: new Date(msg.created_at)
        });
        loadedMessages.push({
          id: `ai-${index}`,
          text: msg.response,
          isUser: false,
          timestamp: new Date(msg.created_at)
        });
      });

      setMessages(loadedMessages);
      setCurrentSession(session);
    } catch (error) {
      console.error('Failed to load session:', error);
      setCurrentSession(session);
      setMessages([{
        id: '1',
        text: "Hello! I'm your AI assistant for the Skill Assessment Portal. I can help you with:\n\n• Creating quiz questions for any skill\n• Educational content and study materials\n• Skill assessment strategies\n• HR and recruitment insights\n• General educational guidance\n\nWhat would you like to know?",
        isUser: false,
        timestamp: new Date()
      }]);
    }
  };

  const createNewSession = async () => {
    try {
      const now = new Date();
      const sessionTitle = `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      const response = await aiApi.createSession(sessionTitle);
      const newSession = response.data.session;
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([{
        id: '1',
        text: "Hello! I'm your AI assistant for the Skill Assessment Portal. I can help you with:\n\n• Creating quiz questions for any skill\n• Educational content and study materials\n• Skill assessment strategies\n• HR and recruitment insights\n• General educational guidance\n\nWhat would you like to know?",
        isUser: false,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const deleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await aiApi.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          loadSession(remainingSessions[0]);
        } else {
          createNewSession();
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const simulateSearch = async () => {
    const steps: SearchStep[] = [
      { id: 1, text: "Searching educational databases...", completed: false, icon: Database },
      { id: 2, text: "Analyzing skill assessment patterns...", completed: false, icon: Brain },
      { id: 3, text: "Reviewing best practices...", completed: false, icon: Search },
      { id: 4, text: "Generating personalized response...", completed: false, icon: Zap }
    ];

    setSearchSteps(steps);
    setIsSearching(true);

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSearchSteps(prev => 
        prev.map(step => 
          step.id === i + 1 ? { ...step, completed: true } : step
        )
      );
    }

    await new Promise(resolve => setTimeout(resolve, 200));
    setIsSearching(false);
    setSearchSteps([]);
  };

  const typeWriter = (text: string, callback: () => void) => {
    let i = 0;
    setStreamingText('');
    
    const timer = setInterval(() => {
      if (i < text.length) {
        setStreamingText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        setStreamingText('');
        callback();
      }
    }, 5); // Super fast typing
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Create session if none exists
    if (!currentSession) {
      await createNewSession();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Update session title with first message and timestamp
    if (messages.length <= 1) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const smartTitle = messageToSend.split(' ').slice(0, 4).join(' ');
      const titleWithTime = `${smartTitle.length > 30 ? smartTitle.substring(0, 27) + '...' : smartTitle} - ${timeStr} ${dateStr}`;
      const updatedSession = { ...currentSession, title: titleWithTime };
      setCurrentSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
    }

    await simulateSearch();

    try {
      const response = await aiApi.chat({
        message: messageToSend,
        context: 'skill_assessment_admin',
        sessionId: currentSession.id
      });

      const aiMessageId = (Date.now() + 1).toString();
      const streamingMessage: Message = {
        id: aiMessageId,
        text: '',
        isUser: false,
        timestamp: new Date(),
        isStreaming: true
      };

      setMessages(prev => [...prev, streamingMessage]);

      typeWriter(response.data.response, () => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: response.data.response, isStreaming: false }
              : msg
          )
        );
      });

      // Reload sessions to update counts
      loadSessions();

    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    { icon: BookOpen, text: "Generate JavaScript quiz questions", prompt: "Generate 5 JavaScript quiz questions for intermediate level" },
    { icon: Brain, text: "Skill assessment strategies", prompt: "What are the best practices for conducting skill assessments?" },
    { icon: Lightbulb, text: "HR recruitment tips", prompt: "Give me tips for evaluating technical candidates during recruitment" },
    { icon: Sparkles, text: "Create Python questions", prompt: "Create 3 Python programming questions for beginners" }
  ];

  // Theme-based styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'anime':
        return {
          background: 'bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900',
          sidebar: 'bg-gray-900/95 backdrop-blur-md border-pink-500/30',
          header: 'bg-gray-900/95 backdrop-blur-md border-pink-500/30',
          userMessage: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white',
          aiMessage: 'bg-gray-800/90 backdrop-blur-sm border border-pink-500/30 text-white',
          button: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700',
          text: 'text-white',
          textSecondary: 'text-pink-200',
          textMuted: 'text-pink-300/70'
        };
      case 'light':
        return {
          background: 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50',
          sidebar: 'bg-white/95 backdrop-blur-sm border-gray-300 shadow-lg',
          header: 'bg-white/95 backdrop-blur-sm border-gray-300',
          userMessage: 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white',
          aiMessage: 'bg-white/90 border border-gray-300 shadow-sm text-gray-900',
          button: 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800',
          text: 'text-gray-900',
          textSecondary: 'text-gray-700',
          textMuted: 'text-gray-600'
        };
      case 'premium':
      default:
        return {
          background: 'bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900',
          sidebar: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          header: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700',
          userMessage: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
          aiMessage: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          button: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
          text: 'text-gray-900 dark:text-white',
          textSecondary: 'text-gray-700 dark:text-gray-300',
          textMuted: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div className={`flex h-screen ${themeStyles.background}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-12'} transition-all duration-300 ${themeStyles.sidebar} border-r flex flex-col overflow-hidden`}>
        {/* Sidebar Toggle */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <button
                onClick={createNewSession}
                className={`flex-1 flex items-center gap-3 p-3 ${themeStyles.button} text-white rounded-lg transition-all mr-2`}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Chat</span>
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={createNewSession}
                className={`w-full p-2 ${themeStyles.button} text-white rounded-lg transition-all`}
                title="New Chat"
              >
                <Plus className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-5 h-5 mx-auto" />
              </button>
            </div>
          )}
        </div>

        {/* Chat Sessions */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto p-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => loadSession(session)}
                className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-2 ${
                  currentSession?.id === session.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${themeStyles.text} truncate`}>
                    {session.title}
                  </p>
                  <p className={`text-xs ${themeStyles.textMuted} truncate`}>
                    {session.message_count || 0} messages
                  </p>
                </div>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className={`${themeStyles.header} border-b p-4`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className={`p-2 ${themeStyles.button} rounded-lg`}>
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${themeStyles.text}`}>AI Assistant</h1>
              <p className={`text-sm ${themeStyles.textMuted}`}>Powered by skills.shivastra.in</p>
            </div>
          </div>
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className={`p-4 border-b ${theme === 'anime' ? 'border-pink-500/30' : theme === 'light' ? 'border-gray-300' : 'border-gray-200 dark:border-gray-700'}`}>
            <p className={`text-sm ${themeStyles.textMuted} mb-3`}>Quick actions:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(prompt.prompt)}
                  className={`flex items-center gap-2 p-3 text-left ${themeStyles.aiMessage} rounded-lg hover:opacity-80 transition-colors`}
                >
                  <prompt.icon className="w-4 h-4 text-blue-500" />
                  <span className={`text-sm ${themeStyles.textSecondary}`}>{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!message.isUser && (
                <div className={`flex-shrink-0 w-8 h-8 ${themeStyles.button} rounded-full flex items-center justify-center`}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className="relative group max-w-3xl">
                <div
                  className={`p-4 rounded-2xl ${
                    message.isUser ? themeStyles.userMessage : themeStyles.aiMessage
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.isStreaming ? streamingText : message.text}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                    )}
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.isUser ? 'text-blue-100' : themeStyles.textMuted
                  }`}>
                    {formatDateTime(message.timestamp)}
                  </div>
                </div>
                
                {/* Copy Button */}
                {!message.isUser && !message.isStreaming && (
                  <button
                    onClick={() => copyToClipboard(message.text, message.id)}
                    className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 ${theme === 'anime' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'} rounded-md transition-all`}
                    title="Copy response"
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className={`w-3 h-3 ${themeStyles.textMuted}`} />
                    )}
                  </button>
                )}
              </div>

              {message.isUser && (
                <div className={`flex-shrink-0 w-8 h-8 ${theme === 'anime' ? 'bg-pink-500' : theme === 'light' ? 'bg-gray-400' : 'bg-gray-300 dark:bg-gray-600'} rounded-full flex items-center justify-center`}>
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Search Steps Animation */}
          {isSearching && (
            <div className="flex gap-3 justify-start">
              <div className={`flex-shrink-0 w-8 h-8 ${themeStyles.button} rounded-full flex items-center justify-center`}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className={`${themeStyles.aiMessage} p-4 rounded-2xl min-w-80`}>
                <div className="space-y-3">
                  {searchSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={`p-1 rounded-full ${step.completed ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                        <step.icon className={`w-3 h-3 ${step.completed ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                      </div>
                      <span className={`text-sm ${step.completed ? (theme === 'anime' ? 'text-green-300' : theme === 'light' ? 'text-green-700' : 'text-green-700 dark:text-green-300') : (theme === 'anime' ? 'text-blue-300' : theme === 'light' ? 'text-blue-700' : 'text-blue-700 dark:text-blue-300')}`}>
                        {step.text}
                      </span>
                      {step.completed ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 ${themeStyles.header} border-t`}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about skill assessment, quiz creation, or educational content..."
                className={`w-full p-3 border ${theme === 'anime' ? 'border-pink-500/30 bg-gray-800 text-white placeholder-pink-300/50' : theme === 'light' ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'} rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`p-3 ${themeStyles.button} text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;