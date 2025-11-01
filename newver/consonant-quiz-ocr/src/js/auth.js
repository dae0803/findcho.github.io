// auth.js - GitHub 인증 및 리포지토리 접근 관리

import { log, setStatus } from './utils.js';

// GitHub OAuth 설정
const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID'; // 실제 사용 시 변경 필요
const REPO_OWNER = 'dae0803';
const REPO_NAME = 'dae0803.github.io';
const TRAINING_DATA_PATH = 'newver/consonant-quiz-ocr/training-data';

/**
 * GitHub 로그인 상태 확인
 * @returns {Object|null} 사용자 정보 또는 null
 */
export function getGitHubUser() {
    const token = localStorage.getItem('github_token');
    const userInfo = localStorage.getItem('github_user');
    
    if (token && userInfo) {
        try {
            return JSON.parse(userInfo);
        } catch (error) {
            console.error('사용자 정보 파싱 실패:', error);
            return null;
        }
    }
    return null;
}

/**
 * GitHub OAuth 인증 시작
 */
export function initiateGitHubLogin() {
    // GitHub OAuth 앱이 설정되어 있지 않은 경우 안내
    if (GITHUB_CLIENT_ID === 'YOUR_GITHUB_CLIENT_ID') {
        alert('GitHub OAuth 앱 설정이 필요합니다.\n\n' +
              '개발자에게 문의하세요:\n' +
              '1. GitHub OAuth App 생성\n' +
              '2. Client ID를 auth.js에 설정\n' +
              '3. Callback URL 설정');
        log('GitHub OAuth 설정 필요', 'warning');
        return;
    }
    
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const scope = 'repo';
    const state = generateRandomState();
    
    localStorage.setItem('oauth_state', state);
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    
    window.location.href = authUrl;
}

/**
 * OAuth 콜백 처리
 */
export async function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (!code) return false;
    
    const savedState = localStorage.getItem('oauth_state');
    if (state !== savedState) {
        setStatus('인증 오류: 상태 불일치', 'error');
        return false;
    }
    
    try {
        // 실제 구현에서는 백엔드 서버를 통해 토큰을 받아야 합니다
        // 클라이언트에서 직접 토큰을 받는 것은 보안상 권장되지 않습니다
        alert('GitHub OAuth 백엔드 서버 설정이 필요합니다.\n' +
              'GitHub Pages는 정적 호스팅이므로 백엔드 API가 필요합니다.');
        
        // 임시: 데모용 더미 로그인
        await demoLogin();
        
        // URL에서 code 파라미터 제거
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return true;
    } catch (error) {
        setStatus('GitHub 인증 실패: ' + error.message, 'error');
        return false;
    }
}

/**
 * 데모용 로그인 (실제 GitHub 인증 없이 테스트)
 */
async function demoLogin() {
    // 현재 페이지가 GitHub Pages에서 호스팅되는지 확인
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    if (isGitHubPages) {
        // GitHub Pages에서는 리포지토리 owner를 사용자로 가정
        const userInfo = {
            login: REPO_OWNER,
            name: REPO_OWNER,
            avatar_url: `https://github.com/${REPO_OWNER}.png`
        };
        
        localStorage.setItem('github_user', JSON.stringify(userInfo));
        localStorage.setItem('github_token', 'demo_token'); // 데모용
        
        setStatus(`로그인 성공: ${userInfo.login}`, 'success');
        log(`사용자 로그인: ${userInfo.login}`, 'success');
        
        return userInfo;
    } else {
        throw new Error('GitHub Pages 환경이 아닙니다');
    }
}

/**
 * GitHub 로그아웃
 */
export function logoutGitHub() {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
    localStorage.removeItem('oauth_state');
    
    setStatus('로그아웃 완료', 'success');
    log('GitHub 로그아웃', 'info');
}

/**
 * 학습 데이터를 GitHub 리포지토리에 저장
 * @param {string} consonant - 자음
 * @param {Array} imageDataList - base64 이미지 데이터 배열
 * @returns {Promise<boolean>} 성공 여부
 */
export async function saveTrainingData(consonant, imageDataList) {
    const user = getGitHubUser();
    if (!user) {
        setStatus('GitHub 로그인이 필요합니다', 'error');
        return false;
    }
    
    try {
        setStatus('학습 데이터 저장 중...', 'info');
        
        // 현재는 로컬 스토리지에만 저장 (GitHub API는 백엔드 필요)
        const trainingData = JSON.parse(localStorage.getItem('training_data') || '{}');
        
        if (!trainingData[consonant]) {
            trainingData[consonant] = [];
        }
        
        // 이미지 데이터 추가
        for (const imageData of imageDataList) {
            trainingData[consonant].push({
                data: imageData,
                timestamp: new Date().toISOString(),
                contributor: user.login
            });
        }
        
        localStorage.setItem('training_data', JSON.stringify(trainingData));
        
        // 실제 GitHub API 호출은 여기에 구현
        // await uploadToGitHub(trainingData, user.token);
        
        setStatus(`학습 데이터 저장 완료: ${consonant} (${imageDataList.length}개 이미지)`, 'success');
        log(`${consonant} 학습 데이터 ${imageDataList.length}개 저장 완료`, 'success');
        
        return true;
    } catch (error) {
        setStatus('학습 데이터 저장 실패: ' + error.message, 'error');
        log('저장 실패: ' + error.message, 'error');
        return false;
    }
}

/**
 * 학습 데이터를 GitHub에 업로드 (실제 구현 필요)
 * @param {Object} trainingData - 학습 데이터
 * @param {string} token - GitHub 토큰
 */
async function uploadToGitHub(trainingData, token) {
    // GitHub Contents API를 사용하여 파일 업로드
    // 주의: GitHub Pages는 정적 호스팅이므로 백엔드 API 필요
    
    const fileName = `training_${Date.now()}.json`;
    const filePath = `${TRAINING_DATA_PATH}/${fileName}`;
    const content = btoa(JSON.stringify(trainingData, null, 2));
    
    const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Add training data for Korean consonants`,
                content: content,
                branch: 'main'
            })
        }
    );
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'GitHub API 요청 실패');
    }
    
    return await response.json();
}

/**
 * 랜덤 상태 문자열 생성
 */
function generateRandomState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

/**
 * 저장된 학습 데이터 불러오기
 * @returns {Object} 학습 데이터
 */
export function loadTrainingData() {
    try {
        const data = localStorage.getItem('training_data');
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('학습 데이터 로드 실패:', error);
        return {};
    }
}
