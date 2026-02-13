import type {
  DisciplineName,
  DisciplineData,
  DisciplineWithRegions,
  DisciplineWithRevisions,
  Drawing,
  DrawingMetadata,
} from "./types";
import type {
  NavigationNode,
  NavigationTree,
  ParsedDrawingData,
  RevisionEntry,
} from "./parsed-types";

const isWithRegions = (
  discipline: DisciplineData
): discipline is DisciplineWithRegions =>
  !!discipline && "regions" in discipline && !!discipline.regions;

const isWithRevisions = (
  discipline: DisciplineData
): discipline is DisciplineWithRevisions =>
  !!discipline && "revisions" in discipline && !!discipline.revisions;

const buildDrawingPath = (
  drawings: Record<string, Drawing>,
  drawing: Drawing
): string[] => {
  if (!drawing.parent) {
    return [drawing.name];
  }
  const parent = drawings[drawing.parent];
  if (!parent) {
    return [drawing.name];
  }
  return [...buildDrawingPath(drawings, parent), drawing.name];
};

const addNode = (
  nodes: Record<string, NavigationNode>,
  node: NavigationNode
) => {
  nodes[node.id] = node;
  if (node.parentId) {
    const parent = nodes[node.parentId];
    if (parent) {
      parent.children.push(node.id);
    }
  }
};

export const parseDrawingMetadata = (
  metadata: DrawingMetadata
): ParsedDrawingData => {
  const nodes: Record<string, NavigationNode> = {};
  const revisions: RevisionEntry[] = [];

  const drawings = Object.values(metadata.drawings);
  const rootDrawing =
    drawings.find((drawing) => drawing.id === "00") ??
    drawings.find((drawing) => drawing.parent === null) ??
    drawings[0];

  drawings.forEach((drawing) => {
    const path = buildDrawingPath(metadata.drawings, drawing);
    const nodeId = `drawing:${drawing.id}`;

    addNode(nodes, {
      id: nodeId,
      kind: "drawing",
      name: drawing.name,
      parentId: drawing.parent ? `drawing:${drawing.parent}` : null,
      children: [],
      path,
      drawingId: drawing.id,
      image: drawing.image,
    });
  });

  drawings.forEach((drawing) => {
    const drawingNodeId = `drawing:${drawing.id}`;
    const drawingPath = nodes[drawingNodeId]?.path ?? [drawing.name];

    if (!drawing.disciplines) {
      return;
    }

    (Object.entries(drawing.disciplines) as [
      DisciplineName,
      DisciplineData | undefined,
    ][]).forEach(([disciplineName, data]) => {
      if (!data) {
        return;
      }

      const disciplineNodeId = `discipline:${drawing.id}:${disciplineName}`;
      addNode(nodes, {
        id: disciplineNodeId,
        kind: "discipline",
        name: disciplineName,
        parentId: drawingNodeId,
        children: [],
        path: [...drawingPath, disciplineName],
        drawingId: drawing.id,
        discipline: disciplineName,
        imageTransform: data.imageTransform,
        image: data.image,
        polygon: data.polygon,
      });

      if (isWithRegions(data)) {
        Object.entries(data.regions).forEach(([regionId, region]) => {
          const regionName = `Region ${regionId}`;
          const regionNodeId =
            `region:${drawing.id}:${disciplineName}:${regionId}`;

          addNode(nodes, {
            id: regionNodeId,
            kind: "region",
            name: regionName,
            parentId: disciplineNodeId,
            children: [],
            path: [...drawingPath, disciplineName, regionName],
            drawingId: drawing.id,
            discipline: disciplineName,
            regionId,
            polygon: region.polygon,
          });

          region.revisions.forEach((revision) => {
            const revisionNodeId =
              `revision:${drawing.id}:${disciplineName}:${regionId}:${revision.version}`;
            const revisionPath = [
              ...drawingPath,
              disciplineName,
              regionName,
              revision.version,
            ];
            const parentImage = data.image ?? drawing.image;

            addNode(nodes, {
              id: revisionNodeId,
              kind: "revision",
              name: revision.version,
              parentId: regionNodeId,
              children: [],
              path: revisionPath,
              drawingId: drawing.id,
              discipline: disciplineName,
              regionId,
              version: revision.version,
              revision,
              image: revision.image,
              imageTransform: revision.imageTransform,
              polygon: revision.polygon,
            });

            revisions.push({
              id: revisionNodeId,
              drawingId: drawing.id,
              drawingName: drawing.name,
              discipline: disciplineName,
              regionId,
              version: revision.version,
              revision,
              image: revision.image,
              parentImage,
              imageTransform: revision.imageTransform,
              polygon: revision.polygon,
              path: revisionPath,
            });
          });
        });
        return;
      }

      if (isWithRevisions(data)) {
        data.revisions.forEach((revision) => {
          const revisionNodeId =
            `revision:${drawing.id}:${disciplineName}:${revision.version}`;
          const revisionPath = [
            ...drawingPath,
            disciplineName,
            revision.version,
          ];
          const parentImage = data.image ?? drawing.image;

          addNode(nodes, {
            id: revisionNodeId,
            kind: "revision",
            name: revision.version,
            parentId: disciplineNodeId,
            children: [],
            path: revisionPath,
            drawingId: drawing.id,
            discipline: disciplineName,
            version: revision.version,
            revision,
            image: revision.image,
            imageTransform: revision.imageTransform,
            polygon: revision.polygon,
          });

          revisions.push({
            id: revisionNodeId,
            drawingId: drawing.id,
            drawingName: drawing.name,
            discipline: disciplineName,
            version: revision.version,
            revision,
            image: revision.image,
            parentImage,
            imageTransform: revision.imageTransform,
            polygon: revision.polygon,
            path: revisionPath,
          });
        });
      }
    });
  });

  const rootId = rootDrawing ? `drawing:${rootDrawing.id}` : "";

  const tree: NavigationTree = {
    rootId,
    nodes,
  };

  return { tree, revisions };
};
