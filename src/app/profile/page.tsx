"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Bookmark,
  CheckCircle2,
  Heart,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  User,
  UserPlus,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TYPES
   ========================================================= */

type Author = {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  points: number;
};

type FeedDiscovery = {
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
  confirmations_count: number;
  trust_score: number;
  status: string;
  created_at: string;

  profiles: Author | null;

  likes: {
    user_id: string;
  }[];

  saves: {
    user_id: string;
  }[];

  comments: {
    id: string;
  }[];
};

type SuggestedProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  points: number;
};

/* =========================================================
   HOME
   ========================================================= */

export default function HomePage() {
  const router = useRouter();

  const [userId, setUserId] =
    useState<string | null>(null);

  const [discoveries, setDiscoveries] =
    useState<FeedDiscovery[]>([]);

  const [suggestions, setSuggestions] =
    useState<SuggestedProfile[]>([]);

  const [following, setFollowing] =
    useState<Set<string>>(new Set());

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const [busyLikes, setBusyLikes] =
    useState<Set<string>>(new Set());

  const [busySaves, setBusySaves] =
    useState<Set<string>>(new Set());

  const [busyFollows, setBusyFollows] =
    useState<Set<string>>(new Set());

  const categories = [
    "All",
    "Green Space",
    "Plants",
    "Wildlife",
    "Animals",
    "Environment",
    "Community",
  ];

  /* =========================================================
     LOAD EVERYTHING
     ========================================================= */

  const loadHome = useCallback(
    async () => {
      setLoading(true);
      setError("");

      const supabase =
        createClient();

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.replace("/register");
        return;
      }

      setUserId(user.id);

      /*
       * IMPORTANT:
       * explicit FK is used because we previously
       * had multiple profiles/discoveries relationships.
       */

      const discoveryResult =
        await supabase
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
            ),

            likes (
              user_id
            ),

            saves (
              user_id
            ),

            comments (
              id
            )
          `)
          .eq("is_hidden", false)
          .order("created_at", {
            ascending: false,
          });

      if (discoveryResult.error) {
        console.error(
          "Home feed:",
          discoveryResult.error
        );

        setError(
          discoveryResult.error.message
        );
      } else {
        setDiscoveries(
          (discoveryResult.data ??
            []) as unknown as FeedDiscovery[]
        );
      }

      /*
       * SUGGESTED USERS
       */

      const profilesResult =
        await supabase
          .from("profiles")
          .select(`
            id,
            username,
            full_name,
            avatar_url,
            bio,
            points
          `)
          .neq("id", user.id)
          .limit(5);

      if (!profilesResult.error) {
        setSuggestions(
          profilesResult.data ?? []
        );
      }

      /*
       * WHO CURRENT USER FOLLOWS
       */

      const followsResult =
        await supabase
          .from("follows")
          .select("following_id")
          .eq(
            "follower_id",
            user.id
          );

      if (!followsResult.error) {
        setFollowing(
          new Set(
            (
              followsResult.data ??
              []
            ).map(
              (item) =>
                item.following_id
            )
          )
        );
      }

      setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  /* =========================================================
     FILTER FEED
     ========================================================= */

  const filteredDiscoveries =
    useMemo(() => {
      return discoveries.filter(
        (discovery) => {
          const categoryMatch =
            category === "All" ||
            discovery.category ===
              category;

          const author =
            discovery.profiles
              ?.full_name ||
            discovery.profiles
              ?.username ||
            "";

          const searchable = `
            ${discovery.title}
            ${discovery.description}
            ${discovery.category}
            ${discovery.location_name ?? ""}
            ${author}
          `.toLowerCase();

          const searchMatch =
            searchable.includes(
              search
                .trim()
                .toLowerCase()
            );

          return (
            categoryMatch &&
            searchMatch
          );
        }
      );
    }, [
      discoveries,
      category,
      search,
    ]);

  /* =========================================================
     LIKE
     ========================================================= */

  async function toggleLike(
    discovery: FeedDiscovery
  ) {
    if (
      !userId ||
      busyLikes.has(discovery.id)
    ) {
      return;
    }

    const supabase =
      createClient();

    const liked =
      discovery.likes.some(
        (like) =>
          like.user_id === userId
      );

    setBusyLikes((old) => {
      const next = new Set(old);
      next.add(discovery.id);
      return next;
    });

    if (liked) {
      const { error } =
        await supabase
          .from("likes")
          .delete()
          .eq(
            "discovery_id",
            discovery.id
          )
          .eq(
            "user_id",
            userId
          );

      if (!error) {
        setDiscoveries(
          (old) =>
            old.map((item) =>
              item.id ===
              discovery.id
                ? {
                    ...item,
                    likes:
                      item.likes.filter(
                        (like) =>
                          like.user_id !==
                          userId
                      ),
                  }
                : item
            )
        );
      }
    } else {
      const { error } =
        await supabase
          .from("likes")
          .insert({
            user_id: userId,
            discovery_id:
              discovery.id,
          });

      if (!error) {
        setDiscoveries(
          (old) =>
            old.map((item) =>
              item.id ===
              discovery.id
                ? {
                    ...item,
                    likes: [
                      ...item.likes,
                      {
                        user_id:
                          userId,
                      },
                    ],
                  }
                : item
            )
        );
      }
    }

    setBusyLikes((old) => {
      const next = new Set(old);
      next.delete(discovery.id);
      return next;
    });
  }

  /* =========================================================
     SAVE
     ========================================================= */

  async function toggleSave(
    discovery: FeedDiscovery
  ) {
    if (
      !userId ||
      busySaves.has(discovery.id)
    ) {
      return;
    }

    const supabase =
      createClient();

    const saved =
      discovery.saves.some(
        (save) =>
          save.user_id === userId
      );

    setBusySaves((old) => {
      const next = new Set(old);
      next.add(discovery.id);
      return next;
    });

    if (saved) {
      const { error } =
        await supabase
          .from("saves")
          .delete()
          .eq(
            "discovery_id",
            discovery.id
          )
          .eq(
            "user_id",
            userId
          );

      if (!error) {
        setDiscoveries(
          (old) =>
            old.map((item) =>
              item.id ===
              discovery.id
                ? {
                    ...item,
                    saves:
                      item.saves.filter(
                        (save) =>
                          save.user_id !==
                          userId
                      ),
                  }
                : item
            )
        );
      }
    } else {
      const { error } =
        await supabase
          .from("saves")
          .insert({
            user_id: userId,
            discovery_id:
              discovery.id,
          });

      if (!error) {
        setDiscoveries(
          (old) =>
            old.map((item) =>
              item.id ===
              discovery.id
                ? {
                    ...item,
                    saves: [
                      ...item.saves,
                      {
                        user_id:
                          userId,
                      },
                    ],
                  }
                : item
            )
        );
      }
    }

    setBusySaves((old) => {
      const next = new Set(old);
      next.delete(discovery.id);
      return next;
    });
  }

  /* =========================================================
     FOLLOW
     ========================================================= */

  async function toggleFollow(
    profileId: string
  ) {
    if (
      !userId ||
      busyFollows.has(profileId)
    ) {
      return;
    }

    const supabase =
      createClient();

    const alreadyFollowing =
      following.has(profileId);

    setBusyFollows((old) => {
      const next = new Set(old);
      next.add(profileId);
      return next;
    });

    if (alreadyFollowing) {
      const { error } =
        await supabase
          .from("follows")
          .delete()
          .eq(
            "follower_id",
            userId
          )
          .eq(
            "following_id",
            profileId
          );

      if (!error) {
        setFollowing((old) => {
          const next =
            new Set(old);

          next.delete(profileId);

          return next;
        });
      }
    } else {
      const { error } =
        await supabase
          .from("follows")
          .insert({
            follower_id: userId,
            following_id:
              profileId,
          });

      if (!error) {
        setFollowing((old) => {
          const next =
            new Set(old);

          next.add(profileId);

          return next;
        });
      }
    }

    setBusyFollows((old) => {
      const next = new Set(old);
      next.delete(profileId);
      return next;
    });
  }

  /* =========================================================
     HELPERS
     ========================================================= */

  function authorName(
    discovery: FeedDiscovery
  ) {
    return (
      discovery.profiles
        ?.full_name ||
      discovery.profiles
        ?.username ||
      "GeoDiscover User"
    );
  }

  function timeAgo(
    dateString: string
  ) {
    const created =
      new Date(dateString);

    const seconds =
      Math.floor(
        (Date.now() -
          created.getTime()) /
          1000
      );

    if (seconds < 60)
      return "Just now";

    const minutes =
      Math.floor(seconds / 60);

    if (minutes < 60)
      return `${minutes}m ago`;

    const hours =
      Math.floor(minutes / 60);

    if (hours < 24)
      return `${hours}h ago`;

    const days =
      Math.floor(hours / 24);

    if (days < 7)
      return `${days}d ago`;

    return created.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
      }
    );
  }

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <>
      <Navbar />

      <main className="socialHome">
        {/* HEADER */}

        <section className="socialHomeHeader">
          <div>
            <p className="eyebrow">
              YOUR COMMUNITY
            </p>

            <h1>
              Discover what's happening
              around you
            </h1>

            <p>
              Real discoveries shared
              and verified by people
              nearby.
            </p>
          </div>

          <button
            type="button"
            className="homeAddButton"
            onClick={() =>
              router.push(
                "/add-discovery"
              )
            }
          >
            <Plus size={16} />

            Add Discovery
          </button>
        </section>

        {/* FILTERS */}

        <section className="homeFeedToolbar">
          <div className="homeSearch">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search discoveries..."
            />
          </div>

          <div className="homeCategories">
            {categories.map(
              (item) => (
                <button
                  type="button"
                  key={item}
                  className={
                    category === item
                      ? "homeCategory homeCategoryActive"
                      : "homeCategory"
                  }
                  onClick={() =>
                    setCategory(item)
                  }
                >
                  {item}
                </button>
              )
            )}
          </div>
        </section>

        {error && (
          <div className="homeFeedError">
            {error}
          </div>
        )}

        {/* MAIN LAYOUT */}

        <div className="socialHomeLayout">
          {/* FEED */}

          <section className="homeFeed">
            <div className="homeFeedHeading">
              <div>
                <h2>
                  Recent discoveries
                </h2>

                <span>
                  {
                    filteredDiscoveries.length
                  }{" "}
                  discoveries
                </span>
              </div>
            </div>

            {loading && (
              <div className="homeFeedEmpty">
                <LoaderCircle
                  size={22}
                />

                Loading community
                discoveries...
              </div>
            )}

            {!loading &&
              filteredDiscoveries
                .length === 0 && (
                <div className="homeFeedEmpty">
                  <MapPin size={27} />

                  <strong>
                    No discoveries found
                  </strong>

                  <span>
                    Be the first to
                    contribute.
                  </span>
                </div>
              )}

            {!loading &&
              filteredDiscoveries.map(
                (discovery) => {
                  const liked =
                    discovery.likes.some(
                      (like) =>
                        like.user_id ===
                        userId
                    );

                  const saved =
                    discovery.saves.some(
                      (save) =>
                        save.user_id ===
                        userId
                    );

                  return (
                    <article
                      key={
                        discovery.id
                      }
                      className="socialPost"
                    >
                      {/* AUTHOR */}

                      <div className="socialPostHeader">
                        <button
                          type="button"
                          className="socialPostAuthor"
                          onClick={() =>
                            router.push(
                              `/profile/${discovery.user_id}`
                            )
                          }
                        >
                          {discovery
                            .profiles
                            ?.avatar_url ? (
                            <img
                              src={
                                discovery
                                  .profiles
                                  .avatar_url
                              }
                              alt=""
                            />
                          ) : (
                            <div className="socialAvatarFallback">
                              {authorName(
                                discovery
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div>
                            <strong>
                              {authorName(
                                discovery
                              )}
                            </strong>

                            <span>
                              @
                              {discovery
                                .profiles
                                ?.username ||
                                "user"}
                              {" · "}
                              {timeAgo(
                                discovery.created_at
                              )}
                            </span>
                          </div>
                        </button>

                        <span className="socialCategory">
                          {
                            discovery.category
                          }
                        </span>
                      </div>

                      {/* CONTENT */}

                      <button
                        type="button"
                        className="socialPostContent"
                        onClick={() =>
                          router.push(
                            `/discoveries/${discovery.id}`
                          )
                        }
                      >
                        <h2>
                          {
                            discovery.title
                          }
                        </h2>

                        <p>
                          {
                            discovery.description
                          }
                        </p>

                        <span className="socialLocation">
                          <MapPin
                            size={13}
                          />

                          {discovery.location_name ||
                            "Location"}
                        </span>
                      </button>

                      {/* IMAGE */}

                      {discovery.image_url && (
                        <button
                          type="button"
                          className="socialPostImage"
                          onClick={() =>
                            router.push(
                              `/discoveries/${discovery.id}`
                            )
                          }
                        >
                          <img
                            src={
                              discovery.image_url
                            }
                            alt={
                              discovery.title
                            }
                          />
                        </button>
                      )}

                      {/* ACTIONS */}

                      <div className="socialPostActions">
                        <div>
                          <button
                            type="button"
                            className={
                              liked
                                ? "postAction liked"
                                : "postAction"
                            }
                            disabled={busyLikes.has(
                              discovery.id
                            )}
                            onClick={() =>
                              toggleLike(
                                discovery
                              )
                            }
                          >
                            <Heart
                              size={17}
                              fill={
                                liked
                                  ? "currentColor"
                                  : "none"
                              }
                            />

                            {
                              discovery
                                .likes
                                .length
                            }
                          </button>

                          <button
                            type="button"
                            className="postAction"
                            onClick={() =>
                              router.push(
                                `/discoveries/${discovery.id}`
                              )
                            }
                          >
                            <MessageCircle
                              size={17}
                            />

                            {
                              discovery
                                .comments
                                .length
                            }
                          </button>

                          <button
                            type="button"
                            className="postAction"
                            onClick={() =>
                              router.push(
                                `/discoveries/${discovery.id}`
                              )
                            }
                          >
                            <CheckCircle2
                              size={17}
                            />

                            {discovery.confirmations_count ??
                              0}
                          </button>
                        </div>

                        <button
                          type="button"
                          className={
                            saved
                              ? "postAction saved"
                              : "postAction"
                          }
                          disabled={busySaves.has(
                            discovery.id
                          )}
                          onClick={() =>
                            toggleSave(
                              discovery
                            )
                          }
                        >
                          <Bookmark
                            size={17}
                            fill={
                              saved
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
          </section>

          {/* RIGHT SIDEBAR */}

          <aside className="homeSocialSidebar">
            <div className="suggestionCard">
              <div className="suggestionHeading">
                <div>
                  <UserPlus
                    size={17}
                  />

                  <strong>
                    Suggested accounts
                  </strong>
                </div>

                <span>
                  People in the
                  GeoDiscover community
                </span>
              </div>

              {!loading &&
                suggestions.length ===
                  0 && (
                  <div className="noSuggestions">
                    <User size={20} />

                    <strong>
                      No account
                      suggestions yet.
                    </strong>

                    <span>
                      New community
                      members will appear
                      here.
                    </span>
                  </div>
                )}

              {suggestions.map(
                (profile) => {
                  const isFollowing =
                    following.has(
                      profile.id
                    );

                  const name =
                    profile.full_name ||
                    profile.username ||
                    "GeoDiscover User";

                  return (
                    <div
                      className="suggestedUser"
                      key={
                        profile.id
                      }
                    >
                      <button
                        type="button"
                        className="suggestedIdentity"
                        onClick={() =>
                          router.push(
                            `/profile/${profile.id}`
                          )
                        }
                      >
                        {profile.avatar_url ? (
                          <img
                            src={
                              profile.avatar_url
                            }
                            alt={name}
                          />
                        ) : (
                          <div>
                            {name
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <section>
                          <strong>
                            {name}
                          </strong>

                          <span>
                            @
                            {profile.username ||
                              "user"}
                          </span>

                          <small>
                            {
                              profile.points
                            }{" "}
                            points
                          </small>
                        </section>
                      </button>

                      <button
                        type="button"
                        className={
                          isFollowing
                            ? "followButton followingButton"
                            : "followButton"
                        }
                        disabled={busyFollows.has(
                          profile.id
                        )}
                        onClick={() =>
                          toggleFollow(
                            profile.id
                          )
                        }
                      >
                        {isFollowing
                          ? "Following"
                          : "Follow"}
                      </button>
                    </div>
                  );
                }
              )}
            </div>

            <div className="homeExploreCard">
              <MapPin size={21} />

              <div>
                <strong>
                  Want to explore by
                  location?
                </strong>

                <span>
                  Switch to the live map
                  to see discoveries
                  around you.
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/explore"
                  )
                }
              >
                Open Explore
              </button>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}