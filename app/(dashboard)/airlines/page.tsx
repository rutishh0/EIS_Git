export const dynamic = "force-dynamic";

import { getAllAirlines } from "@/lib/queries/scorecard";
import { AirlinesClient } from "@/components/eis/airlines-client";

export default async function AirlinesPage() {
  const airlines = await getAllAirlines();

  return <AirlinesClient airlines={JSON.parse(JSON.stringify(airlines))} />;
}
