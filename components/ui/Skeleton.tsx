import React from "react";
import { cn } from "@/lib/utils";
import { skeletonShimmerClass } from "@/lib/motion";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md", skeletonShimmerClass, className)}
      {...props}
    />
  );
}

export { Skeleton };
