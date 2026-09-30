"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  CheckCircle2,
  Crosshair,
  LoaderCircle,
  MapPin,
  Navigation,
  Search,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { DatabaseDiscovery } from "@/types/databaseDiscovery";

import "leaflet/dist/leaflet.css";

/* =========================================================
   DEFAULT LOCATION
   ========================================================= */

const CHENNAI: [number, number] = [13.0827, 80.2707];

/* =========================================================
   MAP MARKERS
   ========================================================= */

const discoveryIcon = L.divIcon({
  className: "customMapMarker",
  html: `
    <div class="markerInner">
      ●
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

const selectedIcon = L.divIcon({
  className: "customMapMarker selectedMarker",
  html: `
    <div class="markerInner">
      ●
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});

const userIcon = L.divIcon({
  className: "userMapMarker",
  html: `
    <div class="userDot"></div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/* =========================================================
   DISTANCE
   ========================================================= */

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadius = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return (
    earthRadius *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

/* =========================================================
   MAP CONTROLLER
   ========================================================= */

function MapController({
  target,
}: {
  target: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;

    map.flyTo(target, 14, {
      duration: 0.7,
    });
  }, [target, map]);

  return null;
}

/* =========================================================
   EXTENDED TYPE
   ========================================================= */

type DiscoveryWithDistance = DatabaseDiscovery & {
  actualDistance: number | null;
};

/* =========================================================
   MAIN
   ========================================================= */

export default function ExploreMap() {
  const router = useRouter();

  const [discoveries, setDiscoveries] = useState<
    DatabaseDiscovery[]
  >([]);

  const [selected, setSelected] =
    useState<DatabaseDiscovery | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [category, setCategory] = useState("All");

  const [radius, setRadius] = useState(10);

  const [search, setSearch] = useState("");

  const [userPosition, setUserPosition] = useState<
    [number, number] | null
  >(null);

  const [mapTarget, setMapTarget] = useState<
    [number, number] | null
  >(null);

  const [locationError, setLocationError] =
    useState("");

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
     LOAD REAL DISCOVERIES
     ========================================================= */

  useEffect(() => {
    async function loadDiscoveries() {
      setLoading(true);
      setError("");

      const supabase = createClient();

      const { data, error: fetchError } =
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
            accessibility,
            opening_hours,
            amenities,
            confirmations_count,
            trust_score,
            status,
            created_at,

            profiles!discoveries_user_id_fkey (
              username,
              full_name,
              avatar_url,
              points
            )
          `)
          .eq("is_hidden", false)
          .order("created_at", {
            ascending: false,
          });

      if (fetchError) {
        console.error(
          "GeoDiscover discovery fetch error:",
          fetchError
        );

        setError(fetchError.message);

        setLoading(false);

        return;
      }

      const realDiscoveries =
        (data ?? []) as unknown as DatabaseDiscovery[];

      setDiscoveries(realDiscoveries);

      /*
       * If we currently only have one discovery,
       * automatically move the map to it.
       */
      if (realDiscoveries.length === 1) {
        setMapTarget([
          realDiscoveries[0].latitude,
          realDiscoveries[0].longitude,
        ]);
      }

      setLoading(false);
    }

    loadDiscoveries();
  }, []);

  /* =========================================================
     FILTERING
     ========================================================= */

  const filteredDiscoveries =
    useMemo<DiscoveryWithDistance[]>(() => {
      return discoveries
        .map((discovery) => {
          const actualDistance = userPosition
            ? distanceKm(
                userPosition[0],
                userPosition[1],
                discovery.latitude,
                discovery.longitude
              )
            : null;

          return {
            ...discovery,
            actualDistance,
          };
        })

        .filter((discovery) => {
          const categoryMatch =
            category === "All" ||
            discovery.category === category;

          const searchableText = `
            ${discovery.title}
            ${discovery.description}
            ${discovery.location_name ?? ""}
            ${discovery.category}
            ${discovery.profiles?.full_name ?? ""}
            ${discovery.profiles?.username ?? ""}
          `.toLowerCase();

          const searchMatch =
            searchableText.includes(
              search.trim().toLowerCase()
            );

          const radiusMatch =
            !userPosition ||
            discovery.actualDistance === null ||
            discovery.actualDistance <= radius;

          return (
            categoryMatch &&
            searchMatch &&
            radiusMatch
          );
        })

        .sort((a, b) => {
          if (
            a.actualDistance === null ||
            b.actualDistance === null
          ) {
            return 0;
          }

          return (
            a.actualDistance - b.actualDistance
          );
        });
    }, [
      discoveries,
      category,
      radius,
      search,
      userPosition,
    ]);

  /* =========================================================
     CURRENT LOCATION
     ========================================================= */

  function useMyLocation() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(
        "Location is not supported by this browser."
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setUserPosition(coordinates);

        setMapTarget(coordinates);
      },

      (geoError) => {
        console.error(
          "Geolocation error:",
          geoError
        );

        if (
          geoError.code ===
          geoError.PERMISSION_DENIED
        ) {
          setLocationError(
            "Location permission was denied. Allow location access and try again."
          );
        } else {
          setLocationError(
            "Could not determine your current location."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }

  /* =========================================================
     SELECT DISCOVERY
     ========================================================= */

  function selectDiscovery(
    discovery: DatabaseDiscovery
  ) {
    setSelected(discovery);

    setMapTarget([
      discovery.latitude,
      discovery.longitude,
    ]);
  }

  /* =========================================================
     OPEN AUTHOR
     ========================================================= */

  function openAuthor(
    discovery: DatabaseDiscovery
  ) {
    if (!discovery.user_id) return;

    router.push(
      `/profile/${discovery.user_id}`
    );
  }

  /* =========================================================
     OPEN DISCOVERY
     ========================================================= */

  function openDiscovery(
    discovery: DatabaseDiscovery
  ) {
    router.push(
      `/discoveries/${discovery.id}`
    );
  }

  /* =========================================================
     AUTHOR NAME
     ========================================================= */

  function getAuthorName(
    discovery: DatabaseDiscovery
  ) {
    return (
      discovery.profiles?.full_name ||
      discovery.profiles?.username ||
      "GeoDiscover User"
    );
  }

  /* =========================================================
     UI
     ========================================================= */

  return (
    <main className="explorePage">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="exploreHeader">
        <div>
          <p className="eyebrow">
            LIVE DISCOVERY MAP
          </p>

          <h1>Explore around you</h1>

          <p>
            Discover green spaces, wildlife,
            community reports and local
            observations around your area.
          </p>
        </div>

        <button
          type="button"
          className="locationButton"
          onClick={useMyLocation}
        >
          <Crosshair size={18} />

          Use my location
        </button>
      </section>

      {/* =====================================================
          ERRORS
          ===================================================== */}

      {locationError && (
        <div className="mapError">
          {locationError}
        </div>
      )}

      {error && (
        <div className="mapError">
          <strong>
            Could not load discoveries.
          </strong>

          <span>{error}</span>
        </div>
      )}

      {/* =====================================================
          TOOLBAR
          ===================================================== */}

      <section className="exploreToolbar">
        <div className="mapSearch">
          <Search size={18} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search discoveries..."
          />
        </div>

        <div className="categorySelector">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() =>
                setCategory(item)
              }
              className={
                category === item
                  ? "mapCategory selectedMapCategory"
                  : "mapCategory"
              }
            >
              {item}
            </button>
          ))}
        </div>

        <div className="radiusControl">
          <SlidersHorizontal size={17} />

          <span>Radius</span>

          {[1, 5, 10, 25].map((value) => (
            <button
              type="button"
              key={value}
              onClick={() =>
                setRadius(value)
              }
              className={
                radius === value
                  ? "radiusActive"
                  : ""
              }
            >
              {value} km
            </button>
          ))}
        </div>
      </section>

      {/* =====================================================
          WORKSPACE
          ===================================================== */}

      <section className="exploreWorkspace">
        {/* ===================================================
            LEFT SIDEBAR
            =================================================== */}

        <aside className="mapSidebar">
          <div className="mapSidebarHeader">
            <div>
              <strong>
                Nearby discoveries
              </strong>

              <span>
                {userPosition
                  ? `Within ${radius} km`
                  : "Enable location for distance"}
              </span>
            </div>

            <b>
              {
                filteredDiscoveries.length
              }
            </b>
          </div>

          <div className="mapResults">
            {/* LOADING */}

            {loading && (
              <div className="emptyMapResults">
                <LoaderCircle
                  size={18}
                  className="spinner"
                />

                <span>
                  Loading discoveries...
                </span>
              </div>
            )}

            {/* DISCOVERY RESULTS */}

            {!loading &&
              filteredDiscoveries.map(
                (discovery) => (
                  <button
                    type="button"
                    key={discovery.id}
                    className={
                      selected?.id ===
                      discovery.id
                        ? "mapResult activeMapResult"
                        : "mapResult"
                    }
                    onClick={() =>
                      selectDiscovery(
                        discovery
                      )
                    }
                  >
                    {/* IMAGE */}

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
                      <div className="mapResultNoImage">
                        <MapPin
                          size={20}
                        />
                      </div>
                    )}

                    {/* INFO */}

                    <div className="mapResultInfo">
                      {/* CATEGORY */}

                      <span className="resultCategory">
                        {
                          discovery.category
                        }
                      </span>

                      {/* TITLE */}

                      <strong className="mapResultTitle">
                        {
                          discovery.title
                        }
                      </strong>

                      {/* ===============================
                          AUTHOR
                          =============================== */}

                      <div
                        className="explorePostAuthor"
                        onClick={(event) => {
                          event.stopPropagation();

                          openAuthor(
                            discovery
                          );
                        }}
                      >
                        {discovery.profiles
                          ?.avatar_url ? (
                          <img
                            src={
                              discovery
                                .profiles
                                .avatar_url
                            }
                            alt={
                              getAuthorName(
                                discovery
                              )
                            }
                          />
                        ) : (
                          <div className="exploreAuthorFallback">
                            <User
                              size={10}
                            />
                          </div>
                        )}

                        <div className="exploreAuthorText">
                          <span>
                            Posted by
                          </span>

                          <strong>
                            {getAuthorName(
                              discovery
                            )}
                          </strong>
                        </div>
                      </div>

                      {/* LOCATION */}

                      <p>
                        <MapPin
                          size={12}
                        />

                        {discovery.location_name ??
                          "Location"}
                      </p>

                      {/* DISTANCE */}

                      {discovery.actualDistance !==
                        null && (
                        <small>
                          <Navigation
                            size={11}
                          />

                          {discovery.actualDistance.toFixed(
                            1
                          )}{" "}
                          km away
                        </small>
                      )}
                    </div>
                  </button>
                )
              )}

            {/* EMPTY */}

            {!loading &&
              filteredDiscoveries.length ===
                0 && (
                <div className="emptyMapResults">
                  <MapPin size={19} />

                  <strong>
                    No discoveries found
                  </strong>

                  <span>
                    Try another category,
                    increase the radius or
                    publish a discovery.
                  </span>
                </div>
              )}
          </div>
        </aside>

        {/* ===================================================
            MAP
            =================================================== */}

        <div className="realMapContainer">
          <MapContainer
            center={CHENNAI}
            zoom={11}
            scrollWheelZoom
            className="leafletGeoMap"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController
              target={mapTarget}
            />

            {/* DISCOVERY MARKERS */}

            {filteredDiscoveries.map(
              (discovery) => (
                <Marker
                  key={discovery.id}
                  position={[
                    discovery.latitude,
                    discovery.longitude,
                  ]}
                  icon={
                    selected?.id ===
                    discovery.id
                      ? selectedIcon
                      : discoveryIcon
                  }
                  eventHandlers={{
                    click: () =>
                      selectDiscovery(
                        discovery
                      ),
                  }}
                >
                  <Popup>
                    <div className="leafletPopup">
                      <strong>
                        {
                          discovery.title
                        }
                      </strong>

                      <span>
                        {
                          discovery.category
                        }
                      </span>

                      <p>
                        {discovery.location_name ??
                          "Location"}
                      </p>

                      <small>
                        Posted by{" "}
                        {getAuthorName(
                          discovery
                        )}
                      </small>
                    </div>
                  </Popup>
                </Marker>
              )
            )}

            {/* CURRENT USER */}

            {userPosition && (
              <>
                <Marker
                  position={userPosition}
                  icon={userIcon}
                >
                  <Popup>
                    Your current location
                  </Popup>
                </Marker>

                <Circle
                  center={userPosition}
                  radius={
                    radius * 1000
                  }
                  pathOptions={{
                    color: "#159447",
                    fillColor:
                      "#159447",
                    fillOpacity: 0.08,
                    weight: 2,
                  }}
                />
              </>
            )}
          </MapContainer>

          {/* =================================================
              SELECTED DISCOVERY
              ================================================= */}

          {selected && (
            <div className="selectedDiscovery">
              {/* CLOSE */}

              <button
                type="button"
                className="closeDiscovery"
                onClick={() =>
                  setSelected(null)
                }
                aria-label="Close discovery"
              >
                ×
              </button>

              {/* IMAGE */}

              {selected.image_url ? (
                <img
                  src={
                    selected.image_url
                  }
                  alt={
                    selected.title
                  }
                />
              ) : (
                <div className="selectedDiscoveryNoImage">
                  <MapPin size={28} />
                </div>
              )}

              {/* CONTENT */}

              <div className="selectedContent">
                {/* CATEGORY */}

                <span>
                  {selected.category}
                </span>

                {/* TITLE */}

                <h3>
                  {selected.title}
                </h3>

                {/* DESCRIPTION */}

                <p>
                  {selected.description}
                </p>

                {/* ===============================
                    AUTHOR
                    =============================== */}

                <button
                  type="button"
                  className="discoveryAuthorMini"
                  onClick={() =>
                    openAuthor(selected)
                  }
                >
                  {selected.profiles
                    ?.avatar_url ? (
                    <img
                      src={
                        selected.profiles
                          .avatar_url
                      }
                      alt={
                        getAuthorName(
                          selected
                        )
                      }
                    />
                  ) : (
                    <div>
                      <User
                        size={14}
                      />
                    </div>
                  )}

                  <section>
                    <small>
                      Posted by
                    </small>

                    <strong>
                      {getAuthorName(
                        selected
                      )}
                    </strong>

                    {selected.profiles
                      ?.username && (
                      <small>
                        @
                        {
                          selected
                            .profiles
                            .username
                        }
                      </small>
                    )}

                    {selected.profiles
                      ?.points !==
                      undefined && (
                      <small>
                        {
                          selected
                            .profiles
                            .points
                        }{" "}
                        reputation points
                      </small>
                    )}
                  </section>
                </button>

                {/* LOCATION */}

                <div>
                  <MapPin size={14} />

                  {selected.location_name ??
                    "Location"}
                </div>

                {/* ACCESSIBILITY */}

                {selected.category ===
                  "Green Space" &&
                  selected.accessibility && (
                    <div>
                      <Navigation
                        size={14}
                      />

                      Accessibility:{" "}
                      {
                        selected.accessibility
                      }
                    </div>
                  )}

                {/* CONFIRMATIONS */}

                <div>
                  <CheckCircle2
                    size={14}
                  />

                  {selected.confirmations_count ??
                    0}{" "}
                  community confirmations
                </div>

                {/* VERIFIED */}

                {selected.status ===
                  "community_verified" && (
                  <div className="verifiedDiscovery">
                    <CheckCircle2
                      size={14}
                    />

                    Community verified
                  </div>
                )}

                {/* URGENT */}

                {selected.priority ===
                  "Urgent" && (
                  <div className="urgentDiscoveryLabel">
                    Urgent discovery
                  </div>
                )}

                {/* OPEN FULL DISCOVERY */}

                <button
                  type="button"
                  className="viewDiscoveryButton"
                  onClick={() =>
                    openDiscovery(
                      selected
                    )
                  }
                >
                  View discovery
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}