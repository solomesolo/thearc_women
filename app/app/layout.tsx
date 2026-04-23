import { AppNav } from "@/components/app/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <AppNav />
      <main>{children}</main>
    </div>
  );
}
