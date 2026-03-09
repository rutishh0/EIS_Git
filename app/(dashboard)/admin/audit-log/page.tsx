export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAuditLogs } from "@/lib/queries/audit";
import { AdminAuditClient } from "@/components/eis/admin-audit-client";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AuditLogPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || "1", 10);
  const result = await getAuditLogs({ page });

  return (
    <AdminAuditClient
      logs={JSON.parse(JSON.stringify(result.logs))}
      page={result.page}
      totalPages={result.totalPages}
      total={result.total}
    />
  );
}
