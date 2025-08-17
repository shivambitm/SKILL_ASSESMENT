import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_assessment';
const DB_NAME = process.env.DB_NAME || 'skill_assessment';

async function checkQuestions() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });
    console.log('✅ Connected to MongoDB');
    
    // Check questions collection
    const Question = mongoose.model('Question', new mongoose.Schema({}, { strict: false }));
    
    const questions = await Question.find({}).limit(5);
    console.log('📋 Sample questions:');
    questions.forEach((q, i) => {
      console.log(`${i + 1}. Fields:`, Object.keys(q.toObject()));
      console.log(`   skill_id: ${q.skill_id}`);
      console.log(`   is_active: ${q.is_active}`);
      console.log(`   question_text: ${q.question_text?.substring(0, 50)}...`);
    });
    
    // Count questions by skill
    const questionCounts = await Question.aggregate([
      { $group: { _id: '$skill_id', count: { $sum: 1 } } }
    ]);
    
    console.log('📊 Questions by skill:');
    questionCounts.forEach(item => {
      console.log(`- Skill ${item._id}: ${item.count} questions`);
    });
    
    // Check active questions
    const activeQuestions = await Question.countDocuments({ is_active: true });
    console.log(`✅ Active questions: ${activeQuestions}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkQuestions();