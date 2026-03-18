export const dynamic = "force-dynamic";

import { getCategoryData } from "@/lib/queries/category";
import { SERVICE_LINE_CATEGORIES } from "@/lib/utils";
import { CategoryPageClient } from "@/components/eis/category-page-client";

export default async function ContractsPage() {
  const serviceLines = SERVICE_LINE_CATEGORIES["Contracts"];
  const data = await getCategoryData(serviceLines);

  return (
    <CategoryPageClient
      title="Contracts"
      description="Product Agreement and TotalCare Agreement status"
      data={JSON.parse(JSON.stringify(data))}
      serviceLineNames={serviceLines}
    />
  );
}
