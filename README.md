# Project SiteDraw

건설 현장 도면을 구조적으로 탐색하고 리비전 이력을 빠르게 파악하는 웹 기반 도면 뷰어입니다.

**🔗 Links:**

- 🚀 **배포 사이트**: [https://project-site-draw.vercel.app/](https://project-site-draw.vercel.app/)
- 📦 **GitHub**: [https://github.com/yuwonkyu/Project_SiteDraw](https://github.com/yuwonkyu/Project_SiteDraw)

---

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

개발 서버 실행 후 브라우저에서 `http://localhost:3000`으로 접속하세요.

---

## 기술 스택

- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS 4
- **Architecture**: FSD (Feature-Sliced Design)
- **Runtime**: Node.js 18+

---

## 구현 기능

### ✅ 완성한 기능

- [x] **도면 탐색** - 공간 → 공종 → 리전 → 리비전 계층 구조 탐색
- [x] **도면 표시** - 선택한 도면 이미지를 화면에 렌더링
- [x] **컨텍스트 인식** - 현재 보고 있는 도면의 경로와 메타데이터 표시 (Breadcrumb, 상세 정보 패널)
- [x] **다중 선택 (Ctrl+Click)** - 여러 공종/리비전 동시 선택
- [x] **다중 오버레이** - 선택된 공종들을 5가지 색상으로 구분하여 동시 렌더링
- [x] **레이어 토글** - 각 리비전 개별 켜기/끄기 제어
- [x] **리비전 선택 UI** - 리비전 항목 클릭으로 강조 표시
- [x] **리전 분기** - 공종 내 영역별 리비전 분리 탐색
- [x] **모노컬러 UI** - 흑백 테마로 시각적 노이즈 최소화
- [x] **검색/필터링** - 공종명, 리비전 버전으로 필터링
- [x] **도면 줌/팬** - 마우스 휠 줌, 드래그로 패닝
- [x] **비교 모드** - 여러 리비전 병렬 표시 (투명도 조절, 개별 표시/숨김)
- [x] **마크업 기능** - 펜, 지우개, 도형 도구 (선, 사각형, 원, 텍스트)

### 📋 미완성 기능

- [ ] **마크업 좌표 정확도** - 줌/팬 후 마크업 위치 불일치 (임시 해결책: 1:1 줌에서 사용)
- [ ] **마크업 데이터 저장** - 마크업 모드 종료 시 데이터 손실 (sessionStorage 백업 필요)
- [ ] **내보내기 기능** - PDF/이미지 다운로드

> **참고**: 미완성 기능의 상세 원인 분석 및 해결 방안은 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)를 참고하세요.

---

## 프로젝트 구조

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
│   ├── drawing-filter/        # 검색/필터 위젯
│   ├── drawing-tree/          # 탐색 트리
│   ├── drawing-viewer/        # 도면 뷰어 (줌/팬/마크업/비교 모드)
│   ├── drawing-workspace/     # 통합 작업 공간
│   └── layout/                # 헤더, 메인
└── shared/                     # 공통 리소스
    ├── lib/                   # 유틸리티 (cn, markup)
    ├── mock/                  # Mock 데이터 (metadata.json)
    └── ui/                    # 공통 UI 컴포넌트
```

---

## 문서

- [DESIGN.md](DESIGN.md) - 설계 의도, UI 결정 과정, 기술 선택 근거
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - 알려진 이슈 및 문제 해결 가이드

---

## 최근 업데이트

### 2026-02-19 (최신)

- ✅ **도면 뷰어 대규모 리팩토링** - 1145줄 → 450줄로 60% 축소
  - Custom Hooks 분리: `useDrawingViewer`, `useMarkup`, `useComparisonMode`
  - UI 컴포넌트 분리: `MarkupToolsPanel`, `ComparisonControls`, `OverlaySummary`
  - 타입 안정성 강화: 중앙 집중식 `types.ts`
- ✅ **마우스 휠 줌 기능 수정** - React 합성 이벤트로 전환하여 안정성 개선
- ✅ **비교 모드 구현** - 여러 리비전 병렬 표시, 개별 투명도/표시 제어
- ✅ **마크업 기능 구현** - 7가지 도구 (펜, 지우개, 선, 사각형, 원, 텍스트, 실행 취소)
- ✅ **검색/필터링 기능** - 공종명, 리비전 버전으로 실시간 필터링
- ✅ **문서화 완료**
  - `TROUBLESHOOTING.md` 신규 작성 (12개 섹션, 알려진 이슈 포함)
  - `README.md` 요구사항 형식으로 재구성
  - `DESIGN.md` 질문 템플릿으로 재작성

### 2026-02-18

- ✅ **UI 개선**
  - Breadcrumb 줄바꿈 처리 (flex-wrap 적용)
  - 검색 결과 카운터 조건부 표시
  - Region 오버레이 가시성 개선
- ✅ **도면 줌/팬 구현** - 마우스 드래그 이동, 더블클릭 fit-to-screen
- ✅ **리전(Region) 분기 탐색** - 공종 내 영역별 상세 탐색 지원

### 2026-02-17

- ✅ **리비전 선택 UI 구현** - 클릭 가능한 revision 항목, 선택 상태 하이라이트
- ✅ **아키텍처 문서화** - DESIGN.md 초안 작성 (설계 패턴, 성능 최적화 가이드)

### 2026-02-16

- ✅ **다중 오버레이 기능** - Ctrl+Click 다중 선택, 최대 5개 색상 구분
- ✅ **레이어 토글 기능** - 개별 리비전 켜기/끄기 제어
- ✅ **코드 최적화**
  - `useCallback`, `useMemo` 도입으로 불필요한 리렌더링 방지
  - 미사용 코드 제거 및 TSDoc 주석 정리

### 2026-02-15

- ✅ **기본 UI 레이아웃** - 3열 구조 (트리, 뷰어, 컨텍스트 패널)
- ✅ **도면 탐색 트리** - 계층 구조 렌더링 (공간 → 공종 → 리비전)
- ✅ **도면 뷰어 기본 기능** - 이미지 표시, SVG 오버레이
- ✅ **현재 컨텍스트 패널** - 선택된 항목의 메타데이터 표시

### 2026-02-14 (프로젝트 시작)

- ✅ **프로젝트 초기 설정**
  - Next.js 16.1.6, TypeScript, Tailwind CSS 4 구성
  - FSD 아키텍처 디렉토리 구조 설계
- ✅ **데이터 파싱 로직** - metadata.json 분석 및 타입 정의

## 라이선스

MIT
