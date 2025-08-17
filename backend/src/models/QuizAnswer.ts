import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizAnswer extends Document {
  quiz_attempt_id: mongoose.Types.ObjectId;
  question_id: mongoose.Types.ObjectId;
  selected_answer: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  time_taken?: number;
  created_at: Date;
}

const QuizAnswerSchema: Schema = new Schema({
  quiz_attempt_id: {
    type: Schema.Types.ObjectId,
    ref: 'QuizAttempt',
    required: true
  },
  question_id: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  selected_answer: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  is_correct: {
    type: Boolean,
    required: true
  },
  time_taken: {
    type: Number,
    min: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Index for performance
QuizAnswerSchema.index({ quiz_attempt_id: 1 });
QuizAnswerSchema.index({ question_id: 1 });

export default mongoose.model<IQuizAnswer>('QuizAnswer', QuizAnswerSchema);