import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  session_id: mongoose.Types.ObjectId;
  message: string;
  response: string;
  created_at: Date;
}

const ChatMessageSchema: Schema = new Schema({
  session_id: {
    type: Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);