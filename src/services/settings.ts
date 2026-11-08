// Where settings data comes from. Fake data for now, same idea as users.ts:
// when Supabase is set up, only this file changes. Unlike users.ts, nothing
// here is ever handed to anyone but the settings' own owner.

import { mockRequest } from './mock-backend';

import { defaultSettingsFor, type Settings } from '@/types/settings';

const mockSettings: Settings[] = [
  {
    ...defaultSettingsFor('u1'),
    accountType: 'friendsOnly', // so there's a real waiting request to demo in the inbox
    closeFriendIds: ['u2'], // ported over from the old Profile.closeFriendIds
  },
  {
    ...defaultSettingsFor('u2'),
  },
  {
    ...defaultSettingsFor('u3'),
  },
];

function findOrCreate(userId: string): Settings {
  let settings = mockSettings.find((s) => s.userId === userId);
  if (!settings) {
    settings = defaultSettingsFor(userId);
    mockSettings.push(settings);
  }
  return settings;
}

export async function getSettings(userId: string): Promise<Settings> {
  return mockRequest(findOrCreate(userId));
}

// Settings save instantly when a control is tapped -- the screen updates
// first and calls this in the background; on failure the screen is
// responsible for flipping the control back and showing an error.
export async function updateSettings(userId: string, changes: Partial<Omit<Settings, 'userId'>>): Promise<Settings> {
  const index = mockSettings.findIndex((s) => s.userId === userId);
  const current = index === -1 ? defaultSettingsFor(userId) : mockSettings[index];
  const updated = { ...current, ...changes };
  if (index === -1) {
    mockSettings.push(updated);
  } else {
    mockSettings[index] = updated;
  }
  return mockRequest(updated);
}

export async function addCloseFriend(userId: string, friendId: string): Promise<Settings> {
  const settings = findOrCreate(userId);
  if (settings.closeFriendIds.includes(friendId)) return mockRequest(settings);
  return updateSettings(userId, { closeFriendIds: [...settings.closeFriendIds, friendId] });
}

export async function removeCloseFriend(userId: string, friendId: string): Promise<Settings> {
  const settings = findOrCreate(userId);
  return updateSettings(userId, { closeFriendIds: settings.closeFriendIds.filter((id) => id !== friendId) });
}

export async function blockUser(userId: string, blockedId: string): Promise<Settings> {
  const settings = findOrCreate(userId);
  if (settings.blockedIds.includes(blockedId)) return mockRequest(settings);
  return updateSettings(userId, { blockedIds: [...settings.blockedIds, blockedId] });
}

export async function unblockUser(userId: string, blockedId: string): Promise<Settings> {
  const settings = findOrCreate(userId);
  return updateSettings(userId, { blockedIds: settings.blockedIds.filter((id) => id !== blockedId) });
}
