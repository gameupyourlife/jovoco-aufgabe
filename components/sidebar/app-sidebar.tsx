import * as React from "react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from "@/components/ui/sidebar";

const navMain = [
  { title: "Übersicht", url: "/", icon: "dashboard" },
  { title: "Inventar", url: "/inventory", icon: "inventory" },
  { title: "Importberichte", url: "/imports", icon: "imports" },
];

type SidebarUser = {
  name: string;
  email: string;
  image?: string | null;
};

export function AppSidebar({ user, canManageUsers, canManageLoanSettings, ...props }: React.ComponentProps<typeof Sidebar> & { user: SidebarUser; canManageUsers: boolean; canManageLoanSettings: boolean }) {
  const items = [
    ...navMain,
    ...(canManageLoanSettings ? [{ title: "Leihfristen", url: "/loan-settings", icon: "settings" as const }] : []),
    ...(canManageUsers ? [{ title: "Benutzer", url: "/users", icon: "users" as const }] : []),
  ];
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
