"use client";

import { Header, MainArea } from "@/widgets/layout";
import { mockMetadata } from "@/shared/mock";
import { DrawingWorkspace } from "@/widgets/drawing-workspace";

const HomePage = () => {
  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <div className="grid grid-cols-1 gap-6 px-4 pb-8 pt-5 md:gap-8 md:px-8 lg:px-10">
        <MainArea>
          <DrawingWorkspace metadata={mockMetadata} />
        </MainArea>
      </div>
    </div>
  );
};

export default HomePage;
