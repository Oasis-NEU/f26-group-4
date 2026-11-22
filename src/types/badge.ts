// A badge definition is a rule in code, not data -- see docs/data-layer.md
// ("Badges"). What's stored per person is only a UserBadge: which badge,
// what level, and whether its pop-up has shown yet (src/services/badges.ts).

export type BadgeCategory = 'starter' | 'explorer' | 'taste' | 'reviewer' | 'secret' | 'streak' | 'collection';

// One of your reviews, with just what the badge rules need. created_at keeps
// its time (unlike the display-only Review.createdAt, which is date-only),
// since Night Owl and Jet Lag need it.
export type BadgeReview = {
  createdAt: string; // full ISO timestamp
  cityId: string;
  country: string;
  placeType: string;
  latitude: number | null;
  textLength: number;
  photoCount: number;
  likeCount: number;
};

export type BadgeContext = {
  reviews: BadgeReview[];
  homeCityId: string | null;
  travelGoalProgress: number | null; // this year's progress / target, e.g. 1.5 = 150%
  ownCollectionCount: number;
  hasProfilePhoto: boolean;
  hasBio: boolean;
  followingCount: number;
};

export type BadgeDefinition = {
  id: string;
  name: string;
  icon: string; // emoji
  description: string; // shown once earned (or always, if not secret)
  category: BadgeCategory;
  secret: boolean; // shows as "???" until earned
  levels?: number[]; // thresholds shown on the Badges tab, e.g. [3, 5, 10, 25]
  // How many of `levels` are cleared (0 = not earned). For a single-level
  // badge this is just 0 or 1.
  levelReached: (ctx: BadgeContext) => number;
};

export type UserBadge = {
  userId: string;
  badgeId: string;
  level: number;
  earnedAt: string;
  seenAt: string | null;
  backfilled: boolean;
};
