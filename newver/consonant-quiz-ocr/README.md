# 🎮 자음 퀴즈 자동 답안 추출기 (Consonant Quiz OCR)

실시간 화면 캡쳐를 통해 자음 퀴즈의 문제를 자동으로 인식하고 정답을 추출하는 웹 애플리케이션입니다.

## ✨ 주요 기능

### 1. 실시간 화면 캡쳐
- 브라우저의 Screen Capture API를 사용하여 화면을 실시간으로 캡쳐
- 드래그 앤 드롭으로 퀴즈 문제 영역을 정확하게 선택
- 선택한 영역만 OCR 처리하여 정확도 향상

### 2. 한글 초성 인식 (OCR)
- Tesseract.js를 활용한 강력한 한글 초성 문자 인식
- 화면에 표시된 초성(ㄱ, ㄴ, ㄷ 등)을 직접 인식
- 이미지 전처리를 통한 인식률 향상

### 3. 지능형 검색 시스템
- database2.csv 파일의 방대한 데이터베이스에서 정답 검색
- 정확 일치 → 부분 일치 → 유사도 기반 검색의 3단계 스마트 검색
- Levenshtein Distance 알고리즘을 사용한 유사도 계산

### 4. 자음 학습 모드
- 개발자가 각 자음의 샘플 이미지를 제공하여 인식률 향상
- 로컬 스토리지에 학습 데이터 저장
- 향후 TensorFlow.js를 활용한 커스텀 모델 학습 기능 확장 예정

### 5. 편리한 사용자 인터페이스
- 모던하고 직관적인 UI 디자인
- 실시간 OCR 결과 표시
- 원클릭 클립보드 복사 기능
- 반응형 디자인으로 다양한 화면 크기 지원

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+ Modules)
- **OCR Engine**: Tesseract.js 4.0.2
- **ML Framework**: TensorFlow.js 4.11.0 (확장 예정)
- **APIs**: 
  - Screen Capture API
  - Clipboard API
  - Local Storage API

## 📁 프로젝트 구조

```
consonant-quiz-ocr/
├── src/
│   ├── index.html              # 메인 HTML 파일
│   ├── css/
│   │   └── styles.css          # 스타일시트
│   ├── js/
│   │   ├── app.js              # 메인 애플리케이션 로직
│   │   ├── ocr.js              # OCR 처리 및 자음 인식
│   │   ├── database.js         # 데이터베이스 관리 및 검색
│   │   ├── ui.js               # UI 인터랙션 및 이벤트 처리
│   │   └── utils.js            # 유틸리티 함수들
│   └── assets/
│       ├── database.csv        # 기존 데이터베이스
│       └── database2.csv       # 확장 데이터베이스 (메인)
├── model/                      # ML 모델 파일 (향후 사용)
│   └── model.json
├── docs/
│   └── usage.md                # 사용 가이드
├── package.json                # NPM 설정
└── README.md                   # 프로젝트 문서
```

## 🚀 시작하기

### 필수 요구사항

- 최신 버전의 웹 브라우저 (Chrome, Edge, Firefox 등)
- 화면 캡쳐 권한 허용 필요
- 로컬 서버 환경 (개발 시)

### 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/dae0803/dae0803.github.io.git
cd dae0803.github.io/newver/consonant-quiz-ocr
```

2. **의존성 설치**
```bash
npm install
```

3. **개발 서버 실행**
```bash
npm start
```

4. **브라우저에서 열기**
```
http://localhost:8080
```

### GitHub Pages 배포

이 프로젝트는 GitHub Pages를 통해 자동으로 배포됩니다:

```bash
# 변경사항 커밋 및 푸시
git add .
git commit -m "자음 퀴즈 OCR 기능 구현 완료"
git push origin main
```

배포 URL: `https://dae0803.github.io/newver/consonant-quiz-ocr/src/`

## 📖 사용 방법

### 기본 사용법

1. **화면 캡쳐 시작**
   - "화면 캡쳐 시작" 버튼 클릭
   - 캡쳐할 화면/창 선택
   - OCR 엔진이 자동으로 초기화됩니다

