const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class TranscriptionService {
  constructor() {
    this.genAI = null;
    this.isInitialized = false;
    this.init();
  }

  init() {
    if (process.env.GOOGLE_AI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      this.isInitialized = true;
      console.log('✅ [TranscriptionService] Google Gemini initialized');
    } else {
      console.log('⚠️ [TranscriptionService] Google AI API key not provided');
    }
  }

  isAvailable() {
    return this.isInitialized && this.genAI;
  }

  // Simulate audio transcription (in production, use Google Cloud Speech-to-Text)
  async transcribeAudio(audioFilePath, roomId) {
    console.log('🎤 [TranscriptionService] Transcribing audio:', audioFilePath);
    
    if (!fs.existsSync(audioFilePath)) {
      throw new Error('Audio file not found');
    }

    // Get file stats for simulation
    const stats = fs.statSync(audioFilePath);
    const fileSizeKB = Math.round(stats.size / 1024);
    const estimatedDurationMinutes = Math.max(1, Math.round(fileSizeKB / 1000)); // Rough estimate

    // Simulate transcription based on meeting context
    const simulatedTranscript = this.generateSimulatedTranscript(roomId, estimatedDurationMinutes);
    
    console.log('✅ [TranscriptionService] Transcription completed');
    return {
      text: simulatedTranscript,
      confidence: 0.95,
      duration: estimatedDurationMinutes * 60,
      wordCount: simulatedTranscript.split(' ').length,
      service: 'simulated-google-speech-to-text'
    };
  }

  generateSimulatedTranscript(roomId, durationMinutes) {
    const transcriptTemplates = [
      `Welcome everyone to today's skill assessment meeting for room ${roomId}. Let's begin by reviewing the agenda for today's session.

The first item on our agenda is to discuss the current progress on the skill evaluation framework. We've made significant improvements to the assessment methodology and I'd like to get everyone's feedback on the new approach.

John mentioned that the technical implementation is progressing well, with the database migration to MongoDB now complete. The new system should provide better scalability and performance for our growing user base.

Sarah brought up some important points about user experience improvements. She suggested that we should focus on making the quiz interface more intuitive and accessible for all users.

For action items, we need to finalize the testing phase by next Friday. Mike will be responsible for coordinating the user acceptance testing with our beta users.

Additionally, we should schedule a follow-up meeting next week to review the feedback from the testing phase and plan the production deployment.

The meeting concluded with everyone agreeing on the timeline and next steps. Thank you all for your participation and valuable input.`,

      `Good morning team. This is our weekly progress review for the skill assessment platform development in room ${roomId}.

Let me start with the technical updates. The backend migration to MongoDB has been successfully completed, and all the core functionalities are now working with the new database structure. The authentication system, quiz management, and reporting features have all been tested and are functioning properly.

On the frontend side, we've implemented several user interface improvements based on the feedback from our previous user testing sessions. The new design is more responsive and provides a better user experience across different devices.

We discussed the upcoming features that need to be implemented, including the meeting recording functionality and the AI-powered question generation system. These features will significantly enhance the platform's capabilities.

The team also reviewed the current performance metrics and identified areas for optimization. We'll be focusing on improving the quiz loading times and the overall system responsiveness.

For the next sprint, our priorities include completing the integration testing, finalizing the documentation, and preparing for the beta release. Each team member has been assigned specific tasks with clear deadlines.

The meeting ended with a discussion about the deployment strategy and the timeline for the production release.`,

      `This is the skill assessment platform team meeting for room ${roomId}. Today we're focusing on the recent developments and upcoming milestones.

We started by reviewing the successful migration from SQLite to MongoDB, which has improved our data handling capabilities significantly. The new database structure allows for better scalability and more efficient queries.

The discussion then moved to the user feedback we've received from the beta testing phase. Overall, the response has been very positive, with users particularly appreciating the intuitive interface and the comprehensive reporting features.

We addressed several technical challenges that came up during the development process, including the integration of the meeting recording system and the implementation of real-time features using WebRTC.

The team also discussed the importance of maintaining high code quality and following best practices throughout the development process. We've implemented automated testing and continuous integration to ensure reliability.

Looking ahead, we have several exciting features planned, including AI-powered analytics, advanced reporting capabilities, and enhanced collaboration tools for remote assessments.

The meeting concluded with a review of our project timeline and confirmation of the next milestone deliverables. Everyone is aligned on the goals and committed to meeting the upcoming deadlines.`
    ];

    // Select a template based on room ID for consistency
    const templateIndex = roomId.length % transcriptTemplates.length;
    let transcript = transcriptTemplates[templateIndex];

    // Adjust length based on estimated duration
    if (durationMinutes < 5) {
      // Short meeting - use first paragraph only
      transcript = transcript.split('\n\n')[0];
    } else if (durationMinutes > 15) {
      // Long meeting - add more content
      transcript += `\n\nWe also spent time discussing the long-term vision for the platform and how it aligns with our organization's goals. The team is excited about the potential impact this system will have on skill development and assessment processes.

Additional topics covered included security considerations, data privacy compliance, and the integration with existing HR systems. These aspects are crucial for enterprise adoption and we're making sure to address them thoroughly.

The meeting ran longer than expected due to the engaging discussions and valuable insights shared by all team members. This collaborative approach is one of our team's greatest strengths.`;
    }

    return transcript;
  }

  // Generate summary and action items using Google Gemini
  async generateSummaryAndActions(transcript) {
    if (!this.isAvailable()) {
      throw new Error('Transcription service not available - Google AI API key not configured');
    }

    console.log('🤖 [TranscriptionService] Generating summary with Gemini...');
    
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are an AI assistant specialized in analyzing meeting transcripts. Please analyze the following meeting transcript and provide:

1. A concise executive summary (2-3 sentences)
2. Key discussion points (bullet points)
3. Action items with assignees (if mentioned)
4. Important decisions made
5. Next steps or follow-up items

Please format your response in a structured way with clear sections.

Meeting Transcript:
${transcript}

Please provide a comprehensive analysis in the following format:

EXECUTIVE SUMMARY:
[2-3 sentence summary]

KEY DISCUSSION POINTS:
- Point 1
- Point 2
- Point 3

ACTION ITEMS:
- Task 1 (Assignee: Name if mentioned, otherwise "TBD")
- Task 2 (Assignee: Name if mentioned, otherwise "TBD")

DECISIONS MADE:
- Decision 1
- Decision 2

NEXT STEPS:
- Step 1
- Step 2`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ [TranscriptionService] Summary generated successfully');
      
      return this.parseSummaryResponse(text);
    } catch (error) {
      console.error('❌ [TranscriptionService] Failed to generate summary:', error);
      throw new Error('Failed to generate meeting summary');
    }
  }

  parseSummaryResponse(text) {
    const sections = {
      executiveSummary: '',
      keyPoints: [],
      actionItems: [],
      decisions: [],
      nextSteps: []
    };

    try {
      // Extract executive summary
      const summaryMatch = text.match(/EXECUTIVE SUMMARY:\s*(.*?)(?=KEY DISCUSSION POINTS:|$)/s);
      if (summaryMatch) {
        sections.executiveSummary = summaryMatch[1].trim();
      }

      // Extract key discussion points
      const keyPointsMatch = text.match(/KEY DISCUSSION POINTS:\s*(.*?)(?=ACTION ITEMS:|$)/s);
      if (keyPointsMatch) {
        sections.keyPoints = keyPointsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.trim().substring(1).trim());
      }

      // Extract action items
      const actionItemsMatch = text.match(/ACTION ITEMS:\s*(.*?)(?=DECISIONS MADE:|$)/s);
      if (actionItemsMatch) {
        sections.actionItems = actionItemsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => {
            const actionText = line.trim().substring(1).trim();
            const assigneeMatch = actionText.match(/\(Assignee: (.+?)\)/);
            return {
              text: actionText.replace(/\(Assignee: .+?\)/, '').trim(),
              assignee: assigneeMatch ? assigneeMatch[1] : 'TBD'
            };
          });
      }

      // Extract decisions
      const decisionsMatch = text.match(/DECISIONS MADE:\s*(.*?)(?=NEXT STEPS:|$)/s);
      if (decisionsMatch) {
        sections.decisions = decisionsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.trim().substring(1).trim());
      }

      // Extract next steps
      const nextStepsMatch = text.match(/NEXT STEPS:\s*(.*?)$/s);
      if (nextStepsMatch) {
        sections.nextSteps = nextStepsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.trim().substring(1).trim());
      }

    } catch (error) {
      console.error('❌ [TranscriptionService] Failed to parse summary response:', error);
    }

    return {
      content: text,
      ...sections,
      generatedAt: new Date(),
      generatedBy: 'gemini-pro'
    };
  }

  // Generate meeting insights using Gemini
  async generateMeetingInsights(transcript, participants = []) {
    if (!this.isAvailable()) {
      throw new Error('Transcription service not available');
    }

    console.log('📊 [TranscriptionService] Generating meeting insights...');
    
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze this meeting transcript and provide insights about:
1. Meeting effectiveness (1-10 score with explanation)
2. Participant engagement level
3. Key themes and topics discussed
4. Sentiment analysis (positive/neutral/negative)
5. Recommendations for improvement

Participants: ${participants.join(', ') || 'Not specified'}

Transcript:
${transcript}`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const insights = response.text();
      
      console.log('✅ [TranscriptionService] Meeting insights generated');
      
      return {
        insights,
        generatedAt: new Date(),
        participantCount: participants.length,
        transcriptLength: transcript.length
      };
    } catch (error) {
      console.error('❌ [TranscriptionService] Failed to generate insights:', error);
      throw new Error('Failed to generate meeting insights');
    }
  }
}

module.exports = new TranscriptionService();