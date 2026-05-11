import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@modticket/ui/components/sidebar";
import { Link, useMatchRoute } from "@tanstack/react-router";
import type { LucideProps } from "lucide-react";

interface NavMainItem {
  icon?: React.ComponentType<LucideProps>;
  title: string;
  url: string;
}

export function NavMain({
  items,
  title,
}: {
  items: NavMainItem[];
  title?: string;
}) {
  const matchRoute = useMatchRoute();

  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = !!matchRoute({ to: item.url, fuzzy: true });

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={isActive}
                  render={<Link to={item.url} />}
                  tooltip={item.title}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
