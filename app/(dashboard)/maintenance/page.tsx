export const dynamic = "force-dynamic";

import { getCategoryData } from "@/lib/queries/category";
import { SERVICE_LINE_CATEGORIES } from "@/lib/utils";
import { CategoryPageClient } from "@/components/eis/category-page-client";

export default async function MaintenancePage() {
  const serviceLines = SERVICE_LINE_CATEGORIES["Maintenance"];
  const data = await getCategoryData(serviceLines);

  return (
    <CategoryPageClient
      title="Maintenance"
      description="IP Tooling, On-Wing Tech Support, Spare Engine and Engine Split"
      data={JSON.parse(JSON.stringify(data))}
      serviceLineNames={serviceLines}
    />
  );
}
