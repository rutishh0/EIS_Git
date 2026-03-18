"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Globe,
  LayoutDashboard,
  Plane,
  Plus,
  Download,
  ScrollText,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface AirlineItem {
  id: string;
  name: string;
}

const pages = [
  { name: "Command Centre", href: "/", icon: LayoutDashboard },
  { name: "Regional Summary", href: "/regional", icon: Globe },
  { name: "Contracts", href: "/contracts", icon: ScrollText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

const quickActions = [
  { name: "Create Airline", href: "/airlines/new", icon: Plus },
  { name: "Export Report", href: "/export", icon: Download },
];

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [airlines, setAirlines] = useState<AirlineItem[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/airlines")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: AirlineItem[]) => {
        if (!cancelled) setAirlines(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Menu"
      description="Search airlines, pages, and actions"
    >
      <CommandInput placeholder="Search airlines, pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              onSelect={() => navigate(page.href)}
            >
              <page.icon className="mr-2 size-4" />
              {page.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.href}
              onSelect={() => navigate(action.href)}
            >
              <action.icon className="mr-2 size-4" />
              {action.name}
            </CommandItem>
          ))}
        </CommandGroup>

        {airlines.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Airlines">
              {airlines.map((airline) => (
                <CommandItem
                  key={airline.id}
                  onSelect={() => navigate(`/airlines/${airline.id}`)}
                >
                  <Plane className="mr-2 size-4" />
                  {airline.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
