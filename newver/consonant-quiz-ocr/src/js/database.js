// database.js - 퀴즈 데이터베이스 관리

import { log, setStatus } from './utils.js';

let quizData = [];
let dataLoaded = false;

/**
 * CSV 파일에서 퀴즈 데이터 로드
 * @returns {Promise<boolean>} - 로드 성공 여부
 */
export async function loadQuizData() {
    if (dataLoaded) {
        return true;
    }

    try {
        setStatus('데이터베이스 로딩 중...', 'info');
        const response = await fetch('assets/database2.csv');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.statusText}`);
        }
        
        const text = await response.text();
        parseCSV(text);
        
        dataLoaded = true;
        setStatus(`데이터베이스 로드 완료 (${quizData.length}개 항목)`, 'success');
        log(`퀴즈 데이터 로드 완료: ${quizData.length}개 항목`, 'success');
        
        return true;
    } catch (error) {
        setStatus('데이터베이스 로드 실패: ' + error.message, 'error');
        log('데이터베이스 로드 실패: ' + error.message, 'error');
        return false;
    }
}

/**
 * CSV 텍스트 파싱
 * @param {string} text - CSV 텍스트
 */
function parseCSV(text) {
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    quizData = lines.map((line, index) => {
        // CSV 파싱: 쉼표로 분리하되, 따옴표 안의 쉼표는 무시
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length >= 2) {
            return {
                consonant: parts[0],  // 자음 (1열)
                answer: parts[1],      // 정답 (2열)
                lineNumber: index + 1
            };
        }
        
        return null;
    }).filter(item => item !== null && item.consonant && item.answer);
    
    log(`CSV 파싱 완료: ${quizData.length}개 항목 추출`, 'info');
}

/**
 * 자음으로 정답 검색 (모든 일치하는 결과 반환)
 * @param {string} consonant - 검색할 자음
 * @returns {Array} - 일치하는 모든 정답 배열
 */
export function searchByConsonant(consonant) {
    if (!consonant || consonant.trim() === '') {
        return [];
    }
    
    const searchKey = consonant.trim();
    
    // 정확히 일치하는 모든 항목 찾기
    const results = quizData.filter(item => item.consonant === searchKey);
    
    log(`'${searchKey}' 검색 결과: ${results.length}개 발견`, 'info');
    
    return results;
}

/**
 * 부분 일치 검색 (자음의 일부만 일치해도 검색)
 * @param {string} consonant - 검색할 자음
 * @returns {Array} - 일치하는 모든 정답 배열
 */
export function searchByPartialConsonant(consonant) {
    if (!consonant || consonant.trim() === '') {
        return [];
    }
    
    const searchKey = consonant.trim();
    
    // 부분 일치하는 모든 항목 찾기
    const results = quizData.filter(item => 
        item.consonant.includes(searchKey) || searchKey.includes(item.consonant)
    );
    
    log(`'${searchKey}' 부분 일치 검색 결과: ${results.length}개 발견`, 'info');
    
    return results;
}

/**
 * 유사도 기반 검색 (Levenshtein distance 사용)
 * @param {string} consonant - 검색할 자음
 * @param {number} threshold - 유사도 임계값 (기본: 0.7)
 * @returns {Array} - 유사한 항목들의 배열
 */
export function searchBySimilarity(consonant, threshold = 0.7) {
    if (!consonant || consonant.trim() === '') {
        return [];
    }
    
    const searchKey = consonant.trim();
    const results = [];
    
    for (const item of quizData) {
        const similarity = calculateSimilarity(searchKey, item.consonant);
        if (similarity >= threshold) {
            results.push({
                ...item,
                similarity: similarity
            });
        }
    }
    
    // 유사도 순으로 정렬
    results.sort((a, b) => b.similarity - a.similarity);
    
    log(`'${searchKey}' 유사도 검색 결과: ${results.length}개 발견 (threshold: ${threshold})`, 'info');
    
    return results;
}

/**
 * 두 문자열 간의 유사도 계산 (0-1 범위)
 * @param {string} str1 - 첫 번째 문자열
 * @param {string} str2 - 두 번째 문자열
 * @returns {number} - 유사도 (0-1)
 */
function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
        return 1.0;
    }
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance 계산
 * @param {string} str1 - 첫 번째 문자열
 * @param {string} str2 - 두 번째 문자열
 * @returns {number} - 편집 거리
 */
function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

/**
 * 스마트 검색: 정확 일치 -> 부분 일치 -> 유사도 검색 순으로 시도
 * @param {string} consonant - 검색할 자음
 * @returns {Array} - 검색 결과 배열
 */
export function smartSearch(consonant) {
    if (!consonant || consonant.trim() === '') {
        return [];
    }
    
    // 1. 정확 일치 검색
    let results = searchByConsonant(consonant);
    if (results.length > 0) {
        log(`정확 일치 검색 성공: ${results.length}개`, 'success');
        return results;
    }
    
    // 2. 부분 일치 검색
    results = searchByPartialConsonant(consonant);
    if (results.length > 0) {
        log(`부분 일치 검색 성공: ${results.length}개`, 'success');
        return results;
    }
    
    // 3. 유사도 기반 검색
    results = searchBySimilarity(consonant, 0.6);
    if (results.length > 0) {
        log(`유사도 검색 성공: ${results.length}개`, 'success');
        return results;
    }
    
    log(`검색 결과 없음: '${consonant}'`, 'warning');
    return [];
}

/**
 * 전체 데이터 가져오기
 * @returns {Array} - 전체 퀴즈 데이터
 */
export function getAllData() {
    return quizData;
}

/**
 * 데이터 로드 상태 확인
 * @returns {boolean} - 데이터 로드 여부
 */
export function isDataLoaded() {
    return dataLoaded;
}