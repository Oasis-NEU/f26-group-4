// Rebuilds the demo data from nothing. The rules for the data are in
// docs/backend-plan.md, "Demo data".
//
//   Local stack:     npm run demo:reset
//   Shared project:  SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SECRET_KEY=sb_secret_... \
//                    npm run demo:reset -- --remote
//
// The demo password comes from DEMO_PASSWORD, or from EXPO_PUBLIC_DEMO_PASSWORD
// in .env.local. --remote also needs `npx supabase link` done once.
// Never commit the secret key or give it an EXPO_PUBLIC_ name: it skips every
// privacy rule.
//
// What it does:
//   1. For each account in accounts.json: delete its files and the account,
//      then create it again. Deleting an account deletes everything it made,
//      so this never needs a list of tables.
//   2. Upload seed/photos/ to media/seed/, replacing what's there.
//   3. Run the numbered SQL files in order, in one transaction.
//
// Accounts that aren't in accounts.json, and everything they made, are left alone.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const seedDir = dirname(fileURLToPath(import.meta.url));
const projectDir = join(seedDir, '..', '..');
const remote = process.argv.includes('--remote');
const BUCKET = 'media';
const EMAIL_DOMAIN = 'example.com';
const PHOTO_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

function supabaseCli(args, options = {}) {
  return execFileSync('npx', ['supabase', ...args], { cwd: projectDir, encoding: 'utf8', ...options });
}

function connection() {
  if (remote) {
    const url = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secretKey) {
      fail('With --remote, set SUPABASE_URL and SUPABASE_SECRET_KEY in your terminal first.');
    }
    return { url, secretKey };
  }
  let output;
  try {
    output = supabaseCli(['status', '-o', 'json'], { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    fail('The local stack isn\'t running. Start it with `npx supabase start`.');
  }
  const status = JSON.parse(output.slice(output.indexOf('{')));
  return { url: status.API_URL, secretKey: status.SECRET_KEY };
}

const password = process.env.DEMO_PASSWORD ?? process.env.EXPO_PUBLIC_DEMO_PASSWORD;
if (!password || password.length < 6) {
  fail('Set DEMO_PASSWORD (at least 6 characters): the one password every demo account uses.');
}

const { url, secretKey } = connection();
const supabase = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
const accounts = JSON.parse(readFileSync(join(seedDir, 'accounts.json'), 'utf8'));

console.log(`Resetting the demo data on ${remote ? url : 'the local stack'}…`);

// Every file under a folder of the bucket. Folders come back without an id.
async function filesUnder(prefix) {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;
  const paths = [];
  for (const item of data) {
    const path = `${prefix}/${item.name}`;
    if (item.id) paths.push(path);
    else paths.push(...(await filesUnder(path)));
  }
  return paths;
}

async function userIdsByEmail() {
  const ids = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const user of data.users) {
      if (user.email) ids.set(user.email.toLowerCase(), user.id);
    }
    if (data.users.length < 1000) return ids;
  }
}

// 1. Accounts. A user who still owns files can't be deleted, so files go first.
const existing = await userIdsByEmail();
for (const account of accounts) {
  const email = `${account.username}@${EMAIL_DOMAIN}`;
  const oldId = existing.get(email);
  if (oldId) {
    const files = await filesUnder(oldId);
    for (let i = 0; i < files.length; i += 1000) {
      const { error } = await supabase.storage.from(BUCKET).remove(files.slice(i, i + 1000));
      if (error) throw error;
    }
    const { error } = await supabase.auth.admin.deleteUser(oldId);
    if (error) fail(`Couldn't delete ${account.username}: ${error.message}`);
  }
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: account.username, name: account.name },
  });
  if (error) fail(`Couldn't create ${account.username}: ${error.message}`);
}
console.log(`✓ ${accounts.length} accounts recreated`);

// 2. Photos
const photosDir = join(seedDir, 'photos');
const photos = existsSync(photosDir)
  ? readdirSync(photosDir).filter((file) => PHOTO_TYPES[extname(file).toLowerCase()])
  : [];
for (const file of photos) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`seed/${file}`, readFileSync(join(photosDir, file)), {
      contentType: PHOTO_TYPES[extname(file).toLowerCase()],
      upsert: true,
    });
  if (error) fail(`Couldn't upload ${file}: ${error.message}`);
}
console.log(`✓ ${photos.length} photos uploaded`);

// 3. SQL. `supabase db query` runs one statement at a time, so the files go
// inside a single `do` block: one statement, and one transaction, so a mistake
// anywhere saves none of it.
const sqlFiles = readdirSync(seedDir)
  .filter((file) => /^\d+_.+\.sql$/.test(file))
  .sort();
const script = [
  'do $seed$',
  'begin',
  ...sqlFiles.map((file) => `-- ${file}\n${readFileSync(join(seedDir, file), 'utf8')}`),
  'end',
  '$seed$;',
].join('\n');
const tempDir = mkdtempSync(join(tmpdir(), 'demo-seed-'));
const scriptPath = join(tempDir, 'seed.sql');
writeFileSync(scriptPath, script);
try {
  supabaseCli(['db', 'query', '--file', scriptPath, ...(remote ? ['--remote', '--yes'] : [])], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (error) {
  console.error(error.stdout || error.stderr || error.message);
  fail('The SQL step failed (the error is above). None of it was saved. Fix it and run the reset again.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
console.log(`✓ ${sqlFiles.length} SQL files loaded: ${sqlFiles.join(', ')}`);
console.log('Done.');
