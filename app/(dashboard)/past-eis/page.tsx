export const dynamic = "force-dynamic";

import { getPastEISPrograms } from "@/lib/queries/category";
import { PastEISClient } from "@/components/eis/past-eis-client";

export default async function PastEISPage() {
  const programs = await getPastEISPrograms();
  return <PastEISClient programs={JSON.parse(JSON.stringify(programs))} />;
}
