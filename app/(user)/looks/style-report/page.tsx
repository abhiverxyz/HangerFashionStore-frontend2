"use client";

import Link from "next/link";
import useSWR from "swr";
import { listLooks } from "@/lib/api/looks";
import { StyleReportSection } from "@/components/looks/StyleReportSection";

export default function StyleReportPage() {
  const { data: looksData } = useSWR("looks-list", () => listLooks({ limit: 1, offset: 0 }));
  const lookCount = looksData?.total ?? 0;

  return (
    <div className="space-y-6">
      <Link href="/looks" className="text-sm font-medium text-primary hover:underline">
        ← Back to Looks
      </Link>
      <StyleReportSection lookCount={lookCount} />
    </div>
  );
}
