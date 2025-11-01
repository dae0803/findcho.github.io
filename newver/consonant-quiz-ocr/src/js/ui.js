// ui.js - UI 인터랙션 및 이벤트 처리

import { log, setStatus, copyToClipboard } from './utils.js';
import { smartSearch } from './database.js';
import { 
    getGitHubUser, 
    initiateGitHubLogin, 
    logoutGitHub, 
    handleOAuthCallback,
    saveTrainingData 
} from './auth.js';

// UI 엘리먼트 참조
const resultDiv = document.getElementById('result');
const copyResultBtn = document.getElementById('copyResultBtn');
const clearResultBtn = document.getElementById('clearResultBtn');
const ocrLiveText = document.getElementById('ocrLiveText');
const copyOcrBtn = document.getElementById('copyOcrBtn');
const trainModal = document.getElementById('trainModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeModalBtn = document.querySelector('.close');
const githubLoginBtn = document.getElementById('githubLoginBtn');
const githubLogoutBtn = document.getElementById('githubLogoutBtn');
const authStatus = document.getElementById('authStatus');
const userInfo = document.getElementById('userInfo');
const usernameSpan = document.getElementById('username');
const trainingArea = document.getElementById('trainingArea');

let currentResults = [];
let currentConsonants = '';

/**
 * UI 초기화
 */
export function initUI() {
    log('UI 초기화 중...', 'info');
    
    // OAuth 콜백 처리
    handleOAuthCallback();
    
    // 결과 복사 버튼
    if (copyResultBtn) {
        copyResultBtn.addEventListener('click', handleCopyResults);
    }
    
    // 결과 지우기 버튼
    if (clearResultBtn) {
        clearResultBtn.addEventListener('click', handleClearResults);
    }
    
    // OCR 텍스트 복사 버튼
    if (copyOcrBtn) {
        copyOcrBtn.addEventListener('click', handleCopyOCR);
    }
    
    // 설정 버튼 (학습 모드)
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openTrainModal);
    }
    
    // GitHub 로그인/로그아웃 버튼
    if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', handleGitHubLogin);
    }
    
    if (githubLogoutBtn) {
        githubLogoutBtn.addEventListener('click', handleGitHubLogout);
    }
    
    // 모달 닫기
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeTrainModal);
    }
    
    // 모달 외부 클릭시 닫기
    window.addEventListener('click', (event) => {
        if (event.target === trainModal) {
            closeTrainModal();
        }
    });
    
    // 초기 인증 상태 확인
    updateAuthUI();
    
    log('UI 초기화 완료', 'success');
}

/**
 * 실시간 OCR 결과 표시
 * @param {string} text - 인식된 텍스트
 * @param {string} consonants - 추출된 자음
 */
export function displayOCRResult(text, consonants) {
    if (ocrLiveText) {
        if (consonants && consonants.length > 0) {
            ocrLiveText.innerHTML = `
                <div>
                    <strong>인식된 텍스트:</strong> ${text || '(없음)'}<br>
                    <strong>추출된 자음:</strong> <span style="font-size: 24px; color: #2e7d32;">${consonants}</span>
                </div>
            `;
            currentConsonants = consonants;
            
            if (copyOcrBtn) {
                copyOcrBtn.style.display = 'inline-block';
            }
        } else {
            ocrLiveText.textContent = '자음을 인식하는 중...';
            if (copyOcrBtn) {
                copyOcrBtn.style.display = 'none';
            }
        }
    }
}

/**
 * 검색 결과 표시
 * @param {Array} results - 검색 결과 배열
 * @param {string} consonants - 검색한 자음
 */
export function displaySearchResults(results, consonants) {
    if (!resultDiv) return;
    
    currentResults = results;
    
    // 결과가 없는 경우
    if (!results || results.length === 0) {
        resultDiv.innerHTML = `
            <div class="placeholder">
                <p style="font-size: 18px;">😔 검색 결과가 없습니다</p>
                <p style="color: #666;">검색한 자음: <strong>${consonants || '(없음)'}</strong></p>
                <p style="font-size: 14px; color: #999;">다시 시도하거나 영역을 조정해보세요.</p>
            </div>
        `;
        
        if (copyResultBtn) {
            copyResultBtn.disabled = true;
        }
        
        setStatus(`검색 결과 없음: '${consonants}'`, 'warning');
        return;
    }
    
    // 결과 표시
    let html = `
        <div style="margin-bottom: 10px; padding: 10px; background: #e3f2fd; border-radius: 6px;">
            <strong>검색한 자음:</strong> <span style="font-size: 20px; color: #1976d2;">${consonants}</span><br>
            <strong>검색 결과:</strong> <span style="color: #4caf50;">${results.length}개</span>
        </div>
    `;
    
    results.forEach((item, index) => {
        const similarity = item.similarity ? ` (유사도: ${(item.similarity * 100).toFixed(0)}%)` : '';
        html += `
            <div class="result-item" data-index="${index}">
                <span class="consonant">${item.consonant}</span>
                <span class="answer">${item.answer}</span>
                ${similarity ? `<span style="font-size: 12px; color: #999;">${similarity}</span>` : ''}
            </div>
        `;
    });
    
    resultDiv.innerHTML = html;
    
    // 결과 항목 클릭 이벤트
    const resultItems = resultDiv.querySelectorAll('.result-item');
    resultItems.forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.getAttribute('data-index'));
            handleCopySingleResult(index);
        });
    });
    
    // 복사 버튼 활성화
    if (copyResultBtn) {
        copyResultBtn.disabled = false;
    }
    
    setStatus(`검색 완료: ${results.length}개 결과 표시`, 'success');
    log(`검색 결과 표시: ${results.length}개`, 'success');
}

