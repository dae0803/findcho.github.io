// app.js - 메인 애플리케이션 로직

import { log, setStatus, setProgress, captureVideoFrame, debounce } from './utils.js';
import { loadQuizData, smartSearch } from './database.js';
import { initializeOCR, processOCR, addTrainingData, terminateOCR } from './ocr.js';
import { initUI, displayOCRResult, displaySearchResults, setLoadingState } from './ui.js';

// DOM 엘리먼트
const startCaptureBtn = document.getElementById('startCaptureBtn');
const stopCaptureBtn = document.getElementById('stopCaptureBtn');
const screenVideo = document.getElementById('screenVideo');
const captureCanvas = document.getElementById('captureCanvas');
const selectionBox = document.getElementById('selectionBox');

// 학습 모드 관련
const consonantSelect = document.getElementById('consonantSelect');
const trainImageInput = document.getElementById('trainImageInput');
const startTrainBtn = document.getElementById('startTrainBtn');
const trainPreview = document.getElementById('trainPreview');
const trainStatus = document.getElementById('trainStatus');

// 상태 변수
let mediaStream = null;
let isCapturing = false;
let ocrInterval = null;
let selectionArea = null;
let isDragging = false;
let dragStart = { x: 0, y: 0 };

/**
 * 애플리케이션 초기화
 */
async function initApp() {
    log('===== 자음 퀴즈 OCR 애플리케이션 시작 =====', 'info');
    setStatus('애플리케이션 초기화 중...', 'info');
    
    // UI 초기화
    initUI();
    
    // 데이터베이스 로드
    const dbLoaded = await loadQuizData();
    if (!dbLoaded) {
        setStatus('데이터베이스 로드 실패 - 일부 기능이 제한될 수 있습니다', 'warning');
    }
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    setStatus('준비 완료 - 화면 캡쳐를 시작하세요', 'success');
    log('애플리케이션 초기화 완료', 'success');
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 화면 캡쳐 시작
    if (startCaptureBtn) {
        startCaptureBtn.addEventListener('click', handleStartCapture);
    }
    
    // 화면 캡쳐 중지
    if (stopCaptureBtn) {
        stopCaptureBtn.addEventListener('click', handleStopCapture);
    }
    
    // 영역 선택을 위한 드래그 이벤트
    if (screenVideo) {
        screenVideo.addEventListener('mousedown', handleMouseDown);
        screenVideo.addEventListener('mousemove', handleMouseMove);
        screenVideo.addEventListener('mouseup', handleMouseUp);
    }
    
    // 학습 모드 이벤트
    if (trainImageInput) {
        trainImageInput.addEventListener('change', handleTrainImageUpload);
    }
    
    if (startTrainBtn) {
        startTrainBtn.addEventListener('click', handleStartTraining);
    }
    
    log('이벤트 리스너 설정 완료', 'info');
}

/**
 * 화면 캡쳐 시작 처리
 */
async function handleStartCapture() {
    try {
        setLoadingState(true);
        setStatus('화면 공유 요청 중...', 'info');
        
        // OCR 초기화
        const ocrReady = await initializeOCR();
        if (!ocrReady) {
            throw new Error('OCR 초기화 실패');
        }
        
        // 화면 캡쳐 시작
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: 'always',
                displaySurface: 'monitor'
            }
        });
        
        if (screenVideo) {
            screenVideo.srcObject = mediaStream;
            await screenVideo.play();
        }
        
        isCapturing = true;
        
        // UI 업데이트
        if (startCaptureBtn) startCaptureBtn.disabled = true;
        if (stopCaptureBtn) stopCaptureBtn.disabled = false;
        
        setStatus('화면 캡쳐 중 - 영역을 드래그하여 선택하세요', 'success');
        log('화면 캡쳐 시작됨', 'success');
        
        // 실시간 OCR 시작 (디바운스 적용)
        const debouncedOCR = debounce(performOCR, 1500);
        ocrInterval = setInterval(debouncedOCR, 2000);
        
    } catch (error) {
        setStatus('화면 캡쳐 실패: ' + error.message, 'error');
        log('화면 캡쳐 실패: ' + error.message, 'error');
        handleStopCapture();
    } finally {
        setLoadingState(false);
    }
}

/**
 * 화면 캡쳐 중지 처리
 */
function handleStopCapture() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    if (screenVideo) {
        screenVideo.srcObject = null;
    }
    
    if (ocrInterval) {
        clearInterval(ocrInterval);
        ocrInterval = null;
    }
    
    isCapturing = false;
    selectionArea = null;
    
    if (selectionBox) {
        selectionBox.classList.remove('active');
    }
    
    // UI 업데이트
    if (startCaptureBtn) startCaptureBtn.disabled = false;
    if (stopCaptureBtn) stopCaptureBtn.disabled = true;
    
    setStatus('화면 캡쳐 중지됨', 'info');
    log('화면 캡쳐 중지됨', 'info');
    
    setLoadingState(false);
}

