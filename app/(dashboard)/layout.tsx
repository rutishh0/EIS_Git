import { MainNav } from "@/components/eis/main-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background grid-overlay relative overflow-hidden">
      <MainNav />
      <main className="pt-16 pb-12 px-6">{children}</main>
    </div>
  );
}
