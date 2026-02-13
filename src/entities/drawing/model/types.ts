export type DrawingStatus = "draft" | "review" | "approved";

export type Drawing = {
  id: string;
  name: string;
  discipline: "Architecture" | "Structure" | "MEP" | "Civil";
  updatedAt: string;
  status: DrawingStatus;
};
