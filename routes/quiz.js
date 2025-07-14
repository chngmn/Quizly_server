const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 디렉토리 생성 (없으면)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// 퀴즈(문제) 생성 (로그인 필요)
router.post('/', auth, upload.array('files'), async (req, res) => {
  try {
    const { title, description, subject, major, type, content, explanation } = req.body;
    let options = [];
    let answer = null;

    // 퀴즈 유형에 따라 options와 answer 파싱
    if (type === 'multiple' || type === 'ox') {
      if (req.body.options && typeof req.body.options === 'string' && req.body.options.trim() !== '') {
        try {
          options = JSON.parse(req.body.options);
        } catch (parseError) {
          console.error('options 파싱 오류:', parseError);
          return res.status(400).json({ error: '유효하지 않은 options 형식입니다.' });
        }
      }
      answer = req.body.answer; // multiple, ox의 answer는 문자열 그대로 사용
    } else { // 'subjective' 및 'exam_archive' 유형의 경우
      answer = req.body.answer; // 문자열 값을 그대로 사용
      options = []; // options는 빈 배열로 유지
    }

    const filePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const quiz = new Quiz({
      title,
      description,
      subject,
      major,
      type,
      content,
      options,
      answer,
      explanation,
      creator: req.user.userId,
      files: filePaths,
    });
    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    console.error('퀴즈 생성 중 오류 발생:', err);
    res.status(400).json({ error: err.message });
  }
});

// 내 퀴즈 목록 조회 (로그인 필요)
router.get('/myquizzes', auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ creator: req.user.userId })
                              .populate('creator', 'nickname')
                              .populate('major', 'name')
                              .populate('subject', 'name');
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 퀴즈 전체 조회 (공개) - 필터링 및 랜덤 선택 기능 추가
router.get('/', async (req, res) => {
  try {
    const { majorId, subjectId, type, limit } = req.query;
    let query = {};

    if (majorId) {
      query.major = majorId;
    }
    if (subjectId) {
      query.subject = subjectId;
    }
    if (type) {
      query.type = type;
    }

    let quizzes = await Quiz.find(query)
                              .populate('creator', 'nickname')
                              .populate('major', 'name')
                              .populate('subject', 'name');

    if (limit) {
      // 랜덤으로 퀴즈 선택
      const shuffled = quizzes.sort(() => 0.5 - Math.random());
      quizzes = shuffled.slice(0, parseInt(limit));
    }

    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 퀴즈 단일 조회 (공개)
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
                           .populate('creator', 'nickname')
                           .populate('major', 'name')
                           .populate('subject', 'name');
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

    // 퀴즈와 연결된 파일도 삭제 (선택 사항)
    if (quiz.files && quiz.files.length > 0) {
      quiz.files.forEach(filePath => {
        const fullPath = path.join(__dirname, '..', filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: '퀴즈가 성공적으로 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;


