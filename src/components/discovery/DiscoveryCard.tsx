import {
  BadgeCheck,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
} from "lucide-react";

import { Discovery } from "@/types/discovery";

export default function DiscoveryCard({
  discovery,
}: {
  discovery: Discovery;
}) {
  return (
    <article className="discoveryCard">
      <div className="cardImageWrap">
        <img
          className="cardImage"
          src={discovery.image}
          alt={discovery.title}
        />

        <span className="categoryBadge">{discovery.category}</span>

        {discovery.urgent && (
          <span className="urgentBadge">URGENT</span>
        )}
      </div>

      <div className="cardBody">
        <div className="authorRow">
          <img
            src={discovery.author.avatar}
            alt=""
            className="avatar"
          />

          <div>
            <div className="authorName">{discovery.author.name}</div>
            <div className="muted">{discovery.timeAgo}</div>
          </div>
        </div>

        <div className="titleRow">
          <h2>{discovery.title}</h2>

          {discovery.verified && (
            <BadgeCheck size={20} className="verifiedIcon" />
          )}
        </div>

        <p className="description">{discovery.description}</p>

        <div className="locationRow">
          <MapPin size={17} />
          <span>{discovery.location}</span>

          <span className="distance">
            <Navigation size={14} />
            {discovery.distance}
          </span>
        </div>

        <div className="cardFooter">
          <button>
            <Heart size={18} />
          </button>

          <button>
            <MessageCircle size={18} />
            {discovery.comments}
          </button>

          <div className="confirmationCount">
            <BadgeCheck size={17} />
            {discovery.confirmations} confirmations
          </div>
        </div>
      </div>
    </article>
  );
}