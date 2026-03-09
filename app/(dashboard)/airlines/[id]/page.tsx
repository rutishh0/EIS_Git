export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getScorecardByAirlineId } from "@/lib/queries/scorecard";
import { ScorecardDetailClient } from "@/components/eis/scorecard-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AirlineScorecardPage({ params }: Props) {
  const { id } = await params;
  const [scorecard, session] = await Promise.all([
    getScorecardByAirlineId(id),
    getServerSession(authOptions),
  ]);

  if (!scorecard) {
    notFound();
  }

  const canEdit =
    session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";

  return (
    <ScorecardDetailClient
      scorecard={JSON.parse(JSON.stringify(scorecard))}
      canEdit={canEdit}
    />
  );
}
