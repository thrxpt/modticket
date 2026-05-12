import {
  SidebarInset,
  SidebarProvider,
} from "@modticket/ui/components/sidebar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_admin")({
  component: AdminLayoutComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data || session.data.user.role !== "admin") {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session: session.data };
  },
});

function AdminLayoutComponent() {
  return (
    <SidebarProvider
      style={
        {
          "--header-height": "calc(var(--spacing) * 12)",
          "--sidebar-width": "calc(var(--spacing) * 72)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="ModTicket" />
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <div className="@container/main flex min-w-0 flex-1 flex-col gap-2">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
