export const dynamic = "force-dynamic";

import { getCategoryData } from "@/lib/queries/category";
import { SERVICE_LINE_CATEGORIES } from "@/lib/utils";
import { CategoryPageClient } from "@/components/eis/category-page-client";

export default async function RegionalSummaryPage() {
  const allServiceLines = Object.values(SERVICE_LINE_CATEGORIES).flat();
  const data = await getCategoryData(allServiceLines);

  return (
    <CategoryPageClient
      title="Regional Summary"
      description="Overview of all service line statuses across all programs"
      data={JSON.parse(JSON.stringify(data))}
      serviceLineNames={allServiceLines}
    />
  );
}
