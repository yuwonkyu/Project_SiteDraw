# Project SiteDraw

건설 현장 도면을 구조적으로 탐색하고 리비전 이력을 빠르게 파악하는 웹 기반 UI 프로토타입입니다.

## 주요 기능

### ✅ 완료된 기능

- **계층적 탐색 트리** - 공간 → 공종 → 리전 → 리비전 구조
- **다중 오버레이** - Ctrl+Click으로 여러 공종 동시 선택 및 색상 구분 표시
- **레이어 토글** - 각 레이어 개별 켜기/끄기 제어
- **현재 컨텍스트 패널** - 선택된 항목의 경로, 메타데이터, 리비전 목록 표시
- **도면 뷰어** - 기본 도면 + 오버레이 렌더링, 폴리곤 하이라이트
- **리전 분기** - 공종 내 영역별 리비전 분리 탐색
- **모노컬러 UI** - 흑백 테마로 시각적 노이즈 최소화

### 📋 예정된 기능

- 리비전 비교 뷰
- 필터링 (공종/날짜/영역)
- 검색 기능
- 도면 확대/축소/이동

## 기술 스택

- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS 4
- **Architecture**: FSD (Feature-Sliced Design)
- **Deployment**: Vercel

## 프로젝트 구조 (FSD)

```
src/
├── app/                        # Next.js App Router
│   ├── globals.css            # 전역 스타일
│   ├── layout.tsx             # 루트 레이아웃
│   └── page.tsx               # 홈 페이지
├── entities/                   # 도메인 엔티티
│   └── drawing/
│       └── model/             # Drawing 타입 정의 및 파싱 로직
├── widgets/                    # 복합 UI 블록
│   ├── drawing-context/       # 현재 컨텍스트 패널
│   ├── drawing-tree/          # 탐색 트리
│   ├── drawing-viewer/        # 도면 뷰어
│   ├── drawing-workspace/     # 통합 작업 공간
│   └── layout/                # 헤더, 메인
└── shared/                     # 공통 리소스
    ├── lib/                   # 유틸리티 (cn)
    ├── mock/                  # Mock 데이터
    └── ui/                    # 공통 UI 컴포넌트
```

## 개발 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 핵심 설계 원칙

### 1. 소스/모델 분리
- `metadata.json`을 원본으로 유지
- 파싱된 내부 모델 (`ParsedDrawingData`)로 UI 구동

### 2. 타입 안정성
- 공종/리비전 ID를 Union/Template Literal 타입으로 제한
- Strict TypeScript 설정

### 3. 성능 최적화
- `useMemo`로 계산 캐싱
- `useCallback`으로 콜백 최적화
- 레이어 렌더링 전 필터링

### 4. 사용자 경험
- 실무자 탐색 흐름(공간 → 공종 → 리비전)에 최적화
- 다중 선택 + 레이어 토글로 비교 작업 지원
- 색상으로 레이어 구분 (최대 5개)

## 배포

Vercel을 통해 자동 배포됩니다.

- **Production**: `main` 브랜치 push → 자동 배포
- **Preview**: PR 생성 → Preview 환경 자동 생성

## 최근 업데이트

### 2026-02-16
- ✅ 다중 오버레이 기능 구현 (Ctrl+Click 다중선택)
- ✅ 레이어 토글 기능 추가 (개별 켜기/끄기)
- ✅ 코드 최적화 및 클린코드 적용
  - `useCallback`, `useMemo` 도입
  - 미사용 코드 및 파일 제거
  - TSDoc 스타일 주석 정리
  - 상수 이름 통일

## 라이선스

MIT
