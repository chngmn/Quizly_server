> <h4>2025S KAIST 몰입캠프</h4>
> <h4>Week 2 : 2025. 07. 10. ~ 2025. 07. 16.</h4>

---

## 👥 Team Members
<table>
    <tr>
      <td align="center" width="200">
        <a href="https://github.com/lyeonj">
          <img width="120" height="120" alt="Image" src="https://github.com/user-attachments/assets/b2ba0c01-b996-4703-8936-f3e40b85daf6" />
          <br />
        </a>
      </td>
      <td align="center" width="200">
        <a href="https://github.com/chngmn">
          <img width="120" height="120" alt="Image" src="https://github.com/user-attachments/assets/20771cb6-a9f0-4648-87ac-f9e3268767e1" />
          <br />
        </a>
      </td>
    </tr>
    <tr>
      <td align="center">
        <b>박기람</b>
      </td>
      <td align="center">
        <b>이창민</b>
      </td>
    </tr>
  <tr>
    <td align="center">
      <p>한양대 정보시스템학과</p>
    </td>
    <td align="center">
      <p>카이스트 전산학부</p>
    </td>
  </tr>
</table>

---

<br/>
<img src="https://github.com/user-attachments/assets/293532ef-f204-4907-8e13-069e56e5c18a" alt="Quizly Logo" width="240" height="90" />
<br/>

## ✨ Point
- 전공별 퀴즈로 공부하고, 직접 문제를 만들어 공유하는 퀴즈 웹페이지
- **전공별/과목별 퀴즈**로 실력 점검
- **OX, 객관식, 주관식, 족보 업로드** 등 다양한 문제 유형 지원
- **문제 직접 출제 및 공유** 가능
- **카카오 로그인** 및 이메일 로그인 지원
- **문제 풀이 기록** 및 오답 노트 제공
- 반응형 & 직관적인 UI (TailwindCSS 기반)

---

## 🚀 Get Start


### 1. 클론 및 설치

```bash
https://github.com/chngmn/Quizly_client.git
https://github.com/chngmn/Quizly_server.git
```

#### 클라이언트

```bash
cd client
npm install
npm run dev
```

#### 서버

```bash
cd server
npm install
node index.js
```

> 기본적으로 클라이언트는 Vite, 서버는 Express.js로 구동됩니다.

---

## 🖥️ Main Features

| 기능                | 설명                                                         |
|---------------------|-------------------------------------------------------------|
| 전공/과목별 퀴즈    | 원하는 전공, 과목을 선택해 퀴즈 풀이                        |
| 문제 유형 다양      | OX, 객관식, 주관식, 족보(파일 업로드) 지원                 |
| 문제 출제/공유      | 직접 문제를 만들어 등록하고, 다른 사용자와 공유             |
| 오답 노트           | 틀린 문제만 모아 복습 가능                                  |
| 인기 퀴즈           | 인기 있는 퀴즈를 한눈에 확인                                |
| 카카오/이메일 로그인| 카카오톡 또는 이메일로 간편하게 로그인                      |

---

## 📸 Screen Shot
<table>
    <tr>
        <td>
            <img width="5760" height="5760" alt="image" src="https://github.com/user-attachments/assets/91722a70-1cf3-4ec4-817c-493596748d7a" />
        </td>
        <td>
            <img width="5760" height="4998" alt="image" src="https://github.com/user-attachments/assets/ba006566-959e-4d9c-a918-124fe79d7d54" />
        </td>
        <td>
            <img width="5760" height="2924" alt="image" src="https://github.com/user-attachments/assets/26d8bddc-39b8-40b9-9d52-ecbf3379e694" />
        </td>
    </tr>
    <tr>
        <td>
            <img width="5760" height="2924" alt="image" src="https://github.com/user-attachments/assets/6e8f6fab-1988-4c63-b96e-d05c46e9786f" />
        </td>
        <td>
            <img width="5760" height="3932" alt="image" src="https://github.com/user-attachments/assets/8897fba4-7e76-4f1c-865b-f89de708e9fe" />
        </td>
        <td>
            <img width="5760" height="2924" alt="image" src="https://github.com/user-attachments/assets/5c2947ef-1f79-449c-b7b3-a3861a6ca72b" />
        </td>
    </tr>
</table>

<br/>

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, TailwindCSS, React Router, Axios
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, Multer
- **인증:** 카카오 OAuth, JWT
- **기타:** ESLint, React Icons

---

### 💡 참고

- 로고 및 기타 이미지는 `client/src/assets/` 폴더에 있습니다.
- `.env` 파일에 환경변수(카카오 API 키 등)를 설정해야 할 수 있습니다.

---