2. **영역 선택**
   - 비디오 화면에서 마우스로 드래그하여 퀴즈 문제 영역 선택
   - 선택한 영역이 초록색 테두리로 표시됩니다

3. **자동 인식 및 검색**
   - 선택한 영역의 텍스트가 자동으로 인식됩니다
   - 추출된 자음이 실시간으로 표시됩니다
   - 데이터베이스에서 일치하는 정답들이 자동으로 검색됩니다

4. **결과 복사**
   - 개별 정답을 클릭하여 복사
   - "모든 정답 복사" 버튼으로 전체 결과 한번에 복사

### 학습 모드 사용법

1. **학습 모드 열기**
   - "학습 모드 열기" 버튼 클릭

2. **자음 선택**
   - 드롭다운에서 학습할 자음 선택 (ㄱ, ㄴ, ㄷ 등)

3. **이미지 업로드**
   - 해당 자음의 샘플 이미지들 업로드 (여러 개 가능)
   - 다양한 폰트, 크기, 스타일의 이미지 권장

4. **학습 시작**
   - "학습 시작" 버튼 클릭
   - 학습 데이터가 로컬 스토리지에 저장됩니다

## 🎯 주요 알고리즘

### 초성 인식 알고리즘
```javascript
// 초성 퀴즈의 초성 문자를 화면에서 캡쳐하여 직접 인식
// 화면에 표시된 "ㅎㄴㅅㅅ"를 OCR로 인식
// 인식된 초성으로 데이터베이스에서 정답 검색
```

### 스마트 검색 알고리즘
1. **정확 일치 검색**: 자음이 정확히 일치하는 항목 찾기
2. **부분 일치 검색**: 자음이 포함되어 있는 항목 찾기
3. **유사도 검색**: Levenshtein Distance로 유사한 항목 찾기

### 이미지 전처리
- 그레이스케일 변환
- 이진화 (Thresholding)
- 노이즈 제거

## 📊 데이터베이스 형식

`database2.csv` 파일 형식:
```csv
자음,정답
ㄱㄱ,공공
ㄱㄱㄱㅁ,기계공맥
ㄱㄱㅊ,강경찰
...
```

- 1열: 자음 (예: ㄱㄱㅊ)
- 2열: 정답 (예: 강경찰)

## 🔧 커스터마이징

### OCR 설정 변경
`src/js/ocr.js`에서 Tesseract.js 파라미터 수정:
```javascript
await ocrWorker.setParameters({
    tessedit_char_whitelist: 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ...',
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
});
```

### 검색 정확도 조정
`src/js/database.js`에서 유사도 임계값 변경:
```javascript
results = searchBySimilarity(consonant, 0.6); // 0.0 ~ 1.0
```

## 🐛 알려진 이슈

- Firefox에서 Screen Capture API의 일부 기능이 제한될 수 있습니다
- 첫 OCR 실행 시 언어 데이터 다운로드로 인해 시간이 소요될 수 있습니다
- 복잡한 배경이나 낮은 대비의 텍스트는 인식률이 낮을 수 있습니다

## 📈 향후 계획

- [ ] TensorFlow.js를 활용한 커스텀 자음 인식 모델 구현
- [ ] 다중 언어 지원 (영어, 숫자 등)
- [ ] 인식 히스토리 및 통계 기능
- [ ] 모바일 기기 지원
- [ ] PWA (Progressive Web App) 변환
- [ ] 음성 안내 기능
- [ ] 다크 모드 지원

## 🤝 기여하기

기여를 환영합니다! 다음 방법으로 기여할 수 있습니다:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👨‍💻 개발자

**dae0803**
- GitHub: [@dae0803](https://github.com/dae0803)

## 🙏 감사의 말

- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR 엔진
- [TensorFlow.js](https://www.tensorflow.org/js) - 머신러닝 프레임워크
- 모든 오픈소스 기여자들께 감사드립니다

---

**⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!**
