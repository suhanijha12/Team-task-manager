"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type LogoutButtonProps = {
  collapsed?: boolean;
  compact?: boolean;
};

export function LogoutButton({
  collapsed = false,
  compact = false
}: LogoutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) {
      return;
    }

    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      setPending(false);
    }
  }

  return (
    <Button
      aria-label={collapsed || compact ? "Logout" : undefined}
      className={
        collapsed || compact ? "h-10 w-10 px-0" : "w-full justify-start"
      }
      disabled={pending}
      variant="outline"
      size={collapsed || compact ? "icon" : "sm"}
      type="button"
      onClick={logout}
    >
      {pending ? <Spinner /> : <LogOut className="h-4 w-4" />}
      <span className={collapsed || compact ? "sr-only" : undefined}>
        {pending ? "Logging out" : "Logout"}
      </span>
    </Button>
  );
}
