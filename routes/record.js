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

    // 이미 기록이 있는지 확인
    const existingRecord = await Record.findOne({ user: userId, quiz: quizId });
    if (existingRecord) {
      // 이미 기록이 있으면 새로 저장하지 않고 기존 기록 반환
      return res.status(200).json(existingRecord);
    }

    // 퀴즈 정보 가져오기 (정답 확인용)
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: '퀴즈를 찾을 수 없습니다.' });
    }

    // 새로운 기록 생성
    const newRecord = new Record({
      user: userId,
      quiz: quizId,
      isCorrect,
      submittedAnswer,
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

    res.json(Object.values(uniqueWrongQuizzes));
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
