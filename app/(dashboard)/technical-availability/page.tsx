export const dynamic = "force-dynamic";

import { getCategoryData } from "@/lib/queries/category";
import { SERVICE_LINE_CATEGORIES } from "@/lib/utils";
import { CategoryPageClient } from "@/components/eis/category-page-client";

export default async function TechnicalAvailabilityPage() {
  const serviceLines = SERVICE_LINE_CATEGORIES["Technical Availability"];
  const data = await getCategoryData(serviceLines);

  return (
    <CategoryPageClient
      title="Technical Availability"
      description="EHM, DACs/Lifing Insight, LRU and LRP Management"
      data={JSON.parse(JSON.stringify(data))}
      serviceLineNames={serviceLines}
    />
  );
}
