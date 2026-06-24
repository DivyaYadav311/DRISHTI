import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Network, Smartphone, Activity } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const nav = [
  { title: "Executive Control Room", url: "/dashboard", icon: LayoutDashboard, hint: "Main Ops" },
  { title: "Signal & Agent Canvas", url: "/agents", icon: Network, hint: "Deep-Dive Logic" },
  { title: "Sandbox Simulator", url: "/simulator", icon: Smartphone, hint: "Live Demo" },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => pathname === url || (url === "/dashboard" && pathname === "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-cyan text-primary-foreground font-black text-lg shadow-[var(--shadow-glow)]">
            D
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">DRISHTI</div>
            <div className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              SBI · World-Aware Agent
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em]">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{item.title}</div>
                        <div className="truncate text-[10px] text-muted-foreground">{item.hint}</div>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <Activity className="h-3.5 w-3.5 text-emerald" />
          <span>LangGraph v0.2 · Claude 3.5 Sonnet</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
