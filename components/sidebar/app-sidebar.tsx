import * as React from "react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from "@/components/ui/sidebar";

const navMain = [
  { title: "Übersicht", url: "/", icon: "dashboard" },
  { title: "Inventar", url: "/inventory", icon: "inventory" },
  { title: "Importberichte", url: "/imports", icon: "imports" },
  { title: "Benutzer", url: "/users", icon: "users" },
];

type SidebarUser = {
  name: string;
  email: string;
  image?: string | null;
};

export function AppSidebar({ user, canManageUsers, ...props }: React.ComponentProps<typeof Sidebar> & { user: SidebarUser; canManageUsers: boolean }) {
  const items = canManageUsers ? [...navMain, { title: "Benutzer", url: "/users", icon: "users" }] : navMain;
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
