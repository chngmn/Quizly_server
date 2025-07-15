require('dotenv').config();
const mongoose = require('mongoose');
const Major = require('./models/Major');
const Subject = require('./models/Subject');
const User = require('./models/User'); // User 모델 임포트
const Quiz = require('./models/Quiz'); // Quiz 모델 임포트

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizly';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('MongoDB connected for seeding');

    try {
      // 기존 데이터 삭제 (개발 시에만 사용)
      await Major.deleteMany({});
      await Subject.deleteMany({});
      console.log('Existing Major, Subject, Quiz, and User data cleared.');
      // 전공 데이터 추가
      const majorsData = [
        { name: '컴퓨터공학' },
        { name: '전자공학' },
        { name: '기계공학' },
        { name: '물리학' },
        { name: '수학' },
        { name: '화학' },
        { name: '생명과학' },
        { name: '지구과학' },
        { name: '사회과학' },
        { name: '의학' },
        { name: '치의학' },
        { name: '한의학' },
        { name: '약학' },
        { name: '간호학' },
        { name: '사회복지학' },
        { name: '경영학' },
        { name: '회계학' },
        { name: '통계학' },
        { name: '경제학' },
        { name: '정치학' },
        { name: '사회학' },
        { name: '철학' },
        { name: '영문학' },
        { name: '중국어' },
        { name: '일본어' },
        { name: '독일어' },
        { name: '프랑스어' },
        { name: '스페인어' },
        { name: '음악' },
        { name: '체육' },
        { name: '미디어' },
        { name: '산업디자인' },
        { name: '영화' },
        
      ];
      const insertedMajors = await Major.insertMany(majorsData);
      console.log('Majors seeded:', insertedMajors.map(m => m.name));

      // 과목 데이터 추가
      const subjectsData = [
        { name: '운영체제', major: insertedMajors.find(m => m.name === '컴퓨터공학')._id },
        { name: '자료구조', major: insertedMajors.find(m => m.name === '컴퓨터공학')._id },
        { name: '알고리즘', major: insertedMajors.find(m => m.name === '컴퓨터공학')._id },
        { name: '데이터베이스', major: insertedMajors.find(m => m.name === '컴퓨터공학')._id },
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