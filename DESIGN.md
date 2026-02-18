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
  { fill: "rgba(255, 0, 0, 0.1)", stroke: "#ff0000" }, // Red
  { fill: "rgba(0, 0, 255, 0.1)", stroke: "#0000ff" }, // Blue
  { fill: "rgba(0, 128, 0, 0.1)", stroke: "#008000" }, // Green
  { fill: "rgba(255, 128, 0, 0.1)", stroke: "#ff8000" }, // Orange
  { fill: "rgba(128, 0, 128, 0.1)", stroke: "#800080" }, // Purple
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

## 알려진 이슈 (Known Issues)

### 마크업 기능

#### 1. 축소/확대 시 마크업 위치 변화 🔴 **[미해결]**

**문제점**:

- 마크업 canvas 좌표 변환이 부정확함
- 줌 레벨이 변경될 때 마크업의 시각적 위치가 원본 좌표와 불일치

**원인 분석**:

- Canvas는 물리적 픽셀 좌표계를 사용
- DrawingViewer의 div는 CSS `transform: scale()`를 사용
- `getBoundingClientRect()`의 좌표와 캔버스의 논리 좌표 간 변환 실패
- Pan 오프셋을 중복 처리하는 문제

**코드 위치**:

- `src/widgets/drawing-viewer/drawing-viewer.tsx`
  - `handleMarkupMouseDown()` (Line ~410)
  - `handleMarkupMouseMove()` (Line ~435)
  - `handleMarkupMouseUp()` (Line ~478)

**해결 방안 (제안)**:

1. **Canvas 크기 통일**: 마크업 canvas를 항상 baseSize로 유지 (현재 baseSize \* zoomLevel)
2. **CSS Transform 활용**: HTML5 Canvas는 논리 좌표만 사용하고, CSS transform으로 확대/축소 표시
3. **좌표 계산 단순화**:

   ```typescript
   // 현재 (잘못됨):
   const x = (e.clientX - rect.left) / zoomLevel / zoomLevel - pan.x;

   // 제안 (개선):
   // Canvas가 baseSize 크기 + CSS transform scale(zoomLevel)인 경우
   const rect = canvas.getBoundingClientRect();
   const x = (e.clientX - rect.left) / zoomLevel - pan.x;
   ```

**참고 자료**:

- HTML5 Canvas vs CSS Transform: Canvas Rendering Context는 논리 좌표를 사용하며, 물리 픽셀로의 변환은 자동으로 처리됨
- 마크업 저장 기능도 제거됨 (저장 시 좌표 변환 문제로 인해)

---

#### 2. 마크업 모드 종료 시 마크업이 사라짐 🔴 **[미해결]**

**문제점**:

- 마크업 모드를 끌 때 Canvas가 DOM에서 제거되면서 그려진 내용이 사라짐
- 마크업이 영구 저장되지 않음 (임시 상태일 뿐)

**원인 분석**:

- 마크업 Canvas는 `isMarkupMode` 상태에 따라 조건부 렌더링됨
- 상태가 false가 되면 Canvas 엘리먼트 자체가 DOM에서 제거됨
- Canvas의 2D context 데이터가 메모리에서 정리됨

**코드 위치**:

- `src/widgets/drawing-viewer/drawing-viewer.tsx`
  - Canvas 렌더링 조건 (Line ~1175): `{isMarkupMode && (<canvas ...)`

**해결 방안 (제안)**:

1. **Canvas 항상 유지**: 마크업 Canvas를 항상 DOM에 유지하되, `display: none`으로 숨김
2. **전역 마크업 상태**:
   - IndexedDB 또는 Context API로 마크업 데이터 저장
   - 모드 해제 후에도 데이터 복구 가능
3. **Canvas 데이터 백업**:
   ```typescript
   const saveMarkupState = () => {
     const canvas = markupCanvasRef.current;
     if (canvas) {
       const imageData = canvas.toDataURL("image/png");
       sessionStorage.setItem("markupState", imageData);
     }
   };
   ```

**참고 자료**:

- Canvas 데이터 직렬화: `toDataURL()` 또는 `toBlob()`로 저장 가능
- 조건부 렌더링의 한계: DOM 제거 = 상태 손실

