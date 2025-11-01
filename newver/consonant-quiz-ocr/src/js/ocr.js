// ocr.js - OCR 처리 및 자음 인식 로직

import { log, setStatus, setProgress, normalizeKey, preprocessImage, saveToLocalStorage, loadFromLocalStorage } from './utils.js';

let ocrWorker = null;
let isOCRInitialized = false;
let trainingData = loadFromLocalStorage('consonant_training_data', {});

/**
 * Tesseract.js OCR 워커 초기화
 * @returns {Promise<boolean>} - 초기화 성공 여부
 */
export async function initializeOCR() {
    if (isOCRInitialized && ocrWorker) {
        return true;
    }

    try {
        setStatus('OCR 엔진 초기화 중...', 'info');
        setProgress(0.1);
        
        // Tesseract.js가 로드되었는지 확인
        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js가 로드되지 않았습니다');
        }
        
        // 워커 생성
        ocrWorker = await Tesseract.createWorker({
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    setProgress(m.progress * 0.8 + 0.2);
                }
            }
        });
        
        setProgress(0.3);
        
        // 한글 언어 데이터 로드
        await ocrWorker.loadLanguage('kor+eng');
        setProgress(0.6);
        
        // 한글 초기화
        await ocrWorker.initialize('kor+eng');
        setProgress(0.8);
        
        // OCR 설정
        await ocrWorker.setParameters({
            tessedit_char_whitelist: 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉ가-힣0-9',
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        });
        
        setProgress(1.0);
        isOCRInitialized = true;
        
        setStatus('OCR 엔진 초기화 완료', 'success');
        log('Tesseract.js 초기화 완료', 'success');
        
        return true;
    } catch (error) {
        setStatus('OCR 초기화 실패: ' + error.message, 'error');
        log('OCR 초기화 실패: ' + error.message, 'error');
        return false;
    }
}

/**
 * OCR 워커 종료
 */
export async function terminateOCR() {
    if (ocrWorker) {
        try {
            await ocrWorker.terminate();
            ocrWorker = null;
            isOCRInitialized = false;
            log('OCR 워커 종료됨', 'info');
        } catch (error) {
            log('OCR 워커 종료 실패: ' + error.message, 'error');
        }
    }
}

/**
 * 이미지에서 텍스트 인식
 * @param {HTMLCanvasElement} canvas - 인식할 이미지가 있는 캔버스
 * @returns {Promise<string>} - 인식된 텍스트
 */
export async function recognizeText(canvas) {
    if (!isOCRInitialized || !ocrWorker) {
        log('OCR이 초기화되지 않았습니다', 'error');
        return '';
    }

    try {
        setStatus('텍스트 인식 중...', 'info');
        
        // 이미지 전처리
        const processedCanvas = preprocessImage(canvas);
        
        // OCR 실행
        const { data } = await ocrWorker.recognize(processedCanvas);
        
        log(`OCR 완료 - 신뢰도: ${(data.confidence).toFixed(2)}%`, 'info');
        
        return data.text.trim();
    } catch (error) {
        log('OCR 인식 실패: ' + error.message, 'error');
        setStatus('텍스트 인식 실패', 'error');
        return '';
    }
}

/**
 * 인식된 텍스트에서 자음만 추출
 * @param {string} text - 인식된 텍스트
 * @returns {string} - 추출된 자음
 */
export function extractConsonants(text) {
    if (!text) return '';
    
    const consonants = normalizeKey(text);
    log(`자음 추출: "${text}" → "${consonants}"`, 'info');
    
    return consonants;
}

/**
 * 전체 OCR 프로세스 실행 (인식 + 자음 추출)
 * @param {HTMLCanvasElement} canvas - 인식할 이미지가 있는 캔버스
 * @returns {Promise<Object>} - { text, consonants }
 */
export async function processOCR(canvas) {
    const text = await recognizeText(canvas);
    const consonants = extractConsonants(text);
    
    return {
        text: text,
        consonants: consonants
    };
}

/**
 * 자음 학습 데이터 추가
 * @param {string} consonant - 학습할 자음
 * @param {HTMLCanvasElement} canvas - 자음 이미지
 */
export function addTrainingData(consonant, canvas) {
    if (!trainingData[consonant]) {
        trainingData[consonant] = [];
    }
    
    // 캔버스를 base64로 변환하여 저장
    const imageData = canvas.toDataURL('image/png');
    trainingData[consonant].push({
        image: imageData,
        timestamp: Date.now()
    });
    
    // 로컬 스토리지에 저장
    saveToLocalStorage('consonant_training_data', trainingData);
    
    log(`'${consonant}' 학습 데이터 추가됨 (총 ${trainingData[consonant].length}개)`, 'success');
}

/**
 * 특정 자음의 학습 데이터 가져오기
 * @param {string} consonant - 자음
 * @returns {Array} - 학습 데이터 배열
 */
export function getTrainingData(consonant) {
    return trainingData[consonant] || [];
}

/**
 * 모든 학습 데이터 가져오기
 * @returns {Object} - 전체 학습 데이터
 */
export function getAllTrainingData() {
    return trainingData;
}

/**
 * 학습 데이터 초기화
 */
export function clearTrainingData() {
    trainingData = {};
    saveToLocalStorage('consonant_training_data', {});
    log('학습 데이터 초기화됨', 'info');
}

/**
 * TensorFlow.js를 사용한 커스텀 자음 인식 모델 학습
 * (향후 구현 예정)
 */
export async function trainCustomModel() {
    setStatus('커스텀 모델 학습 중...', 'info');
    
    try {
        // TensorFlow.js 모델 학습 로직
        // 현재는 기본 Tesseract.js 사용
        
        log('커스텀 모델 학습 기능은 추후 구현 예정입니다', 'warning');
        setStatus('학습 기능 준비 중', 'warning');
        
        return false;
    } catch (error) {
        log('모델 학습 실패: ' + error.message, 'error');
        setStatus('모델 학습 실패', 'error');
        return false;
    }
}

/**
 * OCR 정확도 향상을 위한 이미지 후처리
 * @param {string} text - OCR 결과 텍스트
 * @returns {string} - 후처리된 텍스트
 */
export function postProcessOCR(text) {
    if (!text) return '';
    
    let processed = text;
    
    // 공백 제거
    processed = processed.replace(/\s+/g, '');
    
    // 특수문자 제거
    processed = processed.replace(/[^\u3131-\u314E\uAC00-\uD7A3\u0030-\u0039]/g, '');
    
    // 자주 잘못 인식되는 문자 보정
    const corrections = {
        '0': 'ㅇ',
        'O': 'ㅇ',
        'l': 'ㅣ',
        'I': 'ㅣ',
        '1': 'ㄱ'
    };
    
    for (const [wrong, correct] of Object.entries(corrections)) {
        processed = processed.replace(new RegExp(wrong, 'g'), correct);
    }
    
    return processed;
}

/**
 * OCR 초기화 상태 확인
 * @returns {boolean} - 초기화 여부
 */
export function isInitialized() {
    return isOCRInitialized;
}