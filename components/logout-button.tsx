"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    const result = await logout();

    if (result.success) {
      router.push("/login");
    } else {
      console.error("Logout failed:", result.error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
      size="sm"
    >
      <LogOut size={16} />
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  );
}
