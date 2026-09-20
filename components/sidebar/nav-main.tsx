"use client"

import Link from "next/link"
import { BarChart3, CalendarCheck, CalendarClock, ClipboardList, LayoutDashboard, PackageSearch, PencilRuler, ShieldCheck, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  inventory: PackageSearch,
  reservations: CalendarCheck,
  imports: ClipboardList,
  users: ShieldCheck,
  settings: CalendarClock,
  manage: PencilRuler,
  reports: BarChart3,
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: keyof typeof icons
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Geräteverleih</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(`${item.url}/`));

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActive}
                render={<Link href={item.url} />}
              >
                {item.icon && (() => {
                  const Icon = icons[item.icon]
                  return <Icon />
                })()}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
