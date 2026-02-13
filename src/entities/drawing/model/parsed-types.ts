import type {
  DisciplineName,
  DrawingId,
  ImageFileName,
  ImageTransform,
  Polygon,
  RegionId,
  Revision,
  RevisionVersion,
} from "./types";

// 탐색 노드 종류
export type NavigationNodeKind = "drawing" | "discipline" | "region" | "revision";

// 탐색 트리 공통 노드
export interface NavigationNodeBase {
  id: string;
  kind: NavigationNodeKind;
  name: string;
  parentId: string | null;
  children: string[];
  path: string[];
}

// 도면(공간) 노드
export interface DrawingNode extends NavigationNodeBase {
  kind: "drawing";
  drawingId: DrawingId;
  image: ImageFileName;
}

// 공종 노드
export interface DisciplineNode extends NavigationNodeBase {
  kind: "discipline";
  drawingId: DrawingId;
  discipline: DisciplineName;
  imageTransform?: ImageTransform;
  image?: ImageFileName;
  polygon?: Polygon;
}

// 영역(Region) 노드
export interface RegionNode extends NavigationNodeBase {
  kind: "region";
  drawingId: DrawingId;
  discipline: DisciplineName;
  regionId: RegionId;
  polygon?: Polygon;
}

// 리비전 노드
export interface RevisionNode extends NavigationNodeBase {
  kind: "revision";
  drawingId: DrawingId;
  discipline: DisciplineName;
  regionId?: RegionId;
  version: RevisionVersion;
  revision: Revision;
  image: ImageFileName;
  imageTransform?: ImageTransform;
  polygon?: Polygon;
}

export type NavigationNode =
  | DrawingNode
  | DisciplineNode
  | RegionNode
  | RevisionNode;

// 탐색 트리
export interface NavigationTree {
  rootId: string;
  nodes: Record<string, NavigationNode>;
}

// 리비전 비교/목록에 쓰는 단일 엔트리
export interface RevisionEntry {
  id: string;
  drawingId: DrawingId;
  drawingName: string;
  discipline: DisciplineName;
  regionId?: RegionId;
  version: RevisionVersion;
  revision: Revision;
  image: ImageFileName;
  parentImage?: ImageFileName;
  imageTransform?: ImageTransform;
  polygon?: Polygon;
  path: string[];
}

// 파싱 결과
export interface ParsedDrawingData {
  tree: NavigationTree;
  revisions: RevisionEntry[];
}
