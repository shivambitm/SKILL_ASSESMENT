import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizAttempt extends Document {
  user_id: mongoose.Types.ObjectId;
  skill_id: mongoose.Types.ObjectId;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  time_taken?: number;
  started_at: Date;
  completed_at?: Date;
  is_assessed: boolean;
  assessed_at?: Date;
  assessed_by?: mongoose.Types.ObjectId;
  assessment_notes?: string;
}

const QuizAttemptSchema: Schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill_id: {
    type: Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  total_questions: {
    type: Number,
    required: true,
    min: 1
  },
  correct_answers: {
    type: Number,
    required: true,
    min: 0
  },
  score_percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  time_taken: {
    type: Number,
    min: 0
  },
  started_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date
  },
  is_assessed: {
    type: Boolean,
    default: false
  },
  assessed_at: {
    type: Date
  },
  assessed_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  assessment_notes: {
    type: String,
    trim: true
  }
});

// Index for performance
QuizAttemptSchema.index({ user_id: 1 });
QuizAttemptSchema.index({ skill_id: 1 });
QuizAttemptSchema.index({ started_at: -1 });
QuizAttemptSchema.index({ completed_at: -1 });

export default mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);