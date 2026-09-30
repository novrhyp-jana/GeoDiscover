"use client";

import { useEffect, useState } from "react";
import { Bell, Check, MapPin } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export default function AlertsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setNotifications((data ?? []) as Notification[]);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <>
      <Navbar />

      <main className="standardPage">
        <div className="pageTitle">
          <p className="eyebrow">STAY UPDATED</p>
          <h1>Alerts</h1>
          <p>
            Updates from discoveries and people you follow.
          </p>
        </div>

        <div style={{ maxWidth: 800 }}>
          {loading ? (
            <p>Loading alerts...</p>
          ) : notifications.length === 0 ? (
            <div className="homeFeedEmpty">
              <Bell size={28} />
              <strong>No alerts yet</strong>
              <span>
                Follow community members to receive updates when
                they publish discoveries.
              </span>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "white",
                  border: "1px solid #e0e8e2",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 10,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <Bell size={18} color="#159447" />

                <div style={{ flex: 1 }}>
                  <strong
                    style={{
                      display: "block",
                      fontSize: 11,
                      color: "#263a2d",
                    }}
                  >
                    {item.message}
                  </strong>

                  <span
                    style={{
                      fontSize: 8,
                      color: "#87928a",
                    }}
                  >
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                {item.is_read && <Check size={15} />}
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}