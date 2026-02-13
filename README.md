# Project SiteDraw

건설 프로젝트 도면 탐색 및 비교 시스템

## 프로젝트 개요

건설 현장 실무자들이 태블릿과 데스크톱에서 도면을 구조적으로 탐색하고 비교하는 웹 기반 시스템입니다.

### 핵심 기능
- 계층 구조 기반 도면 탐색 (프로젝트 > 건물 > 층 > 영역)
- 공종별 도면 관리 (건축/구조/설비 등)
- Revision 버전 관리 및 비교
- 다중 오버레이 뷰

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Architecture**: FSD (Feature-Sliced Design)
- **Deployment**: Vercel

## UI 테마 가이드

### 디자인 컨셉
Industrial / Construction / Professional - 콘크리트, 하드우드, 아이언 질감에서 영감을 받은 현장 도구 느낌의 전문 UI

### 컬러 팔레트

#### Main Colors - Concrete & Iron
```
concrete: 콘크리트 그레이 (50~950)
- 기본 배경, 텍스트, 경계선
- Light: #f8f9fa ~ Dark: #151619

iron: 아이언 블루 (50~950)  
- 서브 컬러, 버튼, 액센트
- Light: #f4f6f8 ~ Dark: #1e2632

steel: 스틸 네이비 (50~950)
- 보조 액센트, 하이라이트
- Light: #f3f6f9 ~ Dark: #282c3d
```

#### Accent Colors - Safety & Warning
```
safety: 안전모 옐로우 (50~950)
- 포인트 컬러, 하이라이트
- Primary: #f59e0b

alert: 경고 오렌지 (50~950)
- 경고, 알림, 긴급 표시
- Primary: #f97316
```

### 영역별 컬러 가이드

#### Header
- Background: `bg-surface` (white/dark)
- Border: `border-concrete-300`
- Logo: `bg-iron-800`
- Badge: `bg-concrete-200` / `bg-safety-500`

#### Sidebar
- Background: `bg-surface`
- Border: `ring-concrete-300`
- Menu Item: `text-concrete-700` → `hover:bg-concrete-100`
- Title: `text-concrete-500`

#### Main Content
- Background: `bg-background` (#f8f9fa / #151619)
- Card: `bg-surface` + `ring-concrete-300`
- List Item: `bg-concrete-50` + `border-concrete-300`

#### Buttons
- Primary: `bg-iron-800 hover:bg-iron-900`
- Secondary: `bg-concrete-200 hover:bg-concrete-300`
- Accent: `bg-safety-500 hover:bg-safety-600`

#### Status & Tags
- Neutral: `bg-concrete-200 text-concrete-700`
- Warning: `bg-safety-500 text-concrete-900`
- Alert: `bg-alert-500 text-white`

### 다크모드 지원

라이트/다크 모드 모두 지원하며, CSS 변수를 통해 전환됩니다.

- 다크모드 활성화: `class="dark"` 추가
- 컬러 자동 전환: `text-concrete-900 dark:text-concrete-100`

### UX 원칙

1. **높은 가독성**: 야외 환경에서도 잘 보이는 대비
2. **태블릿 최적화**: 장갑 낀 손으로도 누르기 쉬운 버튼 크기
3. **정보 밀도**: 기능 중심, 불필요한 장식 최소화
4. **전문성**: 장난스럽지 않은 B2B SaaS 느낌

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
