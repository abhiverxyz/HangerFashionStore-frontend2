"use client";

import useSWR from "swr";
import { listLooks } from "@/lib/api/looks";
import { StyleReportSection } from "@/components/looks/StyleReportSection";

export default function StyleReportPage() {
  const { data: looksData } = useSWR("looks-list", () => listLooks({ limit: 1, offset: 0 }));
  const lookCount = looksData?.total ?? 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg px-4 sm:px-6 py-6">
          <StyleReportSection lookCount={lookCount} />
        </div>
      </div>
    </div>
  );
}