---

## Troubleshooting Guide

이 섹션은 개발 중 발생할 수 있는 일반적인 문제와 해결 방법을 정리한 문서입니다.

### 1. 개발 서버 시작 실패

#### 문제: Port 3000이 이미 사용 중

**증상**:

```
Error: bind EADDRINUSE: address already in use :::3000
```

**원인**: 이전 개발 서버 프로세스가 여전히 실행 중

**해결 방법**:

```bash
# Windows PowerShell
Get-Process node | Stop-Process -Force

# macOS/Linux
pkill -f "node"
```

또는 포트 변경:

```bash
npm run dev -- -p 3001
```

---

#### 문제: `.next` 폴더 락 파일

**증상**:

```
⨯ Unable to acquire lock at C:\...\Project_SiteDraw\.next\dev\lock
```

**원인**: 비정상 종료로 인한 락 파일 남음

**해결 방법**:

```bash
# .next 폴더 완전 삭제
rm -r .next

# 다시 시작
npm run dev
```

---

### 2. TypeScript 컴파일 에러

#### 문제: 'useState' is not defined

**증상**:

```
'useState' 이름을 찾을 수 없습니다.
```

**원인**: React 임포트 누락

**해결 방법**:

```typescript
// ❌ 잘못된 방법
const [count, setCount] = useState(0);

// ✅ 올바른 방법
import { useState } from "react";
const [count, setCount] = useState(0);
```

---

#### 문제: 타입 충돌 (로컬 선언과 import 충돌)

**증상**:

```
가져오기 선언이 'OverlayInfo'의 로컬 선언과 충돌합니다.
```

**원인**: 같은 이름의 타입이 중복 정의됨

**해결 방법**:

```typescript
// ❌ 충돌 발생
import type { OverlayInfo } from "./types";
type OverlayInfo = { ... };

// ✅ 별칭 사용
import type { OverlayInfo as OverlayType } from "./types";
```

---

### 3. ESLint 경고/에러

#### 문제: Unused Variables Warning

**증상**:

```
'canvas' is assigned a value but never used.
```

**원인**: 선언했지만 사용하지 않은 변수

**해결 방법**:

```typescript
// ❌ 경고 발생
const canvas = markupCanvasRef.current;
const ctx = markupCtxRef.current;
// canvas 미사용

// ✅ 사용하거나 제거
const ctx = markupCtxRef.current;
// canvas 삭제
```

또는 의도적으로 무시:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const canvas = markupCanvasRef.current;
```

---

#### 문제: React Hook Dependencies Warning

**증상**:

```
The dependency list of useCallback should be: [...]
React Hook useEffect has an unnecessary dependency: 'data.tree.nodes'
```

**원인**: `useMemo` 또는 `useCallback`의 의존성 배열이 불완전

**해결 방법**:

```typescript
// ❌ 잘못된 의존성
useCallback(() => {
  console.log(viewer.viewerState.zoomLevel);
}, []); // viewer.viewerState.zoomLevel 누락

