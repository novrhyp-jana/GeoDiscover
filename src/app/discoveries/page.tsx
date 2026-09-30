"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";

type Discovery = {
  id: string;
  title: string;
  description: string;
  category: string;
  location_name: string | null;
  image_url: string | null;
  confirmations_count: number;
};

export default function DiscoveriesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data } = await supabase
        .from("discoveries")
        .select(`
          id,
          title,
          description,
          category,
          location_name,
          image_url,
          confirmations_count
        `)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });

      setItems((data ?? []) as Discovery[]);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <>
      <Navbar />

      <main className="standardPage">
        <div className="pageTitle">
          <p className="eyebrow">COMMUNITY DISCOVERIES</p>
          <h1>Discoveries</h1>
          <p>
            Explore observations and reports shared by the
            GeoDiscover community.
          </p>
        </div>

        {loading ? (
          <p>Loading discoveries...</p>
        ) : (
          <div className="myDiscoveryGrid">
            {items.map((item) => (
              <button
                key={item.id}
                className="myDiscoveryCard"
                onClick={() =>
                  router.push(`/discoveries/${item.id}`)
                }
              >
                <div className="myDiscoveryImage">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} />
                  ) : (
                    <div className="myDiscoveryNoImage">
                      <MapPin size={28} />
                    </div>
                  )}

                  <span>{item.category}</span>
                </div>

                <div className="myDiscoveryContent">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>

                  <div>
                    <span>
                      <MapPin size={12} />
                      {item.location_name || "Location"}
                    </span>

                    <span>
                      <CheckCircle2 size={12} />
                      {item.confirmations_count ?? 0} confirmations
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </>
  );
}