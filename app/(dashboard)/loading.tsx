import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* KPI skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
              <div className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-6 w-12 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted/50" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
