import * as React from "react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from "@/components/ui/sidebar";

const userNav = [
  { title: "Übersicht", url: "/", icon: "dashboard" },
  { title: "Inventar", url: "/inventory", icon: "inventory" },
  { title: "Reservierungen", url: "/reservations", icon: "reservations" },
];

type SidebarUser = {
  name: string;
  email: string;
  image?: string | null;
};

export function AppSidebar({ user, canManageUsers, canManageLoanSettings, canManageInventory, canViewReports, ...props }: React.ComponentProps<typeof Sidebar> & { user: SidebarUser; canManageUsers: boolean; canManageLoanSettings: boolean; canManageInventory: boolean; canViewReports: boolean }) {
  const items = [
    ...(canManageInventory ? [{ title: "Geräteverwaltung", url: "/device-management", icon: "manage" as const }] : []),
    ...(canViewReports ? [{ title: "Auswertungen", url: "/reports", icon: "reports" as const }] : []),
    ...(canManageLoanSettings ? [{ title: "Leihfristen", url: "/loan-settings", icon: "settings" as const }] : []),
    ...(canManageUsers ? [{ title: "Benutzer", url: "/users", icon: "users" as const }] : []),
  ];
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain label="Mein Bereich" items={userNav} />
        {items.length > 0 && <NavMain label="Administration" items={items} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