// ✅ 올바른 의존성
useCallback(() => {
  console.log(viewer.viewerState.zoomLevel);
}, [viewer.viewerState.zoomLevel]);
```

---

### 4. 마크업 기능 문제

#### 문제: 마크업 위치가 맞지 않음

**증상**: 도면을 확대/축소한 후 마크업을 그리면 그린 위치와 다른 곳에 표시됨

**원인**: `getBoundingClientRect()`와 Canvas 좌표계의 불일치

- Canvas: 물리 픽셀 기반
- CSS Transform: 논리 좌표 기반
- 줌 레벨과 팬 값이 함께 작용하면서 복잡도 증가

**현재 상태**: ⚠️ **미해결** (Known Issues에 문서화)

**임시 해결책**: 마크업 기능 사용 전에 줌/팬 초기화 (1:1 버튼 클릭)

**근본 해결책**: Known Issues 섹션의 "제안된 해결책" 참고

---

#### 문제: 마크업이 저장되지 않음

**증상**: 마크업 모드를 해제하면 그린 내용이 모두 사라짐

**원인**: Canvas가 DOM에서 제거되면서 데이터 손실

**현재 상태**: ⚠️ **미해결** (Known Issues에 문서화)

**임시 해결책**: 마크업 데이터를 sessionStorage에 자동 저장하도록 개선 필요

**근본 해결책**: Known Issues 섹션의 "제안된 해결책" 참고

---

### 5. 성능 최적화 (Performance)

#### 문제: 도면이 너무 느리게 로드됨

**진단 방법**:

```typescript
// Chrome DevTools Performance 탭에서 flame chart 확인
console.time("draw");
// ... 렌더링 로직
console.timeEnd("draw");
```

**최적화 전략**:

1. **이미지 최적화**

   ```typescript
   // SVG 오버레이 최소화
   // 필요한 오버레이만 렌더링
   const visibleOverlays = overlays.filter((overlay) =>
     visibleIds.has(overlay.nodeId),
   );
   ```

2. **메모이제이션**

   ```typescript
   const memoizedValue = useMemo(() => {
     return 복잡한_계산();
   }, [의존성]);
   ```

3. **레이지 로딩**
   - 대용량 이미지는 필요할 때만 로드

---

### 6. 브라우저 호환성

#### 지원 브라우저:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

#### 문제: CSS Grid 지원 부족

호환성 확인:

- `caniuse.com`에서 CSS Grid 검색
- 대부분의 최신 브라우저에서 지원

---

### 7. 네트워크/API 관련

#### 문제: 도면 이미지 로드 실패

**증상**:

```
Failed to load image from /drawings/...
```

**원인 분석**:

1. 파일 경로 오류
2. public 폴더에 파일 없음
3. URL 인코딩 문제

**해결 방법**:

```typescript
// 올바른 경로 구성
const imagePath = `/drawings/${encodeURIComponent(drawing.image)}`;

// 파일 존재 여부 확인
// → public/drawings/ 폴더 확인
```

---

### 8. 상태 관리 문제

#### 문제: Ctrl+Click으로 다중 선택이 안 됨

**원인**: 이벤트 핸들러에서 `ctrlKey` 또는 `metaKey` 미처리

**확인 방법**:

```typescript
const handleSelect = (e: React.MouseEvent) => {
  console.log("ctrlKey:", e.ctrlKey, "metaKey:", e.metaKey);
  // 디버깅으로 이벤트 객체 확인
};
```

**해결 방법**:

```typescript
const handleSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
  onSelect(id, e.ctrlKey || e.metaKey); // macOS 지원
};
```

---

### 9. 빌드 문제

#### 문제: Production 빌드 실패

**증상**:

```
npm run build → Error
```

**원인**: TypeScript 타입 에러 또는 빌드 최적화 문제

**해결 방법**:

```bash
# 타입 체크 먼저 실행
npx tsc --noEmit

# 에러 메시지 확인 후 수정
npm run build
```

---

### 10. Next.js 특정 문제

#### 문제: Image 컴포넌트 src 에러

**증상**:

```
Image with src "..." is missing required "width" and "height" props
```

**원인**: Next.js Image 컴포넌트는 반드시 width/height 필수

**해결 방법**:

```typescript
// ❌ 에러
<Image src={url} alt="description" />

// ✅ 올바른 방법
<Image
  src={url}
  alt="description"
  width={1600}
  height={1000}
  unoptimized  // 동적 크기인 경우
/>
```

---

### 11. 디버깅 팁

#### React DevTools 설치

- Chrome/Firefox DevTools에서 컴포넌트 상태 확인
- Props와 Hooks 실시간 모니터링

#### 콘솔 로깅 (Console Logging)

```typescript
// useEffect에서 의존성 변경 감지
useEffect(() => {
  console.log("selectedIds 변경:", selectedIds);
}, [selectedIds]);
```

#### 로컬 스토리지 확인

```typescript
// 개발자 도구 Console에서 실행
localStorage.getItem("key");
sessionStorage.getItem("key");
```

#### 네트워크 탭 확인

- DevTools → Network 탭
- 이미지 로드 여부, 응답 시간 확인

---

**업데이트**: 2026-02-19 | **Version**: 1.0.2
