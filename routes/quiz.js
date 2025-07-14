const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const auth = require('../middleware/auth');

// 퀴즈(문제) 생성 (로그인 필요)
router.post('/', auth, async (req, res) => {
  try {
    const quiz = new Quiz({
      ...req.body, // title, subject, description, type, content, options, answer 등
      creator: req.user.userId, // 인증된 사용자의 ID를 creator로 설정
    });
    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 내 퀴즈 목록 조회 (로그인 필요)
router.get('/myquizzes', auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ creator: req.user.userId })
                              .populate('creator', 'nickname');
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 퀴즈 전체 조회 (공개)
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find()
                              .populate('creator', 'nickname');
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 퀴즈 단일 조회 (공개)
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
                           .populate('creator', 'nickname');
    if (!quiz) return res.status(404).json({ error: '퀴즈를 찾을 수 없습니다.' });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 퀴즈 수정 (로그인 필요, 본인 확인)
router.put('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: '퀴즈를 찾을 수 없습니다.' });

    if (quiz.creator.toString() !== req.user.userId) {
      return res.status(403).json({ error: '퀴즈를 수정할 권한이 없습니다.' });
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedQuiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 퀴즈 삭제 (로그인 필요, 본인 확인)
router.delete('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: '퀴즈를 찾을 수 없습니다.' });

    if (quiz.creator.toString() !== req.user.userId) {
      return res.status(403).json({ error: '퀴즈를 삭제할 권한이 없습니다.' });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: '퀴즈가 성공적으로 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
