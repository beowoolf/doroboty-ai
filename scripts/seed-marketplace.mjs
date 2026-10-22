import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const workdir = process.env.LOCAL_SUPABASE_WORKDIR
  ? resolve(process.env.LOCAL_SUPABASE_WORKDIR)
  : root;
const config = readFileSync(resolve(workdir, "supabase/config.toml"), "utf8");
const project = config.match(/^project_id\s*=\s*"([a-zA-Z0-9_-]+)"/m)?.[1];
if (!project) throw new Error("Unable to resolve the local Supabase project.");
let database;
try {
  const status = JSON.parse(
    execFileSync("npx", ["supabase", "status", "--workdir", workdir, "-o", "json"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  database = new URL(status.DB_URL);
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== status.API_URL
  )
    throw new Error("Fixture database differs from the application test target.");
} catch {
  // CLI errors can contain credential-bearing status output. Do not surface them.
  throw new Error("Unable to read local Supabase status. Start the local database first.");
}
if (!["127.0.0.1", "localhost", "[::1]"].includes(database.hostname))
  throw new Error("Marketplace fixtures can be added only to a local database.");
const container = `supabase_db_${project}`;
const inspected = JSON.parse(
  execFileSync("docker", ["inspect", container], { encoding: "utf8" }),
)[0];
const ports = inspected.NetworkSettings.Ports["5432/tcp"] ?? [];
if (!inspected.State.Running || !ports.some((port) => port.HostPort === database.port))
  throw new Error("Local database container does not match the Supabase CLI target.");

const sql = readFileSync(resolve(root, "supabase/marketplace-fixtures.sql"), "utf8");
execFileSync(
  "docker",
  ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"],
  { input: sql, stdio: ["pipe", "ignore", "pipe"] },
);
console.log("Local marketplace fixtures ready: 100 jobs across 25 fictional companies.");
console.log("Existing records, memberships and candidate data were preserved. No reset performed.");
