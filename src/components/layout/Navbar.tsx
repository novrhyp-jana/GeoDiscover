"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Compass,
  Leaf,
  Map,
  MapPin,
  Plus,
  User,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type NavbarProfile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export default function Navbar() {
  const pathname = usePathname();

  const [profile, setProfile] =
    useState<NavbarProfile | null>(null);

  const [loggedIn, setLoggedIn] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoggedIn(false);
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoggedIn(true);

      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, username, avatar_url"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      }

      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      () => {
        loadUser();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Compass,
    },
    {
      name: "Explore",
      href: "/explore",
      icon: Map,
    },
    {
      name: "Discoveries",
      href: "/discoveries",
      icon: MapPin,
    },
    {
      name: "Alerts",
      href: "/alerts",
      icon: Bell,
    },
  ];

  const displayName =
    profile?.full_name ||
    profile?.username ||
    "User";

  const initial =
    displayName.charAt(0).toUpperCase();

  return (
    <header className="navbar">
      {/* LOGO */}

      <Link
        href="/"
        className="navBrand"
      >
        <div className="navLogo">
          <Leaf size={20} />
        </div>

        <div className="navBrandText">
          <strong>
            GeoDiscover
          </strong>

          <span>
            Explore your world
          </span>
        </div>
      </Link>

      {/* NAVIGATION */}

      <nav className="navLinks">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(item.href)
                  ? "navLink active"
                  : "navLink"
              }
            >
              <Icon size={16} />

              <span>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* RIGHT SIDE */}

      <div className="navActions">
        {loggedIn && (
          <Link
            href="/add-discovery"
            className="addDiscoveryButton"
          >
            <Plus size={17} />

            <span>
              Add Discovery
            </span>
          </Link>
        )}

        {!loading && !loggedIn && (
          <div className="navAuthActions">
            <Link
              href="/login"
              className="navLoginButton"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="navRegisterButton"
            >
              Register
            </Link>
          </div>
        )}

        {!loading && loggedIn && (
          <Link
            href="/profile"
            className={
              isActive("/profile")
                ? "navProfile activeProfile"
                : "navProfile"
            }
            title={displayName}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
              />
            ) : (
              <span>
                {initial || (
                  <User size={17} />
                )}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}