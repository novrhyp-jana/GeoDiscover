"use client";

import {
  use,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Award,
  BadgeCheck,
  MapPin,
  User,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";

type PublicProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  points: number;
};

type UserDiscovery = {
  id: string;
  title: string;
  description: string;
  category: string;
  location_name: string | null;
  image_url: string | null;
  confirmations_count: number;
  status: string;
  created_at: string;
};

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();

  const [profile, setProfile] =
    useState<PublicProfile | null>(null);

  const [discoveries, setDiscoveries] =
    useState<UserDiscovery[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const [
        profileResult,
        discoveryResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(`
            id,
            username,
            full_name,
            bio,
            avatar_url,
            location,
            points
          `)
          .eq("id", id)
          .single(),

        supabase
          .from("discoveries")
          .select(`
            id,
            title,
            description,
            category,
            location_name,
            image_url,
            confirmations_count,
            status,
            created_at
          `)
          .eq("user_id", id)
          .eq("is_hidden", false)
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (profileResult.error) {
        console.error(
          profileResult.error
        );

        setError(
          "This user profile could not be found."
        );

        setLoading(false);
        return;
      }

      setProfile(
        profileResult.data
      );

      setDiscoveries(
        discoveryResult.data ?? []
      );

      setLoading(false);
    }

    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="publicProfilePage">
          Loading profile...
        </main>
      </>
    );
  }

  if (!profile || error) {
    return (
      <>
        <Navbar />

        <main className="publicProfilePage">
          <div className="authError">
            {error}
          </div>
        </main>
      </>
    );
  }

  const name =
    profile.full_name ||
    profile.username ||
    "GeoDiscover User";

  const level =
    profile.points >= 500
      ? "Guardian"
      : profile.points >= 250
        ? "Explorer"
        : profile.points >= 100
          ? "Contributor"
          : "New Explorer";

  const verifiedPosts =
    discoveries.filter(
      (item) =>
        item.status ===
        "community_verified"
    ).length;

  const totalConfirmations =
    discoveries.reduce(
      (total, item) =>
        total +
        (item.confirmations_count ??
          0),
      0
    );

  return (
    <>
      <Navbar />

      <main className="publicProfilePage">
        <section className="publicProfileHero">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={name}
              className="publicProfileAvatar"
            />
          ) : (
            <div className="publicProfileAvatar">
              {name
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div className="publicProfileInfo">
            <div className="publicProfileName">
              <h1>{name}</h1>

              <BadgeCheck size={19} />
            </div>

            <span className="publicUsername">
              @
              {profile.username ||
                "user"}
            </span>

            <p>
              {profile.bio ||
                "Exploring and documenting the world around them."}
            </p>

            {profile.location && (
              <span className="publicLocation">
                <MapPin size={13} />
                {profile.location}
              </span>
            )}
          </div>

          <div className="publicReputation">
            <Award size={25} />

            <div>
              <span>REPUTATION</span>

              <strong>
                {profile.points}
              </strong>

              <small>{level}</small>
            </div>
          </div>
        </section>

        <section className="publicStats">
          <div>
            <strong>
              {discoveries.length}
            </strong>

            <span>Discoveries</span>
          </div>

          <div>
            <strong>
              {verifiedPosts}
            </strong>

            <span>Verified</span>
          </div>

          <div>
            <strong>
              {totalConfirmations}
            </strong>

            <span>Confirmations</span>
          </div>

          <div>
            <strong>
              {profile.points}
            </strong>

            <span>Points</span>
          </div>
        </section>

        <section className="achievementSection">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">
                COMMUNITY REPUTATION
              </p>

              <h2>Achievements</h2>
            </div>
          </div>

          <div className="achievementGrid">
            <div
              className={
                discoveries.length >= 1
                  ? "achievement unlocked"
                  : "achievement"
              }
            >
              <MapPin size={19} />

              <div>
                <strong>
                  First Discovery
                </strong>

                <span>
                  Published a first
                  discovery
                </span>
              </div>
            </div>

            <div
              className={
                discoveries.length >= 5
                  ? "achievement unlocked"
                  : "achievement"
              }
            >
              <User size={19} />

              <div>
                <strong>
                  Local Explorer
                </strong>

                <span>
                  Published 5
                  discoveries
                </span>
              </div>
            </div>

            <div
              className={
                profile.points >= 100
                  ? "achievement unlocked"
                  : "achievement"
              }
            >
              <Award size={19} />

              <div>
                <strong>
                  Contributor
                </strong>

                <span>
                  Earned 100 reputation
                  points
                </span>
              </div>
            </div>

            <div
              className={
                verifiedPosts >= 1
                  ? "achievement unlocked"
                  : "achievement"
              }
            >
              <BadgeCheck size={19} />

              <div>
                <strong>
                  Trusted Observer
                </strong>

                <span>
                  Received a community
                  verification
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="profileDiscoveriesSection">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">
                CONTRIBUTIONS
              </p>

              <h2>
                Discoveries by {name}
              </h2>
            </div>

            <span>
              {discoveries.length} posts
            </span>
          </div>

          {discoveries.length === 0 ? (
            <div className="profileEmpty">
              <MapPin size={25} />

              <strong>
                No discoveries yet
              </strong>

              <span>
                This user hasn't published
                anything yet.
              </span>
            </div>
          ) : (
            <div className="publicDiscoveryGrid">
              {discoveries.map(
                (discovery) => (
                  <button
                    key={discovery.id}
                    className="publicDiscoveryCard"
                    onClick={() =>
                      router.push(
                        `/discoveries/${discovery.id}`
                      )
                    }
                  >
                    {discovery.image_url ? (
                      <img
                        src={
                          discovery.image_url
                        }
                        alt={
                          discovery.title
                        }
                      />
                    ) : (
                      <div className="publicDiscoveryNoImage">
                        <MapPin
                          size={25}
                        />
                      </div>
                    )}

                    <div className="publicDiscoveryContent">
                      <span>
                        {
                          discovery.category
                        }
                      </span>

                      <h3>
                        {discovery.title}
                      </h3>

                      <p>
                        {
                          discovery.description
                        }
                      </p>

                      <small>
                        <MapPin
                          size={11}
                        />

                        {discovery.location_name ||
                          "Location"}
                      </small>

                      <small>
                        <BadgeCheck
                          size={11}
                        />

                        {discovery.confirmations_count ??
                          0}{" "}
                        confirmations
                      </small>
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}