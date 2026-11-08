// Placeholder until the Settings page exists. The status panel's "Close
// friends" and "Everyone else" rows start from these defaults, then each
// profile saves its own copy onto status.sharing from there.
// TODO: once Settings is built, this becomes a real per-user value read from
// a settings service instead of a hardcoded constant.

import type { StatusDetail } from './profile';

export type Settings = {
  defaultStatusSharing: {
    closeFriends: StatusDetail;
    everyone: StatusDetail;
  };
};

export const DEFAULT_SETTINGS: Settings = {
  defaultStatusSharing: { closeFriends: 'full', everyone: 'country' },
};
