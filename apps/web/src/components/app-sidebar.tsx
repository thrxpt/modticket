import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@modticket/ui/components/sidebar";
import { CircleGauge, MapPin, Music, ReceiptText, Ticket } from "lucide-react";
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
    {
      icon: Ticket,
      title: "Bookings & Tickets",
      url: "/bookings",
    },
  ],
  finance: [
    {
      icon: ReceiptText,
      title: "Sales Report",
      url: "/finance/sales-report",
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
            <div className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border/80 bg-sidebar-accent/50 p-2">
              <div className="flex aspect-square size-10 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Ticket className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">ModTicket</span>
                <span className="font-medium text-muted-foreground text-xs">
                  Concert operations
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavMain items={data.finance} title="Finance" />
      </SidebarContent>
      <SidebarFooter>
        {userData?.user && <NavUser user={userData.user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
