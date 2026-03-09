export const dynamic = "force-dynamic";

import { getTimelineData } from "@/lib/queries/timeline";
import { TimelineClient } from "@/components/eis/timeline-client";

export default async function TimelinePage() {
  const airlines = await getTimelineData();

  return <TimelineClient airlines={JSON.parse(JSON.stringify(airlines))} />;
}
