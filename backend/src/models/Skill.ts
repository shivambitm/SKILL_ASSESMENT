import mongoose, { Schema, Document } from 'mongoose';

export interface ISkill extends Document {
  name: string;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const SkillSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for performance
SkillSchema.index({ name: 1 });
SkillSchema.index({ category: 1 });
SkillSchema.index({ is_active: 1 });

export default mongoose.model<ISkill>('Skill', SkillSchema);