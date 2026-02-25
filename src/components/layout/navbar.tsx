"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, Play, Trophy, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { TerrapinLogo } from "@/components/shared/terrapin-logo";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/game", label: "Play", icon: Play },
  { href: "#leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "#settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <TerrapinLogo size="sm" animated={false} />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 transition-all duration-200",
                    isActive && "bg-secondary"
                  )}
                >
                  <Icon size={16} />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu size={22} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-xl border-border">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex flex-col gap-2 pt-8">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3 text-base"
                    >
                      <Icon size={20} />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.nav>
  );
}
