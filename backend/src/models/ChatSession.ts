import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSession extends Document {
  user_id: mongoose.Types.ObjectId;
  title: string;
  created_at: Date;
  updated_at: Date;
}

const ChatSessionSchema: Schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);