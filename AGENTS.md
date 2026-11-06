# Working on Tryouts

- Bun workspaces + Turborepo. Use `bun`; TypeScript runs directly, libraries export `src/`.
- `packages/referee` is the trust boundary. Keep it deterministic: no model calls, rules read from
  `referee.json` at the tip of the base branch, every test run in a fresh exported tree through
  `sandbox.ts`, git hooks off. Every change there needs a test that builds the attack and fails
  without the fix.
- `apps/cli` is the `tryouts` command the agents run: `verify`, `board` and `budget` (the referee
  runs in auto mode and its folder allows only these), `hire` and `merge` (the hiring manager is not
  in auto mode, so Switch turns every command it runs into an approval card for its owner). It
  validates every argument, derives paths from its config, caches referee reports and hire records
  next to the config, and merges only the exact approved commit. `hire` and `merge` also refuse unless
  Switch's chat activity shows the owner's "Allow once" on the hiring manager's card for that exact
  command, used once: candidates run in auto mode with `tryouts` on their PATH.
- `packages/switch` wraps only the Switch and Mattermost endpoints this repo calls. Types were
  checked against switch-core 0.31.0; verify a new endpoint against the server source before typing it.
- `templates/` is the product: the team template (hiring manager, referee, #hiring), the tryout
  template the hiring manager runs itself with `run_template`, and the community's bugs room. Agent
  instructions cannot read bridge params, so those values live in room instructions.
- Switch is the source of truth for rooms, messages, approvals, usage and budgets. The recorder joins
  rooms as their owner and reads them through the chats API; it never reads a chat app directly.
  `kit/record.ts` is the one shape the recorder writes and the web board renders.
- The `tryouts` config holds two Switch accounts: the team lead who owns the agents (managed-agent
  definitions are owner-only) and an ops workspace admin for usage and budgets. Keep the team lead a
  plain member: an admin manages every room, and the hiring manager's invite into #bugs would pass.
- On Mattermost, Switch adds its command bot to a channel only once the room has an agent, so `!`
  commands in the empty #bugs go unheard; `bun run e2e` has Riya, the room's owner, add the hire
  through Switch, then `!set-alias`. Approval cards there can fail to post into threads ("Invalid
  RootId"), so the e2e answers cards through Switch's approvals API as their owner.
- Agents wake only on an @mention, even inside a code span. Every handoff between agents names the
  next agent explicitly.
- Say only what Switch enforces: an agent cannot add itself to a room its owner does not own, but any
  person in a room can `!invite-agent`; deletion needs the owner's or an admin's confirm; approval
  cards are answered by the agent's owner. Usage is counted when a turn ends; dollars are estimates.
- Each person's chat app comes from `.env` (Slack for Arjun, Discord for Riya) and falls back to
  Mattermost; `bun run e2e` needs Mattermost. `bun run demo up` is idempotent; `bun run demo reset`
  deletes the rooms through Switch, which retires their Slack and Discord channels, then wipes Docker
  volumes and `.demo/`.
- Switch's published arm64 image crashes on Apple M4 Docker, so `infra/switch` pins `linux/amd64`.
  One agent controller runs Arjun's machine (`.demo/arjun/controller`); every agent runs there.
- `make judge` replays `evidence/` without Switch: it re-verifies every recorded branch from git
  bundles and checks each merge on main. It needs Bun and Docker.
