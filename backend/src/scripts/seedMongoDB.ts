import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Skill, Question } from '../models';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/skill_assessment";

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      dbName: process.env.DB_NAME || 'skill_assessment'
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Skill.deleteMany({});
    await Question.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create admin user
    const adminUser = new User({
      email: 'studyhardshivam@gmail.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    await adminUser.save();
    console.log('👑 Created admin user');

    // Create test user
    const testUser = new User({
      email: 'user@example.com',
      password: 'user123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });
    await testUser.save();
    console.log('👤 Created test user');

    // Create skills
    const skills = [
      {
        name: 'JavaScript',
        description: 'JavaScript programming fundamentals',
        category: 'Programming'
      },
      {
        name: 'React',
        description: 'React.js library for building user interfaces',
        category: 'Frontend'
      },
      {
        name: 'Node.js',
        description: 'Server-side JavaScript runtime',
        category: 'Backend'
      },
      {
        name: 'MongoDB',
        description: 'NoSQL database management',
        category: 'Database'
      }
    ];

    const createdSkills = await Skill.insertMany(skills);
    console.log('🎯 Created skills');

    // Create sample questions for JavaScript skill
    const jsSkill = createdSkills.find(s => s.name === 'JavaScript');
    if (jsSkill) {
      const questions = [
        {
          skill_id: jsSkill._id,
          question_text: 'What is the correct way to declare a variable in JavaScript?',
          option_a: 'var myVar = 5;',
          option_b: 'variable myVar = 5;',
          option_c: 'v myVar = 5;',
          option_d: 'declare myVar = 5;',
          correct_answer: 'A',
          difficulty: 'easy',
          points: 1
        },
        {
          skill_id: jsSkill._id,
          question_text: 'Which method is used to add an element to the end of an array?',
          option_a: 'append()',
          option_b: 'push()',
          option_c: 'add()',
          option_d: 'insert()',
          correct_answer: 'B',
          difficulty: 'easy',
          points: 1
        },
        {
          skill_id: jsSkill._id,
          question_text: 'What does "this" keyword refer to in JavaScript?',
          option_a: 'The current function',
          option_b: 'The global object',
          option_c: 'The current object',
          option_d: 'The parent object',
          correct_answer: 'C',
          difficulty: 'medium',
          points: 2
        }
      ];

      await Question.insertMany(questions);
      console.log('❓ Created sample questions');
    }

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: studyhardshivam@gmail.com / admin123');
    console.log('User: user@example.com / user123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();