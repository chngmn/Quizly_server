require('dotenv').config();
const mongoose = require('mongoose');
const Major = require('./models/Major');
const Subject = require('./models/Subject');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizly';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected for seeding');

  try {
    // 기존 데이터 삭제 (선택 사항: 개발 시에만 사용)
    await Major.deleteMany({});
    await Subject.deleteMany({});
    console.log('Existing Major and Subject data cleared.');

    // 전공 데이터 추가
    const majorsData = [
      { name: '전산학/컴퓨터과학' },
      { name: '전자공학' },
      { name: '기계공학' },
      { name: '경영학' },
    ];
    const insertedMajors = await Major.insertMany(majorsData);
    console.log('Majors seeded:', insertedMajors.map(m => m.name));

    // 과목 데이터 추가
    const subjectsData = [
      { name: '운영체제', major: insertedMajors.find(m => m.name === '전산학/컴퓨터과학')._id },
      { name: '자료구조', major: insertedMajors.find(m => m.name === '전산학/컴퓨터과학')._id },
      { name: '알고리즘', major: insertedMajors.find(m => m.name === '전산학/컴퓨터과학')._id },
      { name: '데이터베이스', major: insertedMajors.find(m => m.name === '전산학/컴퓨터과학')._id },
      { name: '회로이론', major: insertedMajors.find(m => m.name === '전자공학')._id },
      { name: '디지털논리회로', major: insertedMajors.find(m => m.name === '전자공학')._id },
      { name: '전자기학', major: insertedMajors.find(m => m.name === '전자공학')._id },
      { name: '열역학', major: insertedMajors.find(m => m.name === '기계공학')._id },
      { name: '유체역학', major: insertedMajors.find(m => m.name === '기계공학')._id },
      { name: '재료역학', major: insertedMajors.find(m => m.name === '기계공학')._id },
      { name: '경영전략', major: insertedMajors.find(m => m.name === '경영학')._id },
      { name: '마케팅', major: insertedMajors.find(m => m.name === '경영학')._id },
      { name: '회계학', major: insertedMajors.find(m => m.name === '경영학')._id },
    ];
    const insertedSubjects = await Subject.insertMany(subjectsData);
    console.log('Subjects seeded:', insertedSubjects.map(s => s.name));

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.disconnect();
  }
})
.catch(err => console.error('MongoDB connection error for seeding:', err));
