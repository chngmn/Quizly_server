const express = require('express');
const router = express.Router();
const Major = require('../models/Major');
const Quiz = require('../models/Quiz'); // Quiz 모델 추가

// 모든 전공 조회
router.get('/', async (req, res) => {
  try {
    const majors = await Major.find({});
    res.json(majors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 각 전공별 퀴즈 개수 조회
router.get('/quiz-counts', async (req, res) => {
  try {
    const majors = await Major.find({});
    
    // 각 전공별로 퀴즈 개수를 집계
    let majorsWithCounts = await Promise.all(
      majors.map(async (major) => {
        const count = await Quiz.countDocuments({ major: major._id });
        
        // 아이콘과 배경색 추가
        let icon, bgColor, category, useImage, imagePath;
        
        switch(major.name) {
          case '컴퓨터공학':
            icon = 'MdComputer';
            bgColor = 'bg-orange-500';
            category = 'computer-science';
            useImage = false;
            break;
          case '수학':
            icon = 'MdCalculate';
            bgColor = 'bg-green-500';
            category = 'mathematics';
            useImage = false;
            break;
          case '전자공학':
            icon = '';
            bgColor = 'bg-purple-500';
            category = 'electronics';
            useImage = true;
            imagePath = 'chip.png';
            break;
          case '기계공학':
            icon = '';
            bgColor = 'bg-blue-400';
            category = 'mechanical';
            useImage = true;
            imagePath = 'mechanic.png';
            break;
          case '물리학':
            icon = 'MdScience';
            bgColor = 'bg-[#0C21C1]';
            category = 'physics';
            useImage = false;
            break;
          case '경영학':
            icon = 'MdTrendingUp';
            bgColor = 'bg-blue-500';
            category = 'business';
            useImage = false;
            break;
          default:
            icon = 'MdQuiz';
            bgColor = 'bg-gray-500';
            category = 'other';
            useImage = false;
        }
        
        return {
          _id: major._id,
          name: major.name,
          count,
          icon,
          bgColor,
          category,
          useImage,
          imagePath
        };
      })
    );
    
    // 퀴즈 개수에 따라 내림차순 정렬
    majorsWithCounts = majorsWithCounts.sort((a, b) => b.count - a.count);
    
    // 상위 3개만 반환
    majorsWithCounts = majorsWithCounts.slice(0, 3);
    
    res.json(majorsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
