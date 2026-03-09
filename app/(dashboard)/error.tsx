"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex flex-col items-center gap-4 py-16">
        <AlertCircle size={48} className="text-rag-red" />
        <p className="text-lg font-medium text-text-primary">
          Something went wrong
        </p>
        <p className="max-w-md text-center text-sm text-text-secondary">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <Button
          onClick={reset}
          className="bg-rr-navy hover:bg-rr-navy-light"
        >
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}
