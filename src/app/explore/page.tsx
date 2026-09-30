"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";

const ExploreMap = dynamic(
  () => import("@/components/map/ExploreMap"),
  {
    ssr: false,
    loading: () => (
      <div className="mapLoading">
        Loading GeoDiscover map...
      </div>
    ),
  }
);

export default function ExplorePage() {
  return (
    <>
      <Navbar />
      <ExploreMap />
    </>
  );
}