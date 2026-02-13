// [x, y] 픽셀 좌표 쌍
export type Vector2 = [number, number];

// 프로젝트 기본 정보
export interface ProjectInfo {
  name: string;
  unit: string;
}

// 공종(Discipline) 라벨
export type DisciplineName =
  | "건축"
  | "구조"
  | "공조설비"
  | "배관설비"
  | "설비"
  | "소방"
  | "조경";

// 도면 식별자(숫자 문자열)
export type DrawingId = `${number}`;

// 리비전 버전 표기
export type RevisionVersion = `REV${number}${string}`;

// 리전(Region) 식별자
export type RegionId = string;

// 날짜 문자열(YYYY-MM-DD)
export type DateString = `${number}-${number}-${number}`;

// 도면 이미지 파일명
export type ImageFileName =
  | `${string}.png`
  | `${string}.jpeg`
  | `${string}.jpg`
  | `${string}.svg`;

// 공종(Discipline) 라벨
export interface DisciplineInfo {
  name: DisciplineName;
}

// 이미지/폴리곤 공통 변환 파라미터
export interface BaseTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

// 도면 이미지 정렬용 변환(기준 이미지 포함)
export interface ImageTransform extends BaseTransform {
  relativeTo?: ImageFileName;
}

// 폴리곤 렌더링용 변환(유연하게 사용)
export type PolygonTransform = Partial<BaseTransform>;

// 도면/리비전 관심 영역 폴리곤
export interface Polygon {
  vertices?: Vector2[];
  polygonTransform?: PolygonTransform;
}

// 상위 도면 위에서의 위치 정보
export interface Position {
  vertices?: Vector2[];
  imageTransform: BaseTransform;
}

// 리비전 정보
export interface Revision {
  version: RevisionVersion;
  image: ImageFileName;
  date: DateString;
  description: string;
  changes: string[];
  imageTransform?: ImageTransform;
  polygon?: Polygon;
}

// 공종 내 하위 영역(Region)
export interface Region {
  polygon: Polygon;
  revisions: Revision[];
}

// 도면 내 공종 데이터(케이스별로 옵션 존재)
export interface DisciplineBase {
  imageTransform?: ImageTransform;
  image?: ImageFileName;
  polygon?: Polygon;
}

export type DisciplineWithRegions = DisciplineBase & {
  regions: Record<RegionId, Region>;
  revisions?: never;
};

export type DisciplineWithRevisions = DisciplineBase & {
  revisions: Revision[];
  regions?: never;
};

export type DisciplineWithoutHistory = DisciplineBase & {
  regions?: never;
  revisions?: never;
};

export type DisciplineData =
  | DisciplineWithRegions
  | DisciplineWithRevisions
  | DisciplineWithoutHistory;

// 도면 트리의 단일 노드
export interface Drawing {
  id: DrawingId;
  name: string;
  image: ImageFileName;
  parent: DrawingId | null;
  position: Position | null;
  disciplines?: Partial<Record<DisciplineName, DisciplineData>>;
}

// 전체 메타데이터 스키마
export interface DrawingMetadata {
  project: ProjectInfo;
  disciplines: DisciplineInfo[];
  drawings: Record<DrawingId, Drawing>;
}
