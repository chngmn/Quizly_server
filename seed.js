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

      // 퀴즈 데이터 추가
      const quizzesData = [
        // OX 퀴즈
        {
          title: '운영체제 OX 퀴즈 1',
          major: insertedMajors.find(m => m.name === '전산학/컴퓨터과학')._id,
          subject: insertedSubjects.find(s => s.name === '운영체제')._id,
          creator: user._id,
          type: 'ox',
          content: '운영체제는 컴퓨터 하드웨어를 직접 제어한다. (O/X)',
          answer: 'O',
          options: [],
        },
        {
          title: '자료구조 OX 퀴즈 1',
          major: insertedMajors.find(m => m.name === '전산학/컴퓨터과학')._id,
          subject: insertedSubjects.find(s => s.name === '자료구조')._id,
          creator: user._id,
          type: 'ox',
          content: '스택은 LIFO(Last-In, First-Out) 구조이다. (O/X)',
          answer: 'O',
          options: [],
        },
        // 객관식 퀴즈
        {
          title: '알고리즘 객관식 퀴즈 1',
          major: insertedMajors.find(m => m.name === '전산학/컴퓨터과학')._id,
          subject: insertedSubjects.find(s => s.name === '알고리즘')._id,
          creator: user._id,
          type: 'multiple',
          content: '다음 중 버블 정렬의 시간 복잡도는?',
          options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(n log n)'],
          answer: '2', // 0-indexed: O(n^2)
        },
        {
          title: '데이터베이스 객관식 퀴즈 1',
          major: insertedMajors.find(m => m.name === '전산학/컴퓨터과학')._id,
          subject: insertedSubjects.find(s => s.name === '데이터베이스')._id,
          creator: user._id,
          type: 'multiple',
          content: '관계형 데이터베이스에서 테이블의 행을 무엇이라고 부르는가?',
          options: ['속성', '튜플', '도메인', '스키마'],
          answer: '1', // 0-indexed: 튜플
        },
        // 주관식 퀴즈
        {
          title: '회로이론 주관식 퀴즈 1',
          major: insertedMajors.find(m => m.name === '전자공학')._id,
          subject: insertedSubjects.find(s => s.name === '회로이론')._id,
          creator: user._id,
          type: 'subjective',
          content: '옴의 법칙을 서술하시오.',
          answer: 'V=IR',
          options: [],
        },
        {
          title: '마케팅 주관식 퀴즈 1',
          major: insertedMajors.find(m => m.name === '경영학')._id,
          subject: insertedSubjects.find(s => s.name === '마케팅')._id,
          creator: user._id,
          type: 'subjective',
          content: '마케팅 믹스 4P를 나열하시오.',
          answer: '제품, 가격, 유통, 촉진',
          options: [],
        },
        // 족보 (exam_archive) 퀴즈
        {
          title: '운영체제 족보 1',
          major: insertedMajors.find(m => m.name === '전산학/컴퓨터과학')._id,
          subject: insertedSubjects.find(s => s.name === '운영체제')._id,
          creator: user._id,
          type: 'exam_archive',
          content: '2023년 운영체제 중간고사 족보입니다.',
          answer: 'N/A',
          options: [],
          files: [], // 실제 파일은 업로드되지 않으므로 빈 배열
        },
      ];
      await Quiz.insertMany(quizzesData);
      console.log('Quizzes seeded.');

    } catch (error) {
      console.error('Error seeding data:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => console.error('MongoDB connection error for seeding:', err));