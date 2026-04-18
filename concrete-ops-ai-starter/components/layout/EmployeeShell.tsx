"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

type IconName = "home" | "clock" | "shield" | "hardhat" | "upload";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    title: "Work",
    items: [
      { href: "/employee", label: "Home", icon: "home" },
      { href: "/employee/time", label: "Time", icon: "clock" },
      { href: "/employee/uploads", label: "Uploads", icon: "upload" },
    ],
  },
  {
    title: "Compliance",
    items: [
      { href: "/employee/policies", label: "Policies", icon: "shield" },
      { href: "/employee/ppe", label: "PPE", icon: "hardhat" },
    ],
  },
];

const mobileNav = sections.flatMap((section) => section.items);

function isActive(pathname: string, href: string) {
  if (href === "/employee") return pathname === "/employee";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ icon, className = "h-4 w-4" }: { icon: IconName; className?: string }) {
  switch (icon) {
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
      );
    case "hardhat":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M2 16a10 10 0 0 1 20 0" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          <path d="M12 6v4" />
          <path d="M8 8.5 6.5 12" />
          <path d="M16 8.5 17.5 12" />
        </svg>
      );
    case "upload":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2" />
        </svg>
      );
    case "home":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10.5V20h14v-9.5" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
  }
}

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen bg-zinc-100">
        <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Concrete Ops</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900">Employee Portal</p>
            </div>
            <SignOutButton className="rounded-xl border px-4 py-3 text-sm font-medium disabled:opacity-50" />
          </div>
        </header>

        <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
          <div className="hidden lg:block">
            <Sidebar collapsible="none" className="w-[308px] border-r border-zinc-800 bg-zinc-950 text-zinc-100">
            <SidebarHeader className="border-b border-zinc-800 p-5">
              <Card className="border-zinc-800 bg-zinc-900 text-zinc-100 ring-zinc-800">
                <CardHeader>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400">Construction Operations</p>
                  <CardTitle className="text-xl text-white">Concrete Ops</CardTitle>
                  <Badge variant="secondary" className="mt-1 w-fit bg-zinc-800 text-zinc-100">Employee Portal</Badge>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-zinc-300">
                  Stay on top of time, uploads, and compliance tasks from one clean workspace.
                </CardContent>
              </Card>
            </SidebarHeader>

            <SidebarContent className="p-4">
              {sections.map((section) => (
                <SidebarGroup key={section.title}>
                  <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    {section.title}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => {
                        const active = isActive(pathname, item.href);
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              render={<Link href={item.href} />}
                              isActive={active}
                              className={active ? "bg-orange-500 text-white hover:bg-orange-500 hover:text-white" : "text-zinc-300 hover:bg-zinc-900 hover:text-white"}
                            >
                              <NavIcon icon={item.icon} className="h-4 w-4" />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>

            <SidebarFooter className="border-t border-zinc-800 p-4">
              <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-100 ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm">Shift-ready workspace</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-zinc-400">
                  Keep your day moving with quick access to time entry, uploads, and required safety items.
                </CardContent>
              </Card>
              <SignOutButton className="mt-3 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-50" />
            </SidebarFooter>
            </Sidebar>
          </div>

          <main className="flex-1 px-4 pb-28 pt-6 md:px-6 lg:bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.08),_transparent_20%),linear-gradient(180deg,#f4f4f5_0%,#fafafa_100%)] lg:p-8">
            {children}
          </main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-3 shadow-[0_-10px_24px_rgba(0,0,0,0.08)] lg:hidden">
          <div className="grid grid-cols-5 gap-2">
            {mobileNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl border px-3 py-3 text-center text-xs font-medium transition ${
                    active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-zinc-50 text-zinc-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </SidebarProvider>
  );
}
