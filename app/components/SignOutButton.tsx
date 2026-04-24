"use client";

import { signOut } from "next-auth/react";

interface SignOutButtonProps {
  className?: string;
  variant?: "nav" | "page";
}

export default function SignOutButton({
  className,
  variant = "nav",
}: SignOutButtonProps) {
  const baseClasses =
    variant === "nav"
      ? "text-sm font-medium text-foreground/70 hover:text-foreground transition-colors min-h-[44px] flex items-center"
      : "inline-flex items-center justify-center rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors min-h-[44px]";

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className={className ?? baseClasses}
      aria-label="Sign out of your account"
    >
      Sign out
    </button>
  );
}
