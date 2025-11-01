// utils.js - 유틸리티 함수들

/**
 * 한글 문자열에서 초성만 추출 (초성 퀴즈용)
 * @param {string} s - 입력 문자열
 * @returns {string} - 추출된 초성 문자열
 */
export function normalizeKey(s) {
    if (!s) return '';
    let t = String(s).normalize('NFC');
    const consonants = [];
    
    // 한글 자음 매핑 (초성만)
    const chosung = [
        'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
        'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ];
    
    for (let i = 0; i < t.length; i++) {
        const char = t[i];
        const code = char.charCodeAt(0);
        
        // 한글 음절 (가-힣) - 초성만 추출
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const syllableIndex = code - 0xAC00;
            const chosungIndex = Math.floor(syllableIndex / 588);
            consonants.push(chosung[chosungIndex]);
        }
        // 자음 자체 (ㄱ-ㅎ)
        else if (code >= 0x3131 && code <= 0x314E) {
            consonants.push(char);
        }
    }
    
    return consonants.join('');
}

/**
 * 로그 메시지 출력
 * @param {string} msg - 로그 메시지
 * @param {string} type - 로그 타입 (info, success, error, warning)
 */
export function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString('ko-KR');
    const logElement = document.getElementById('log');
    
    let prefix = '';
    switch(type) {
        case 'success': prefix = '✓'; break;
        case 'error': prefix = '✗'; break;
        case 'warning': prefix = '⚠'; break;
        default: prefix = 'ℹ'; break;
    }
    
    const logMsg = `[${time}] ${prefix} ${msg}\n`;
    
    if (logElement) {
        logElement.textContent += logMsg;
        logElement.scrollTop = logElement.scrollHeight;
    }
    
    console.log(`[${time}] ${msg}`);
}

/**
 * 프로그레스 바 업데이트
 * @param {number} p - 진행률 (0-1)
 */
export function setProgress(p) {
    const progressBar = document.querySelector('#progress > i');
    if (progressBar) {
        const pct = Math.max(0, Math.min(1, Number(p) || 0));
        progressBar.style.width = Math.round(pct * 100) + '%';
    }
}

/**
 * 상태 메시지 업데이트
 * @param {string} message - 상태 메시지
 * @param {string} type - 메시지 타입
 */
export function setStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'status-box';
        
        // 타입에 따른 스타일 적용
        if (type === 'error') {
            statusElement.style.borderLeftColor = '#f44336';
            statusElement.style.background = '#ffebee';
        } else if (type === 'success') {
            statusElement.style.borderLeftColor = '#4caf50';
            statusElement.style.background = '#e8f5e9';
        } else if (type === 'warning') {
            statusElement.style.borderLeftColor = '#ff9800';
            statusElement.style.background = '#fff3e0';
        } else {
            statusElement.style.borderLeftColor = '#2196F3';
            statusElement.style.background = '#e7f3ff';
        }
    }
    
    log(message, type);
}

/**
 * 텍스트를 클립보드에 복사
 * @param {string} text - 복사할 텍스트
 * @returns {Promise<boolean>} - 성공 여부
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('클립보드 복사 실패:', error);
        return false;
    }
}

/**
 * 디바운스 함수 생성
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function} - 디바운스된 함수
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Canvas에서 이미지 데이터 추출
 * @param {HTMLVideoElement} video - 비디오 엘리먼트
 * @param {Object} selection - 선택 영역 {x, y, width, height}
 * @returns {HTMLCanvasElement} - 캡쳐된 캔버스
 */
export function captureVideoFrame(video, selection = null) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (selection && selection.width > 0 && selection.height > 0) {
        canvas.width = selection.width;
        canvas.height = selection.height;
        context.drawImage(
            video,
            selection.x, selection.y, selection.width, selection.height,
            0, 0, selection.width, selection.height
        );
    } else {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    return canvas;
}

/**
 * 이미지 전처리 (OCR 정확도 향상을 위해)
 * @param {HTMLCanvasElement} canvas - 원본 캔버스
 * @returns {HTMLCanvasElement} - 전처리된 캔버스
 */
export function preprocessImage(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 그레이스케일 및 이진화
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const value = avg > 128 ? 255 : 0; // 임계값 128
        
        data[i] = value;     // Red
        data[i + 1] = value; // Green
        data[i + 2] = value; // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

/**
 * 로컬 스토리지에 데이터 저장
 * @param {string} key - 키
 * @param {*} value - 저장할 값
 */
export function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('로컬 스토리지 저장 실패:', error);
        return false;
    }
}

/**
 * 로컬 스토리지에서 데이터 불러오기
 * @param {string} key - 키
 * @param {*} defaultValue - 기본값
 * @returns {*} - 저장된 값 또는 기본값
 */
export function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('로컬 스토리지 불러오기 실패:', error);
        return defaultValue;
    }
}