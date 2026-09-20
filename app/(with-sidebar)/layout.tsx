import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { isAuthenticated } from "@/lib/auth/guard";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await isAuthenticated({ behavior: "redirect" });

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <main className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground antialiased">
        {children}
      </main>
    </SidebarProvider>
  );
}