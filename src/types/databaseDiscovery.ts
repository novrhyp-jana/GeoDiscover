export interface DatabaseDiscovery {
  id: string;
  user_id: string;

  title: string;
  description: string;
  category:
    | "Green Space"
    | "Plants"
    | "Wildlife"
    | "Animals"
    | "Environment"
    | "Community";

  latitude: number;
  longitude: number;

  location_name: string | null;
  image_url: string | null;

  priority:
    | "Standard"
    | "Notable"
    | "Urgent";

  accessibility:
    | "Public"
    | "Limited access"
    | "Private"
    | "Unknown";

  opening_hours: string | null;
  amenities: string[] | null;

  confirmations_count: number;
  trust_score: number;

  status:
    | "unverified"
    | "community_verified"
    | "rejected";

  created_at: string;

  profiles: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    points: number;
  } | null;
}