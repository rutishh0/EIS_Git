export const dynamic = "force-dynamic";

import { getCategoryData } from "@/lib/queries/category";
import { SERVICE_LINE_CATEGORIES } from "@/lib/utils";
import { CategoryPageClient } from "@/components/eis/category-page-client";

export default async function CustomerSupportPage() {
  const serviceLines = SERVICE_LINE_CATEGORIES["Customer Support"];
  const data = await getCategoryData(serviceLines);

  return (
    <CategoryPageClient
      title="Customer Support"
      description="Customer Training, Field Support, Airline Facility Readiness and Flight Ops"
      data={JSON.parse(JSON.stringify(data))}
      serviceLineNames={serviceLines}
    />
  );
}
