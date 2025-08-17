import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function simpleCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME
    });
    
    const Question = mongoose.model('Question', new mongoose.Schema({}, { strict: false }));
    
    const totalQuestions = await Question.countDocuments();
    const activeQuestions = await Question.countDocuments({ is_active: true });
    
    console.log(`Total questions: ${totalQuestions}`);
    console.log(`Active questions: ${activeQuestions}`);
    
    if (totalQuestions > 0) {
      const sample = await Question.findOne();
      console.log('Sample question fields:', Object.keys(sample.toObject()));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

simpleCheck();