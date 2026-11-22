// A user's private settings: who can see what, notifications, and account
// info other people never load. Stored separately from Profile on purpose --
// Settings never gets fetched by anyone except its own owner.

import type { StatusSharing } from './profile';

export type Audience = 'everyone' | 'closeFriends' | 'onlyMe';

export type Settings = {
  userId: string;

  // Privacy: account type
  accountType: 'public' | 'friendsOnly';

  // Privacy: your status
  defaultStatusSharing: {
    closeFriends: StatusSharing;
    everyone: StatusSharing;
  };
  closeFriendIds: string[]; // picked from followers; not visible to anyone but the owner

  // Privacy: your profile
  mapVisibility: Audience;
  homeVisibility: 'city' | 'country' | 'hidden';
  followListsVisibility: 'everyone' | 'onlyMe';
  newCollectionsPrivate: boolean;

  // Privacy: finding you
  showInSuggestions: boolean;
  findableByContact: boolean;
  blockedIds: string[];

  notifications: {
    paused: boolean;
    newFollower: boolean;
    likesAndComments: boolean;
    closeFriendStatus: boolean;
    tripOverlap: boolean; // parked for later; always false for now
  };
};

export function defaultSettingsFor(userId: string): Settings {
  return {
    userId,
    accountType: 'public',
    defaultStatusSharing: {
      closeFriends: { country: true, city: true, dates: true },
      everyone: { country: true, city: false, dates: false },
    },
    closeFriendIds: [],
    mapVisibility: 'everyone',
    homeVisibility: 'city',
    followListsVisibility: 'everyone',
    newCollectionsPrivate: false,
    showInSuggestions: true,
    findableByContact: false,
    blockedIds: [],
    notifications: {
      paused: false,
      newFollower: true,
      likesAndComments: true,
      closeFriendStatus: true,
      tripOverlap: false,
    },
  };
}
