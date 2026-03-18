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

  const serialized = {
    id: scorecard.id,
    airlineId: scorecard.airlineId,
    airlineName: scorecard.airlineName,
    region: scorecard.region,
    engineType: scorecard.engineType,
    eisDate: scorecard.eisDate ? new Date(scorecard.eisDate).toISOString() : null,
    eisDateTbc: scorecard.eisDateTbc,
    eisRisk: scorecard.eisRisk,
    eisLeadName: scorecard.eisLeadName,
    orderDetails: scorecard.orderDetails,
    status: scorecard.status,
    lastUpdatedAt: new Date(scorecard.lastUpdatedAt).toISOString(),
    serviceLineStatuses: scorecard.serviceLineStatuses.map((sls) => ({
      id: sls.id,
      serviceLineName: sls.serviceLineName,
      serviceLineCategory: sls.serviceLineCategory,
      ragStatus: sls.ragStatus,
      statusText: sls.statusText,
      comments: sls.comments,
      isDisputed: sls.isDisputed,
      disputeNote: sls.disputeNote,
    })),
  };

  return (
    <ScorecardDetailClient
      scorecard={serialized}
      canEdit={canEdit}
    />
  );
}
