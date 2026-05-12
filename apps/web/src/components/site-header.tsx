import { Separator } from "@modticket/ui/components/separator";
import { SidebarTrigger } from "@modticket/ui/components/sidebar";

interface SiteHeaderProps {
  title: string;
}

export function SiteHeader({ title }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/95 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          className="mx-2 data-[orientation=vertical]:h-4"
          orientation="vertical"
        />
        <div className="flex items-center gap-3">
          <h1 className="font-medium text-base">{title}</h1>
          <span className="hidden rounded-md border border-border/70 px-2 py-1 text-muted-foreground text-xs md:inline-flex">
            Admin console
          </span>
        </div>
      </div>
    </header>
  );
}