/**
 * 모든 결과 복사 처리
 */
async function handleCopyResults() {
    if (!currentResults || currentResults.length === 0) {
        setStatus('복사할 결과가 없습니다', 'warning');
        return;
    }
    
    const text = currentResults.map(item => item.answer).join('\n');
    const success = await copyToClipboard(text);
    
    if (success) {
        setStatus(`${currentResults.length}개 정답이 클립보드에 복사되었습니다`, 'success');
        log(`${currentResults.length}개 정답 복사됨`, 'success');
        
        // 버튼 피드백
        const originalText = copyResultBtn.textContent;
        copyResultBtn.textContent = '✓ 복사됨!';
        copyResultBtn.style.background = '#4caf50';
        
        setTimeout(() => {
            copyResultBtn.textContent = originalText;
            copyResultBtn.style.background = '';
        }, 2000);
    } else {
        setStatus('클립보드 복사 실패', 'error');
    }
}

/**
 * 단일 결과 복사 처리
 * @param {number} index - 결과 인덱스
 */
async function handleCopySingleResult(index) {
    if (!currentResults || !currentResults[index]) {
        return;
    }
    
    const item = currentResults[index];
    const success = await copyToClipboard(item.answer);
    
    if (success) {
        setStatus(`'${item.answer}' 복사됨`, 'success');
        log(`단일 정답 복사: ${item.answer}`, 'info');
    } else {
        setStatus('복사 실패', 'error');
    }
}

/**
 * 결과 지우기 처리
 */
function handleClearResults() {
    if (resultDiv) {
        resultDiv.innerHTML = '<p class="placeholder">정답이 여기에 표시됩니다.</p>';
    }
    
    if (ocrLiveText) {
        ocrLiveText.textContent = '실시간 OCR 결과...';
    }
    
    if (copyOcrBtn) {
        copyOcrBtn.style.display = 'none';
    }
    
    if (copyResultBtn) {
        copyResultBtn.disabled = true;
    }
    
    currentResults = [];
    currentConsonants = '';
    
    setStatus('결과가 지워졌습니다', 'info');
    log('결과 지움', 'info');
}

/**
 * OCR 텍스트 복사 처리
 */
async function handleCopyOCR() {
    if (!currentConsonants) {
        setStatus('복사할 자음이 없습니다', 'warning');
        return;
    }
    
    const success = await copyToClipboard(currentConsonants);
    
    if (success) {
        setStatus('자음이 클립보드에 복사되었습니다', 'success');
        log(`자음 복사: ${currentConsonants}`, 'info');
    } else {
        setStatus('복사 실패', 'error');
    }
}

/**
 * 학습 모달 열기
 */
function openTrainModal() {
    if (trainModal) {
        trainModal.style.display = 'block';
        updateAuthUI();
        log('학습 모드 열림', 'info');
    }
}

/**
 * 학습 모달 닫기
 */
function closeTrainModal() {
    if (trainModal) {
        trainModal.style.display = 'none';
        log('학습 모드 닫힘', 'info');
    }
}

/**
 * GitHub 로그인 처리
 */
function handleGitHubLogin() {
    log('GitHub 로그인 시작', 'info');
    initiateGitHubLogin();
}

/**
 * GitHub 로그아웃 처리
 */
function handleGitHubLogout() {
    logoutGitHub();
    updateAuthUI();
    closeTrainModal();
}

/**
 * 인증 UI 업데이트
 */
function updateAuthUI() {
    const user = getGitHubUser();
    
    if (user) {
        // 로그인된 상태
        if (authStatus && userInfo && usernameSpan && trainingArea) {
            authStatus.style.display = 'none';
            userInfo.style.display = 'block';
            usernameSpan.textContent = user.login || user.name;
            trainingArea.style.display = 'block';
        }
        
        log(`인증 상태: ${user.login}`, 'success');
    } else {
        // 로그아웃 상태
        if (authStatus && userInfo && trainingArea) {
            authStatus.style.display = 'block';
            userInfo.style.display = 'none';
            trainingArea.style.display = 'none';
        }
        
        log('인증 상태: 로그아웃', 'info');
    }
}

/**
 * 로딩 상태 표시
 * @param {boolean} isLoading - 로딩 중 여부
 */
export function setLoadingState(isLoading) {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        if (isLoading) {
            btn.classList.add('loading');
            btn.disabled = true;
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    });
}

/**
 * 에러 메시지 표시
 * @param {string} message - 에러 메시지
 */
export function showError(message) {
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #f44336;">
                <p style="font-size: 18px;">❌ ${message}</p>
            </div>
        `;
    }
    
    setStatus(message, 'error');
}

/**
 * 성공 메시지 표시
 * @param {string} message - 성공 메시지
 */
export function showSuccess(message) {
    setStatus(message, 'success');
}

/**
 * 현재 결과 가져오기
 * @returns {Array} - 현재 검색 결과
 */
export function getCurrentResults() {
    return currentResults;
}

/**
 * 현재 자음 가져오기
 * @returns {string} - 현재 인식된 자음
 */
export function getCurrentConsonants() {
    return currentConsonants;
}