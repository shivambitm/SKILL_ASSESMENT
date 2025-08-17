import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  skill_id: mongoose.Types.ObjectId;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const QuestionSchema: Schema = new Schema({
  skill_id: {
    type: Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  question_text: {
    type: String,
    required: true,
    trim: true
  },
  option_a: {
    type: String,
    required: true,
    trim: true
  },
  option_b: {
    type: String,
    required: true,
    trim: true
  },
  option_c: {
    type: String,
    required: true,
    trim: true
  },
  option_d: {
    type: String,
    required: true,
    trim: true
  },
  correct_answer: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for performance
QuestionSchema.index({ skill_id: 1 });
QuestionSchema.index({ difficulty: 1 });
QuestionSchema.index({ is_active: 1 });

export default mongoose.model<IQuestion>('Question', QuestionSchema);