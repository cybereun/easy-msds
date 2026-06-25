# EasyMSDS 🧪

![Version](https://img.shields.io/badge/version-V1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)
![PWA](https://img.shields.io/badge/PWA-Supported-brightgreen.svg)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black.svg)

EasyMSDS는 화학물질에 대한 기본 정보, KOSHA 물질안전보건자료(MSDS), 그리고 3D 분자 구조 시각화 기능을 한 화면에서 통합 제공하는 웹 애플리케이션입니다.

## 🚀 특징 (Features)

- **통합 검색 시스템:** 물질명, CAS No. 등을 통해 화학물질 정보를 한 번에 검색할 수 있습니다.
- **KOSHA MSDS 연동:** 공공데이터포털(안전보건공단) API를 통해 신뢰할 수 있는 물질안전보건자료를 제공합니다.
- **2D / 3D 분자 구조 시각화:** PubChem API를 활용하여 화학물질의 2D 구조식과 3D 분자 모형을 시각적으로 제공합니다.
- **모바일 반응형 웹:** 데스크탑 뿐만 아니라 스마트폰 화면에서도 완벽하게 동작하는 반응형 UI를 지원합니다.
- **PWA 앱 설치 지원:** 웹 브라우저에서 버튼 하나로 기기에 앱처럼 설치(PWA)하여 언제든 쉽게 접근할 수 있습니다.
- **깔끔한 인쇄 기능:** 화학물질 정보를 한 장의 종이나 PDF로 깔끔하게 인쇄 및 저장할 수 있습니다.

## 💻 설치 및 실행 방법 (Installation)

### 개발 환경 로컬 실행

1. **저장소 복제 (Clone)**
   ```bash
   git clone https://github.com/cybereun/easy-msds.git
   cd easy-msds
   ```

2. **패키지 설치 (Install Dependencies)**
   ```bash
   npm install
   ```

3. **개발 서버 실행 (Run Dev Server)**
   ```bash
   npm run dev
   ```

### Vercel 배포 (Deployment)
EasyMSDS는 Vercel 배포에 최적화되어 있습니다.
Vercel 대시보드에서 이 리포지토리를 가져오기(Import)하면 자동으로 빌드 및 배포가 완료됩니다. (빌드 명령어: `npm run build`, 출력 디렉토리: `dist`)

## 👨‍💻 개발자 정보 (Developer Info)
- **Developer:** [cybereun](https://github.com/cybereun)

## 📝 릴리즈 노트 (Release Notes)

### V1.0.0 (최초 릴리즈)
- 통합 화학물질 검색 및 정보 시각화 아키텍처 구축
- KOSHA 공공 API 연동
- PubChem 및 ChEMBL 기반 2D/3D 분자 뷰어 추가
- 모바일 디바이스 지원 반응형 UI 적용
- PWA(Progressive Web App) 기능 및 앱 설치 프롬프트 지원
- Vercel 배포 최적화
