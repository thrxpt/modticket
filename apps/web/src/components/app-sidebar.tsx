import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@modticket/ui/components/sidebar";
import { CircleGauge, MapPin, Music, Ticket } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const data = {
  navMain: [
    {
      icon: CircleGauge,
      title: "Dashboard",
      url: "/dashboard",
    },
    {
      icon: Music,
      title: "Concerts",
      url: "/concerts",
    },
    {
      icon: MapPin,
      title: "Venues",
      url: "/venues",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: userData } = authClient.useSession();

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
      <SidebarFooter>
        {userData?.user && <NavUser user={userData.user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