/**
 * OCR 수행
 */
async function performOCR() {
    if (!isCapturing || !screenVideo || screenVideo.videoWidth === 0) {
        return;
    }
    
    try {
        // 캡쳐 영역 결정
        const canvas = captureVideoFrame(screenVideo, selectionArea);
        
        // OCR 실행
        setProgress(0.1);
        const result = await processOCR(canvas);
        setProgress(1.0);
        
        // UI 업데이트
        displayOCRResult(result.text, result.consonants);
        
        // 자음이 추출되면 검색 수행
        if (result.consonants && result.consonants.length > 0) {
            const searchResults = smartSearch(result.consonants);
            displaySearchResults(searchResults, result.consonants);
        }
        
    } catch (error) {
        log('OCR 처리 중 오류: ' + error.message, 'error');
    }
}

/**
 * 마우스 드래그 시작
 */
function handleMouseDown(e) {
    if (!isCapturing) return;
    
    isDragging = true;
    const rect = screenVideo.getBoundingClientRect();
    
    dragStart.x = e.clientX - rect.left;
    dragStart.y = e.clientY - rect.top;
    
    if (selectionBox) {
        selectionBox.style.left = dragStart.x + 'px';
        selectionBox.style.top = dragStart.y + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.classList.add('active');
    }
}

/**
 * 마우스 드래그 중
 */
function handleMouseMove(e) {
    if (!isDragging || !isCapturing) return;
    
    const rect = screenVideo.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);
    const left = Math.min(currentX, dragStart.x);
    const top = Math.min(currentY, dragStart.y);
    
    if (selectionBox) {
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
    }
}

/**
 * 마우스 드래그 종료
 */
function handleMouseUp(e) {
    if (!isDragging || !isCapturing) return;
    
    isDragging = false;
    
    const rect = screenVideo.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);
    const left = Math.min(currentX, dragStart.x);
    const top = Math.min(currentY, dragStart.y);
    
    // 선택 영역이 충분히 큰 경우에만 적용
    if (width > 20 && height > 20) {
        // 비디오 크기 대비 실제 좌표로 변환
        const scaleX = screenVideo.videoWidth / rect.width;
        const scaleY = screenVideo.videoHeight / rect.height;
        
        selectionArea = {
            x: Math.floor(left * scaleX),
            y: Math.floor(top * scaleY),
            width: Math.floor(width * scaleX),
            height: Math.floor(height * scaleY)
        };
        
        log(`선택 영역: ${selectionArea.width}x${selectionArea.height} at (${selectionArea.x}, ${selectionArea.y})`, 'info');
        setStatus('영역 선택됨 - OCR 처리 중...', 'success');
        
        // 즉시 OCR 수행
        performOCR();
    } else {
        // 선택 영역 취소
        if (selectionBox) {
            selectionBox.classList.remove('active');
        }
        selectionArea = null;
    }
}

/**
 * 학습 이미지 업로드 처리
 */
function handleTrainImageUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (trainPreview) {
        trainPreview.innerHTML = '';
        
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                trainPreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
    
    if (trainStatus) {
        trainStatus.textContent = `${files.length}개 이미지 선택됨`;
    }
}

/**
 * 학습 시작 처리
 */
async function handleStartTraining() {
    const selectedConsonant = consonantSelect.value;
    const files = trainImageInput.files;
    
    if (!selectedConsonant) {
        if (trainStatus) {
            trainStatus.textContent = '⚠️ 학습할 자음을 선택하세요';
        }
        return;
    }
    
    if (!files || files.length === 0) {
        if (trainStatus) {
            trainStatus.textContent = '⚠️ 학습 이미지를 업로드하세요';
        }
        return;
    }
    
    if (trainStatus) {
        trainStatus.textContent = '학습 중...';
    }
    
    // 이미지 처리 및 학습 데이터 추가
    let processed = 0;
    for (const file of files) {
        try {
            const canvas = await loadImageToCanvas(file);
            addTrainingData(selectedConsonant, canvas);
            processed++;
        } catch (error) {
            log(`이미지 처리 실패: ${error.message}`, 'error');
        }
    }
    
    if (trainStatus) {
        trainStatus.textContent = `✓ ${processed}개 이미지 학습 완료! '${selectedConsonant}' 자음 인식률이 향상되었습니다.`;
    }
    
    log(`'${selectedConsonant}' 자음 학습 완료: ${processed}개 이미지`, 'success');
}

/**
 * 이미지 파일을 캔버스로 로드
 * @param {File} file - 이미지 파일
 * @returns {Promise<HTMLCanvasElement>} - 캔버스
 */
function loadImageToCanvas(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 애플리케이션 종료 처리
 */
window.addEventListener('beforeunload', () => {
    handleStopCapture();
    terminateOCR();
});

// DOM이 로드되면 앱 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}