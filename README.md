# Project SiteDraw

건설 현장 도면을 구조적으로 탐색하고 리비전 이력을 빠르게 파악하는 웹 기반 UI 프로토타입입니다.

## 프로젝트 요약

- 현장 실무자의 탐색 흐름(공간 → 공종 → 리비전)에 맞춘 트리 구조
- 리비전 목록/변경 사항/경로 컨텍스트를 한 화면에서 파악
- JSON 메타데이터 기반 파싱 로직과 내부 모델 분리

## 진행 상황

- [x] 도면 메타데이터 타입 정의
- [x] JSON 파싱 로직 및 탐색 트리 모델
- [x] 탐색 구조 UI(트리 + 컨텍스트 패널)
- [x] 모노톤(흑백) UI 테마 정리
- [ ] 도면 이미지 뷰어 및 오버레이 렌더링
- [ ] 리비전 비교 뷰
- [ ] 필터(공종/리비전/영역) 기능

## 변경 사항

- 다크모드 제거, 흑백 모노톤 테마로 단순화
- 탐색 트리와 리비전 리스트 기반 UI 추가
- JSON 메타데이터 파싱 결과를 내부 모델로 변환

## 슈팅 에러(문제/해결)

- **중복 default export 에러**
	- 원인: 같은 컴포넌트에서 `export default`가 중복됨
	- 해결: 중복 export 제거
- **타입 오류: DisciplineName**
	- 원인: `Object.entries()`가 `string`으로 추론됨
	- 해결: `DisciplineName` 튜플로 캐스팅
- **텍스트 대비 문제**
	- 원인: 배경/텍스트 색상 매핑 불일치
	- 해결: 흑백 모노톤으로 전역 색상 정리

## 설계 방식

- **소스/모델 분리**: `metadata.json`은 원본 데이터로 유지하고, UI는 파싱된 내부 모델 사용
- **탐색 우선**: 실무자 흐름에 맞춰 탐색 트리와 컨텍스트를 상단 우선 배치
- **타입 안정성**: 공종/리비전/도면 ID를 유니온/패턴 타입으로 제한
- **단순성**: 흑백 테마로 시각적 노이즈 최소화

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Architecture**: FSD (Feature-Sliced Design)
- **Deployment**: Vercel

## 개발 시작하기

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

## 프로젝트 구조 (FSD)

```
src/
├── app/           # Next.js App Router
├── widgets/       # 복합 UI 블록 (Header, Sidebar 등)
├── features/      # 기능 단위 (차후 추가)
├── entities/      # 도메인 엔티티 (Drawing, Revision 등)
└── shared/        # 공통 UI, 유틸, Mock 데이터
```

## 배포

Vercel을 통해 자동 배포됩니다.

- Main 브랜치 push → 자동 배포
- PR 생성 → Preview 배포

## 라이선스

MIT
