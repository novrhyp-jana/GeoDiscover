import { Discovery } from "@/types/discovery";

export const demoDiscoveries: Discovery[] = [
  {
    id: "1",
    title: "Rare Bloom Spotted",
    description:
      "A beautiful rare bloom spotted near the Adyar wetlands. Sharing the location for nearby nature enthusiasts.",
    category: "Plants",
    location: "Adyar Wetlands, Chennai",
    distance: "2.3 km",
    timeAgo: "12 min ago",
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Arun K",
      avatar: "https://i.pravatar.cc/100?img=12",
    },
    confirmations: 12,
    comments: 8,
    latitude: 13.0067,
    longitude: 80.2574,
    verified: true,
  },
  {
    id: "2",
    title: "Injured Stray Needs Help",
    description:
      "Found an injured stray near the road. Looking for nearby volunteers or an animal welfare organization.",
    category: "Animals",
    location: "Velachery, Chennai",
    distance: "1.1 km",
    timeAgo: "18 min ago",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Meera S",
      avatar: "https://i.pravatar.cc/100?img=47",
    },
    confirmations: 7,
    comments: 15,
    latitude: 12.9815,
    longitude: 80.218,
    urgent: true,
  },
  {
    id: "3",
    title: "Painted Stork Sighting",
    description:
      "Painted storks observed around the wetland this morning. A great spot for nearby bird watchers.",
    category: "Wildlife",
    location: "Pallikaranai, Chennai",
    distance: "4.8 km",
    timeAgo: "34 min ago",
    image:
      "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Karthik R",
      avatar: "https://i.pravatar.cc/100?img=14",
    },
    confirmations: 18,
    comments: 6,
    latitude: 12.9497,
    longitude: 80.2187,
    verified: true,
  },
  {
    id: "4",
    title: "Neighbourhood Green Space",
    description:
      "A quiet community green space with walking areas and plenty of shade.",
    category: "Green Space",
    location: "Chennai",
    distance: "3.4 km",
    timeAgo: "1 hr ago",
    image:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Nisha P",
      avatar: "https://i.pravatar.cc/100?img=32",
    },
    confirmations: 21,
    comments: 11,
    latitude: 13.032,
    longitude: 80.231,
    verified: true,
  },
];