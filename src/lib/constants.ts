export const MAX_ROOM_PARTICIPANTS = 50;

export const TIER_VALUES = ["S", "A", "B", "C", "D", "F", "ETC"] as const;
export type TierValue = (typeof TIER_VALUES)[number];

export const RANKED_TIER_VALUES = ["S", "A", "B", "C", "D", "F"] as const;
