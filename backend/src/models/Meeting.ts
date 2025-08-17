import mongoose, { Document, Schema } from 'mongoose';

export interface IRecording {
  driveFileId: string;
  fileName: string;
  fileSize: number;
  duration: number;
  uploadedAt: Date;
  expiryAt: Date;
  status: 'active' | 'expired' | 'deleted';
  downloadUrl?: string;
}

export interface IParticipant {
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  joinedAt: Date;
  leftAt?: Date;
  role: 'host' | 'participant' | 'speaker' | 'attendee';
}

export interface ITranscript {
  text: string;
  speaker: string;
  timestamp: Date;
  confidence?: number;
}

export interface ISummary {
  content: string;
  keyPoints: string[];
  actionItems: string[];
  generatedAt: Date;
  generatedBy: 'ai' | 'manual';
}

export interface IBreakout {
  roomId: string;
  name: string;
  participants: string[];
  createdAt: Date;
  endedAt?: Date;
}

export interface IWebinar {
  speakers: string[];
  attendees: string[];
  isRecording: boolean;
  chatEnabled: boolean;
}

export interface IMeeting extends Document {
  roomId: string;
  title: string;
  scheduledStart?: Date;
  createdBy: mongoose.Types.ObjectId;
  participants: IParticipant[];
  recordings: IRecording[];
  transcripts: ITranscript[];
  summaries: ISummary[];
  breakouts: IBreakout[];
  mode: 'normal' | 'webinar' | 'interview';
  webinar: IWebinar;
  isActive: boolean;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  cleanupExpiredRecordings(): Promise<void>;
}

const recordingSchema = new Schema<IRecording>({
  driveFileId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  duration: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now },
  expiryAt: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'deleted'], 
    default: 'active' 
  },
  downloadUrl: { type: String }
});

const participantSchema = new Schema<IParticipant>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },
  role: { 
    type: String, 
    enum: ['host', 'participant', 'speaker', 'attendee'], 
    default: 'participant' 
  }
});

const transcriptSchema = new Schema<ITranscript>({
  text: { type: String, required: true },
  speaker: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  confidence: { type: Number, min: 0, max: 1 }
});

const summarySchema = new Schema<ISummary>({
  content: { type: String, required: true },
  keyPoints: [{ type: String }],
  actionItems: [{ type: String }],
  generatedAt: { type: Date, default: Date.now },
  generatedBy: { 
    type: String, 
    enum: ['ai', 'manual'], 
    default: 'ai' 
  }
});

const breakoutSchema = new Schema<IBreakout>({
  roomId: { type: String, required: true },
  name: { type: String, required: true },
  participants: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
});

const webinarSchema = new Schema<IWebinar>({
  speakers: [{ type: String }],
  attendees: [{ type: String }],
  isRecording: { type: Boolean, default: false },
  chatEnabled: { type: Boolean, default: true }
});

const meetingSchema = new Schema<IMeeting>({
  roomId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    default: 'Skill Assessment Interview'
  },
  scheduledStart: {
    type: Date
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [participantSchema],
  recordings: [recordingSchema],
  transcripts: [transcriptSchema],
  summaries: [summarySchema],
  breakouts: [breakoutSchema],
  mode: {
    type: String,
    enum: ['normal', 'webinar', 'interview'],
    default: 'normal'
  },
  webinar: {
    type: webinarSchema,
    default: () => ({ speakers: [], attendees: [], isRecording: false, chatEnabled: true })
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Method to cleanup expired recordings
meetingSchema.methods.cleanupExpiredRecordings = async function(): Promise<void> {
  console.log('🧽 [Meeting] Cleaning up expired recordings for:', this.roomId);
  
  const expiredRecordings = this.recordings.filter((r: IRecording) => 
    r.expiryAt < new Date() && r.status !== 'deleted'
  );
  
  console.log('🗑️ [Meeting] Found', expiredRecordings.length, 'expired recordings');
  
  for (const recording of expiredRecordings) {
    try {
      const { deleteFromDrive } = require('../utils/googleDrive');
      await deleteFromDrive(recording.driveFileId);
      recording.status = 'deleted';
      console.log(`✅ [Meeting] Deleted expired recording ${recording.driveFileId}`);
    } catch (error) {
      console.error(`❌ [Meeting] Failed to delete recording ${recording.driveFileId}:`, error);
    }
  }
  
  if (expiredRecordings.length > 0) {
    await this.save();
  }
};

export const Meeting = mongoose.model<IMeeting>('Meeting', meetingSchema);

console.log('✅ [Meeting] Meeting model initialized with MongoDB');