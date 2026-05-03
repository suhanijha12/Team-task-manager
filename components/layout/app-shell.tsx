"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type AppShellProps = {
  user: {
    name: string;
    email: string;
    imageUrl?: string | null;
  };
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const initials = getInitials(user.name || user.email);
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col border-r bg-background p-3 transition-[width] duration-200",
          collapsed ? "w-[76px]" : "w-[260px]"
        )}
      >
        <div
          className={cn(
            "flex h-12 items-center gap-2",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link
            aria-label="ProjektPilot dashboard"
            className={cn(
              "min-w-0 text-base font-semibold",
              collapsed && "sr-only"
            )}
            href="/dashboard"
          >
            ProjektPilot
          </Link>
          <Button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
            size="icon"
            type="button"
            variant="ghost"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="mt-6 flex flex-col gap-0.5">
          {[
            { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 shrink-0" />, exact: true },
            { href: "/projects", label: "Projects", icon: <FolderKanban className="h-4 w-4 shrink-0" />, exact: false },
            { href: "/tasks", label: "Tasks", icon: <ListChecks className="h-4 w-4 shrink-0" />, exact: true },
            { href: "/admin", label: "Admin", icon: <ShieldCheck className="h-4 w-4 shrink-0" />, exact: true },
          ].map(({ href, label, icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Button
                key={href}
                asChild
                variant="ghost"
                className={cn(
                  "justify-start gap-3 font-normal",
                  active && "bg-accent text-accent-foreground font-medium",
                  collapsed && "size-9 justify-center gap-0 px-0 mx-auto"
                )}
              >
                <Link aria-label={label} href={href}>
                  {icon}
                  <span className={cn(collapsed && "sr-only")}>{label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto border-t pt-3">
          <div
            className={cn(
              "flex min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5",
              collapsed && "justify-center px-0"
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              {user.imageUrl ? (
                <AvatarImage alt={user.name} src={user.imageUrl} />
              ) : null}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className={cn("min-w-0 flex-1", collapsed && "sr-only")}>
              <div className="truncate text-sm font-medium leading-tight">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground leading-tight">
                {user.email}
              </div>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex min-w-0 items-center gap-2 text-sm">
              {breadcrumbs.map((breadcrumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li className="flex min-w-0 items-center gap-2" key={breadcrumb.href ?? breadcrumb.label}>
                    {index > 0 ? (
                      <span className="text-muted-foreground">/</span>
                    ) : null}
                    {breadcrumb.href && !isLast ? (
                      <Link
                        className="truncate text-muted-foreground transition-colors hover:text-foreground"
                        href={breadcrumb.href}
                      >
                        {breadcrumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? "page" : undefined}
                        className={cn(
                          "truncate",
                          isLast ? "font-medium" : "text-muted-foreground"
                        )}
                      >
                        {breadcrumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle compact />
            <LogoutButton compact />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function getBreadcrumbs(pathname: string) {
  if (pathname === "/dashboard") {
    return [{ label: "Dashboard" }];
  }

  if (pathname === "/projects") {
    return [{ label: "Projects" }];
  }

  if (pathname === "/projects/new") {
    return [
      { label: "Projects", href: "/projects" },
      { label: "New project" }
    ];
  }

  if (pathname.startsWith("/projects/")) {
    const parts = pathname.split("/").filter(Boolean);
    const projectId = parts[1];
    const breadcrumbs = [
      { label: "Projects", href: "/projects" },
      { label: "Project dashboard", href: `/projects/${projectId}` }
    ];

    if (parts[2] === "settings") {
      return [...breadcrumbs, { label: "Settings" }];
    }

    return breadcrumbs.map((breadcrumb, index) =>
      index === breadcrumbs.length - 1
        ? { label: breadcrumb.label }
        : breadcrumb
    );
  }

  if (pathname === "/tasks") {
    return [{ label: "Tasks" }];
  }

  if (pathname === "/admin") {
    return [{ label: "Admin" }];
  }

  return [{ label: "Workspace" }];
}

function getInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
