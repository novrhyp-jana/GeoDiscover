export type DiscoveryCategory =
  | "Plants"
  | "Wildlife"
  | "Animals"
  | "Environment"
  | "Green Space"
  | "Community";

export interface Discovery {
  id: string;
  title: string;
  description: string;
  category: DiscoveryCategory;
  location: string;
  distance: string;
  timeAgo: string;
  image: string;

  author: {
    name: string;
    avatar: string;
  };

  confirmations: number;
  comments: number;

  latitude: number;
  longitude: number;

  verified?: boolean;
  urgent?: boolean;
}