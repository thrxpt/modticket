import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@modticket/ui/components/sidebar";
import { CircleGauge, Ticket } from "lucide-react";
import { NavMain } from "./nav-main";

const data = {
  navMain: [
    {
      icon: CircleGauge,
      title: "Dashboard",
      url: "/dashboard",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex w-full items-center gap-2 p-1.5">
              <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Ticket className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">
                  <span className="text-orange-500 dark:text-orange-400">
                    Mod
                  </span>
                  Ticket
                </span>
                <span className="font-medium text-muted-foreground text-xs">
                  Concert Ticket Booking System
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  );
}
