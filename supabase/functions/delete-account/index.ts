// Deletes the signed-in user's account. Called from Settings → Account →
// Delete account (deleteAccount in src/hooks/use-session.tsx). The App Store
// and Google Play both require apps that let you create an account to let you
// delete it from inside the app.
//
// 1. Deletes their photos. A user who still owns files can't be deleted, and
//    the database can't delete files by itself.
// 2. Deletes their Auth user, which deletes every row of theirs.
//
// withSupabase({ auth: 'user' }) only runs this for a signed-in user.
// supabaseAdmin uses the project's secret key from the function's
// environment; the key never goes in the app.

import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';

const BUCKET = 'media';

export default {
  fetch: withSupabase({ auth: 'user' }, async (_req, ctx) => {
    const userId = ctx.userClaims?.id;
    if (!userId) {
      return Response.json({ error: 'Not signed in.' }, { status: 401 });
    }
    const storage = ctx.supabaseAdmin.storage.from(BUCKET);

    // Every file under a folder. Folders come back without an id.
    async function filesUnder(prefix: string): Promise<string[]> {
      const { data, error } = await storage.list(prefix, { limit: 1000 });
      if (error) throw error;
      const paths: string[] = [];
      for (const item of data) {
        const path = `${prefix}/${item.name}`;
        if (item.id) {
          paths.push(path);
        } else {
          paths.push(...(await filesUnder(path)));
        }
      }
      return paths;
    }

    try {
      const files = await filesUnder(userId);
      for (let i = 0; i < files.length; i += 1000) {
        const { error } = await storage.remove(files.slice(i, i + 1000));
        if (error) throw error;
      }

      const { error } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;

      return Response.json({ deleted: true });
    } catch (error) {
      console.error('delete-account failed', error);
      return Response.json({ error: "Couldn't delete the account." }, { status: 500 });
    }
  }),
};
