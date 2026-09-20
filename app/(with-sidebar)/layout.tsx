import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { isAuthenticated } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/guard";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await isAuthenticated({ behavior: "redirect" });
  const canManageUsers = await hasPermission({ user: ["list"] });
  const canManageLoanSettings = await hasPermission({ loan_settings: ["manage"] });

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} canManageUsers={canManageUsers} canManageLoanSettings={canManageLoanSettings} />
      <main className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground antialiased">
        {children}
      </main>
    </SidebarProvider>
  );
}