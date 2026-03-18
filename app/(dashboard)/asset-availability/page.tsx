export const dynamic = "force-dynamic";

import { getCategoryData } from "@/lib/queries/category";
import { SERVICE_LINE_CATEGORIES } from "@/lib/utils";
import { CategoryPageClient } from "@/components/eis/category-page-client";

export default async function AssetAvailabilityPage() {
  const serviceLines = SERVICE_LINE_CATEGORIES["Asset Availability"];
  const data = await getCategoryData(serviceLines);

  return (
    <CategoryPageClient
      title="Asset Availability"
      description="IP Spares, PAS, NDSES and Transportation"
      data={JSON.parse(JSON.stringify(data))}
      serviceLineNames={serviceLines}
    />
  );
}
