"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthGate({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const publicPages = [
        "/login",
        "/register",
        "/auth/callback",
      ];

      const isPublicPage = publicPages.some(
        (page) => pathname.startsWith(page)
      );

      if (!session && !isPublicPage) {
        router.replace("/register");
        return;
      }

      // Already logged in?
      // Don't show register/login again.
      if (
        session &&
        (pathname === "/register" ||
          pathname === "/login")
      ) {
        router.replace("/");
        return;
      }

      setChecking(false);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (
          !session &&
          pathname !== "/login" &&
          pathname !== "/register"
        ) {
          router.replace("/register");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="authChecking">
        <div className="authCheckingLogo">
          G
        </div>

        <strong>GeoDiscover</strong>
        <span>Loading your world...</span>
      </div>
    );
  }

  return <>{children}</>;
}