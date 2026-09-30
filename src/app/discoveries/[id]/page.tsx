"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  ShieldCheck,
  User,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";

type Discovery = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  location_name: string | null;
  image_url: string | null;
  priority: string;
  accessibility: string | null;
  confirmations_count: number;
  trust_score: number;
  status: string;
  created_at: string;

  profiles: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    points: number;
  } | null;
};

export default function DiscoveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();

  const [discovery, setDiscovery] =
    useState<Discovery | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDiscovery() {
      const supabase = createClient();

      const {
        data,
        error: fetchError,
      } = await supabase
        .from("discoveries")
        .select(`
          id,
          user_id,
          title,
          description,
          category,
          latitude,
          longitude,
          location_name,
          image_url,
          priority,
          accessibility,
          confirmations_count,
          trust_score,
          status,
          created_at,

          profiles!discoveries_user_id_fkey (
            username,
            full_name,
            avatar_url,
            bio,
            points
          )
        `)
        .eq("id", id)
        .eq("is_hidden", false)
        .single();

      if (fetchError) {
        console.error(fetchError);

        setError(
          "This discovery could not be loaded."
        );

        setLoading(false);
        return;
      }

      setDiscovery(
        data as unknown as Discovery
      );

      setLoading(false);
    }

    loadDiscovery();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="detailPage">
          <div className="detailLoading">
            Loading discovery...
          </div>
        </main>
      </>
    );
  }

  if (error || !discovery) {
    return (
      <>
        <Navbar />

        <main className="detailPage">
          <div className="authError">
            {error}
          </div>
        </main>
      </>
    );
  }

  const authorName =
    discovery.profiles?.full_name ||
    discovery.profiles?.username ||
    "GeoDiscover User";

  const date = new Date(
    discovery.created_at
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <Navbar />

      <main className="detailPage">
        <button
          className="detailBack"
          onClick={() => router.back()}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="detailLayout">
          <section className="detailMain">
            {discovery.image_url ? (
              <img
                className="detailHeroImage"
                src={discovery.image_url}
                alt={discovery.title}
              />
            ) : (
              <div className="detailNoImage">
                <MapPin size={40} />
              </div>
            )}

            <div className="detailContent">
              <div className="detailBadges">
                <span className="detailCategory">
                  {discovery.category}
                </span>

                {discovery.priority ===
                  "Urgent" && (
                  <span className="detailUrgent">
                    Urgent
                  </span>
                )}

                {discovery.status ===
                  "community_verified" && (
                  <span className="detailVerified">
                    <ShieldCheck
                      size={12}
                    />
                    Verified
                  </span>
                )}
              </div>

              <h1>{discovery.title}</h1>

              <div className="detailMeta">
                <span>
                  <MapPin size={14} />

                  {discovery.location_name ||
                    "Location"}
                </span>

                <span>
                  <Clock size={14} />

                  {date}
                </span>
              </div>

              <p className="detailDescription">
                {discovery.description}
              </p>

              {discovery.category ===
                "Green Space" && (
                <div className="greenInfoCard">
                  <div>
                    <Navigation size={18} />

                    <section>
                      <small>
                        PUBLIC ACCESSIBILITY
                      </small>

                      <strong>
                        {discovery.accessibility ||
                          "Unknown"}
                      </strong>
                    </section>
                  </div>
                </div>
              )}

              <div className="trustSection">
                <div>
                  <CheckCircle2 size={20} />

                  <section>
                    <strong>
                      {discovery.confirmations_count ??
                        0}
                    </strong>

                    <span>
                      Community confirmations
                    </span>
                  </section>
                </div>

                <div>
                  <ShieldCheck size={20} />

                  <section>
                    <strong>
                      {Math.round(
                        discovery.trust_score ??
                          0
                      )}
                    </strong>

                    <span>Trust score</span>
                  </section>
                </div>
              </div>
            </div>
          </section>

          <aside className="detailSidebar">
            <p className="detailSideLabel">
              POSTED BY
            </p>

            <button
              className="detailAuthor"
              onClick={() =>
                router.push(
                  `/profile/${discovery.user_id}`
                )
              }
            >
              {discovery.profiles
                ?.avatar_url ? (
                <img
                  src={
                    discovery.profiles
                      .avatar_url
                  }
                  alt={authorName}
                />
              ) : (
                <div className="detailAuthorAvatar">
                  <User size={22} />
                </div>
              )}

              <section>
                <strong>
                  {authorName}
                </strong>

                <span>
                  @
                  {discovery.profiles
                    ?.username ||
                    "user"}
                </span>
              </section>
            </button>

            <p className="authorBio">
              {discovery.profiles?.bio ||
                "Exploring and documenting the world around them."}
            </p>

            <div className="authorReputation">
              <Award size={18} />

              <div>
                <strong>
                  {discovery.profiles
                    ?.points ?? 0}
                </strong>

                <span>
                  reputation points
                </span>
              </div>
            </div>

            <button
              className="viewProfileButton"
              onClick={() =>
                router.push(
                  `/profile/${discovery.user_id}`
                )
              }
            >
              View profile
            </button>
          </aside>
        </div>
      </main>
    </>
  );
}