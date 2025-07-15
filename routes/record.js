const express = require('express');
const router = express.Router();
const Record = require('../models/Record');
const Quiz = require('../models/Quiz'); // Quiz 모델 임포트
const auth = require('../middleware/auth'); // 인증 미들웨어 임포트

// 퀴즈 응시 기록 저장 (오답노트 기능 포함)
router.post('/', auth, async (req, res) => {
  try {
    const { quizId, isCorrect, submittedAnswer, correctAnswer } = req.body;
    const userId = req.user.userId;

    // 퀴즈 정보 가져오기 (정답 확인용)
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: '퀴즈를 찾을 수 없습니다.' });
    }

    // 이미 기록이 있는지 확인
    const existingRecord = await Record.findOne({ user: userId, quiz: quizId });
    
    if (existingRecord) {
      // 기존 기록이 있고 이전에 틀렸지만 이번에 맞췄다면 오답노트에서 제거
      if (isCorrect && existingRecord.wrongQuizzes && existingRecord.wrongQuizzes.length > 0) {
        // 오답노트에서 해당 퀴즈 제거
        existingRecord.wrongQuizzes = existingRecord.wrongQuizzes.filter(
          wq => wq.quiz.toString() !== quizId
        );
        
        // 기록 업데이트 (isCorrect는 업데이트하지만 everWrong은 true로 유지)
        existingRecord.isCorrect = isCorrect;
        existingRecord.submittedAnswer = submittedAnswer;
        
        // 한 번이라도 틀렸던 문제는 everWrong을 true로 설정
        existingRecord.everWrong = true;
        
        await existingRecord.save();
      } else if (!isCorrect) {
        // 이번에 틀렸다면 everWrong을 true로 설정하고 오답노트에 추가
        existingRecord.isCorrect = isCorrect;
        existingRecord.submittedAnswer = submittedAnswer;
        existingRecord.everWrong = true;
        
        // 오답노트에 이미 있는지 확인
        const alreadyInWrongQuizzes = existingRecord.wrongQuizzes.some(
          wq => wq.quiz.toString() === quizId
        );
        
        // 오답노트에 없으면 추가
        if (!alreadyInWrongQuizzes) {
          existingRecord.wrongQuizzes.push({
            quiz: quizId,
            submittedAnswer,
            correctAnswer: correctAnswer || quiz.answer,
          });
        }
        
        await existingRecord.save();
      } else {
        // 이전에도 맞고 이번에도 맞았다면 그대로 유지
        existingRecord.submittedAnswer = submittedAnswer;
        await existingRecord.save();
      }
      
      return res.status(200).json(existingRecord);
    }

    // 새로운 기록 생성
    const newRecord = new Record({
      user: userId,
      quiz: quizId,
      isCorrect,
      submittedAnswer,
      everWrong: !isCorrect // 처음 풀 때 틀렸으면 everWrong을 true로 설정
    });

    // 오답일 경우 오답노트에 추가
    if (!isCorrect) {
      newRecord.wrongQuizzes.push({
        quiz: quizId,
        submittedAnswer,
        correctAnswer: correctAnswer || quiz.answer, // 퀴즈의 실제 정답 저장
      });
    }

    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (err) {
    console.error('기록 저장 중 오류 발생:', err);
    res.status(400).json({ error: err.message });
  }
});

// 내가 푼 퀴즈 목록 조회
router.get('/solved-quizzes', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 사용자의 모든 퀴즈 기록을 가져옴
    const records = await Record.find({ user: userId })
                               .populate({
                                   path: 'quiz',
                                   select: 'title content type options answer major subject',
                                   populate: [
                                       { path: 'major', select: 'name' },
                                       { path: 'subject', select: 'name' }
                                   ]
                               })
                               .select('quiz isCorrect submittedAnswer everWrong createdAt updatedAt')
                               .sort({ createdAt: -1 });
    
    // 기존 데이터에 everWrong 필드가 없는 경우 기본값 설정
    const processedRecords = records
      .filter(record => record.quiz !== null) // quiz가 null인 레코드(삭제된 퀴즈)는 제외
      .map(record => {
        const recordObj = record.toObject();
        
        // everWrong 필드가 없는 경우, wrongQuizzes 배열이 있고 길이가 0보다 크면 true, 아니면 false로 설정
        if (recordObj.everWrong === undefined) {
          // 기존 데이터에서는 wrongQuizzes 배열의 길이로 판단
          recordObj.everWrong = !recordObj.isCorrect;
          
          // DB 업데이트 (비동기로 실행)
          Record.updateOne(
            { _id: record._id }, 
            { $set: { everWrong: recordObj.everWrong } }
          ).catch(err => console.error('Record update error:', err));
        }
        
        return recordObj;
      });
    
    res.json(processedRecords);
  } catch (err) {
    console.error('푼 퀴즈 목록 조회 중 오류 발생:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 내 오답 목록 조회
router.get('/wrong-answers', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    // 사용자의 모든 기록 중 wrongQuizzes 배열이 비어있지 않은 것들을 찾음
    const wrongRecords = await Record.find({ user: userId, 'wrongQuizzes.0': { '$exists': true } })
                                     .populate({
                                         path: 'wrongQuizzes.quiz',
                                         model: 'Quiz',
                                         select: 'title content type options answer major subject',
                                         populate: [
                                             { path: 'major', select: 'name' },
                                             { path: 'subject', select: 'name' }
                                         ]
                                     })
                                     .lean() // lean()을 추가하여 일반 JavaScript 객체로 반환
                                     .sort({ createdAt: -1 });

    const uniqueWrongQuizzes = {};
    wrongRecords.forEach(record => {
        record.wrongQuizzes.forEach(wq => {
            // 퀴즈가 삭제되어 populate되지 않은 경우 건너뛰기
            if (!wq.quiz) {
                return;
            }
            // 퀴즈 ID를 키로 사용하여 최신 오답만 저장
            if (!uniqueWrongQuizzes[wq.quiz._id] || uniqueWrongQuizzes[wq.quiz._id].recordedAt < wq.recordedAt) {
                uniqueWrongQuizzes[wq.quiz._id] = wq;
            }
        });
    });

    // 퀴즈가 있는 오답 목록만 반환
    const filteredWrongQuizzes = Object.values(uniqueWrongQuizzes).filter(wq => wq.quiz !== null);
    res.json(filteredWrongQuizzes);
  } catch (err) {
    console.error('오답 목록 조회 중 오류 발생:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 사용자가 푼 전체 퀴즈 수 조회
router.get('/total-quizzes-taken', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const totalQuizzesTaken = await Record.countDocuments({ user: userId });
    res.json({ totalQuizzesTaken });
  } catch (err) {
    console.error('전체 퀴즈 수 조회 중 오류 발생:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
