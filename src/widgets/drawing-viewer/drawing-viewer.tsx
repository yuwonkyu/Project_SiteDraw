"use client";

import Image from "next/image";
import { cn } from "@/shared/lib";
import { SectionTitle } from "@/shared/ui";
import type {
  ImageTransform,
  ParsedDrawingData,
} from "@/entities/drawing/model";

const buildTransformStyle = (transform?: ImageTransform) => {
  if (!transform) {
    return undefined;
  }
  const { x, y, scale, rotation } = transform;
  const translateX = Number.isFinite(x) ? x : 0;
  const translateY = Number.isFinite(y) ? y : 0;
  const nextScale = Number.isFinite(scale) ? scale : 1;
  const nextRotation = Number.isFinite(rotation) ? rotation : 0;

  return {
    transform: `translate(${translateX}px, ${translateY}px) scale(${nextScale}) rotate(${nextRotation}rad)`,
    transformOrigin: "0 0",
  } as const;
};

type DrawingViewerProps = {
  data: ParsedDrawingData;
  selectedId: string;
};

const DrawingViewer = ({ data, selectedId }: DrawingViewerProps) => {
  const selectedNode = data.tree.nodes[selectedId];
  const drawingNode =
    selectedNode?.kind === "drawing"
      ? selectedNode
      : selectedNode
      ? data.tree.nodes[`drawing:${selectedNode.drawingId}`]
      : undefined;

  const revisionEntry = data.revisions.find((entry) => entry.id === selectedId);

  let baseImage: string | undefined = undefined;
  let overlayImage: string | undefined = undefined;
  let overlayTransform: ImageTransform | undefined = undefined;

  if (revisionEntry) {
    baseImage = revisionEntry.parentImage ?? revisionEntry.image;
    overlayImage = revisionEntry.image;
    overlayTransform = revisionEntry.imageTransform;
  } else if (selectedNode?.kind === "discipline") {
    baseImage = selectedNode.imageTransform?.relativeTo ?? selectedNode.image;
    overlayImage = selectedNode.image ?? undefined;
    overlayTransform = selectedNode.imageTransform;
  } else if (selectedNode?.kind === "drawing") {
    baseImage = selectedNode.image;
  } else if (drawingNode && "image" in drawingNode) {
    baseImage = drawingNode.image;
  }

  const hasOverlay = baseImage && overlayImage && baseImage !== overlayImage;

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black">
      <div className="flex items-center justify-between">
        <SectionTitle>도면 뷰어</SectionTitle>
        <span className="rounded-full border border-black px-3 py-1 text-xs font-semibold">
          기본 렌더링
        </span>
      </div>
      <div className="mt-4 flex min-h-105 items-center justify-center rounded-md border border-black bg-gray-50">
        {!baseImage ? (
          <p className="text-sm text-black">선택된 도면이 없습니다.</p>
        ) : (
          <div className="relative max-h-130 w-full overflow-auto p-4">
            <div className="relative inline-block">
              <Image
                src={`/drawings/${baseImage}`}
                alt="기준 도면"
                className="block h-auto w-auto max-w-full border border-black"
                width={1600}
                height={1000}
                unoptimized
              />
              {hasOverlay && overlayImage ? (
                <Image
                  src={`/drawings/${overlayImage}`}
                  alt="오버레이 도면"
                  className={cn(
                    "absolute left-0 top-0 h-auto w-auto max-w-full border border-black/40"
                  )}
                  style={buildTransformStyle(overlayTransform)}
                  width={1600}
                  height={1000}
                  unoptimized
                />
              ) : null}
            </div>
          </div>
        )}
      </div>
      {hasOverlay ? (
        <p className="mt-3 text-xs text-black">
          기준 도면 위에 선택 도면을 변환값으로 정렬합니다.
        </p>
      ) : (
        <p className="mt-3 text-xs text-black">
          기준 도면만 표시합니다.
        </p>
      )}
    </section>
  );
};

export default DrawingViewer;
