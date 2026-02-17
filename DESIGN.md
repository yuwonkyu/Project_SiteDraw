# Architecture & Design Documentation

## 프로젝트 개요

Site Draw는 다중 리비전의 건축도면을 시각화하고 탐색할 수 있는 웹 기반 도면 뷰어입니다. FSD(Feature-Sliced Design) 패턴으로 구조화되어 있으며, Next.js와 React의 최신 기술을 활용합니다.

## 핵심 아키텍처

### 레이어 구조 (FSD Pattern)

```
src/
├── entities/       # 비즈니스 로직에 필요한 데이터 모델
├── shared/         # 공유 라이브러리, UI 컴포넌트
├── widgets/        # 기능 단위의 복합 컴포넌트
└── app/            # Next.js 애플리케이션 루트
```

#### 1. Entities (entities/drawing/)
- **역할**: 도면 데이터의 타입 정의, 파싱 로직
- **구성 요소**:
  - `types.ts`: 기본 타입 정의 (Node, Drawing, Discipline 등)
  - `parsed-types.ts`: 파싱된 데이터 타입
  - `parse.ts`: 원본 데이터에서 파싱된 구조로 변환
  - `index.ts`: 공개 API

#### 2. Shared (shared/)
- **lib/**: 유틸리티 함수 (`cn` - classname 병합)
- **ui/**: 재사용 가능한 UI 컴포넌트
  - `breadcrumb.tsx`: 경로 네비게이션
  - `section-title.tsx`: 섹션 제목 컴포넌트
- **mock/**: 개발용 더미 데이터

#### 3. Widgets (widgets/)
- **drawing-workspace/**: 상태 관리 및 레이아웃 조율
- **drawing-tree/**: 계층 구조 탐색 (노드 트리 뷰)
- **drawing-context/**: 선택된 항목의 상세 정보 및 리비전 목록
- **drawing-viewer/**: 도면 렌더링 (SVG 오버레이)
- **layout/**: 페이지 레이아웃 (header, main section)

## 핵심 기능 설계

### 1. 다중 선택 (Multi-Select)

**구현 방식**:
- Ctrl+Click: 다중 선택 모드
- 일반 Click: 단일 선택 모드
- 상태: `selectedIds` (Set<string>)

**컴포넌트 간 흐름**:
```
DrawingTree (사용자 입력 감지)
    ↓ onClick 핸들러 (ctrlKey 전달)
DrawingWorkspace (상태 관리)
    ↓ props 전달 (selectedIds)
DrawingContext, DrawingViewer (렌더링)
```

### 2. 레이어 토글 (Layer Visibility)

**구현 방식**:
- 각 Discipline별 visibility 제어
- 상태: `visibleIds` (Set<string>)
- UI: 각 리비전 항목 옆 체크박스

**상태 관리**:
```typescript
const [visibleIds, setVisibleIds] = useState<Set<string>>(...);

const handleToggleVisibility = useCallback((revisionId: string) => {
  setVisibleIds(prev => {
    const next = new Set(prev);
    if (next.has(revisionId)) {
      next.delete(revisionId);
    } else {
      next.add(revisionId);
    }
    return next;
  });
}, []);
```

### 3. 다중 오버레이 렌더링

**구현 방식**:
- 선택된 노드의 모든 리비전을 SVG polygon으로 렌더링
- 각 리비전에 다른 색상 할당 (총 5가지 색상 팔레트)
- 색상 인덱스: `colorIndex = revisionIndex % 5`

**색상 팔레트** (LAYER_COLORS):
```typescript
const LAYER_COLORS = [
  { fill: "rgba(255, 0, 0, 0.1)", stroke: "#ff0000" },    // Red
  { fill: "rgba(0, 0, 255, 0.1)", stroke: "#0000ff" },    // Blue
  { fill: "rgba(0, 128, 0, 0.1)", stroke: "#008000" },    // Green
  { fill: "rgba(255, 128, 0, 0.1)", stroke: "#ff8000" },  // Orange
  { fill: "rgba(128, 0, 128, 0.1)", stroke: "#800080" },  // Purple
] as const;
```

**렌더링 알고리즘**:
1. selectedIds의 각 노드 조회
2. 각 노드의 관련 리비전 추출
3. 리비전별 오버레이 정보 생성
4. visibleIds와 비교하여 표시할 오버레이 필터링
5. SVG polygon으로 렌더링

### 4. 리비전 선택 (Revision Selection)

**구현 방식**:
- 선택된 노드의 리비전 목록 표시
- 사용자가 특정 리비전 클릭 가능
- 상태: `selectedRevisionId` (string)

**상태 흐름**:
```
DrawingWorkspace
├── selectedIds (Set<string>) - 선택된 노드들
├── visibleIds (Set<string>) - 표시할 리비전들
└── selectedRevisionId (string) - 강조할 리비전

DrawingContext (리비전 목록 표시 + 선택)
    ↓ onClick
DrawingWorkspace (selectedRevisionId 업데이트)
```

**UI 상태**: 선택된 리비전은 회색 배경으로 하이라이트

## 성능 최적화

### 1. useMemo 활용

```typescript
const { selectedNodes, primaryNode, baseImage } = useMemo(() => {
  // 중복 계산 방지
  // selectedIds 또는 data 변경 시에만 재계산
}, [selectedIds, data]);
```

**최적화 영역**:
- `DrawingWorkspace`: 노드 및 리비전 필터링
- `DrawingViewer`: 오버레이 정보 계산
- `DrawingContext`: 관련 리비전 추출

### 2. useCallback 활용

```typescript
const handleSelect = useCallback((id: string, ctrlKey: boolean) => {
  // 함수 재생성 방지
  // 자식 컴포넌트의 props 변화 최소화
}, []);
```

**최적화되는 핸들러**:
- `handleSelect` (DrawingTree 클릭)
- `handleToggleVisibility` (체크박스 토글)
- `handleRevisionSelect` (리비전 선택)

## 타입 시스템

### 주요 타입 정의

#### ParsedDrawingData
```typescript
type ParsedDrawingData = {
  tree: {
    nodes: Record<string, ParsedNode>;
    rootIds: string[];
  };
  drawings: Map<string, Drawing>;
};
```

#### ParsedNode
```typescript
type ParsedNode = {
  id: string;
  label: string;
  drawings: {
    id: string;
    version: string;
    revision: Revision;
    discipline: string;
    regionId?: string;
  }[];
  children?: string[];
};
```

### Props 타입 시스템

**DrawingWorkspace Props**:
- 내부 상태 관리, 자식 컴포넌트에 콜백 전달

**DrawingViewer Props**:
```typescript
type DrawingViewerProps = {
  data: ParsedDrawingData;
  selectedIds: Set<string>;
  visibleIds: Set<string>;
  selectedRevisionId?: string;
  onSelect: (id: string, ctrlKey: boolean) => void;
};
```

**DrawingContext Props**:
```typescript
type CurrentContextProps = {
  data: ParsedDrawingData;
  selectedIds: Set<string>;
  visibleIds: Set<string>;
  selectedRevisionId: string;
  onToggleVisibility: (revisionId: string) => void;
  onRevisionSelect: (revisionId: string) => void;
};
```

## 데이터 흐름

### 사용자 인터랙션 → 렌더링 흐름

```
DrawingTree (사용자 클릭)
    ↓ onClick
DrawingWorkspace.handleSelect()
    ↓ setState(selectedIds, visibleIds, selectedRevisionId)
Props 변경
    ↓
DrawingViewer / DrawingContext 리렌더링
    ↓ useMemo 재계산
오버레이 정보 업데이트
    ↓
SVG / React 렌더링
```

### 상태 관리 계층

1. **최상위 (DrawingWorkspace)**:
   - `selectedIds`: 선택된 노드
   - `visibleIds`: 표시할 리비전
   - `selectedRevisionId`: 강조할 리비전

2. **중간 (DrawingContext, DrawingViewer)**:
   - Props로 상태 수신
   - 로컬 상태 최소화 (예: baseSize)

3. **하위 (DrawingTree, 자식 UI)**:
   - 순수 렌더링 컴포넌트
   - 이벤트 핸들러를 통해 상위에 보고

## 스타일링 전략

### Tailwind CSS 구성

- **태마**: Monocolor (검은색/흰색 기반)
- **방식**: Canonical utility classes (전체 경로 명시)
- **동적 클래스**: 조건부 className으로 상태 반영

### 예시: 리비전 선택 상태 스타일링

```typescript
className={`cursor-pointer rounded-md border px-3 py-2 text-xs transition-colors ${
  selectedRevisionId === entry.id
    ? "border-black bg-gray-700 text-white"
    : "border-black bg-white text-black"
}`}
```

## 배포 및 최적화

### Next.js 설정

- **렌더링**: Static Site Generation (SSG)
- **이미지**: Next.js Image 컴포넌트 (자동 최적화)
- **TypeScript**: Strict mode 활성화

### 빌드 최적화

- **Turbopack**: 빠른 로컬 개발 빌드
- **Code Splitting**: 자동 청크 분할
- **CSS**: Tailwind CSS purging

## 개발 가이드라인

### 새 기능 추가 시

1. **타입 먼저**: entities/drawing/ 에서 타입 정의
2. **상태 관리**: DrawingWorkspace 에서 상태 추가
3. **렌더링**: 해당 widget에서 컴포넌트 구현
4. **props 전달**: 필요한 callback 추가

### 성능 고려사항

- **Set vs Array**: 다중 선택은 Set 사용 (O(1) 조회)
- **useMemo**: 복잡한 계산은 메모이제이션
- **useCallback**: 자식 컴포넌트 최적화를 위해 사용

### 테스트 포인트

- Ctrl+Click 다중 선택 동작
- 레이어 토글 ON/OFF
- 오버레이 색상 올바른 적용
- 리비전 선택 시 하이라이트

## 향후 확장 가능성

1. **검색 기능**: 노드, 리비전, 학부별 필터링
2. **비교 모드**: 두 리비전 병렬 표시
3. **마크업 도구**: SVG 그리기, 주석 추가
4. **내보내기**: PDF, 이미지 다운로드
5. **협업 기능**: 실시간 공동 편집

---

**업데이트**: 2026-02-17 | **Version**: 1.0
