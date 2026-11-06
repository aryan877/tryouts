# Judging Tryouts in five minutes

Every claim below comes with a command you can run and the line you should see.

## Without installing anything

| Claim                                                                      | Where to look                                                                                                                                                                                |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code, Codex and OpenCode each fixed the same bug, and one was hired | The board: [tryouts.aryankumar.dev/tryouts/1](https://tryouts.aryankumar.dev/tryouts/1), or `apps/web/records/1.json`                                                                        |
| The hire's merge closed the real GitHub issue, and names its proof         | [Commit 77f2f2d](https://github.com/aryan877/tinychunk/commit/77f2f2d) closing [issue #1](https://github.com/aryan877/tinychunk/issues/1): its `Referee:`, `Hired:` and `Approved-by:` lines |
| The hire's first real job was checked and merged                           | [Commit 27446f3](https://github.com/aryan877/tinychunk/commit/27446f3) closing [issue #2](https://github.com/aryan877/tinychunk/issues/2): `Probation: 1 of 3`                               |
| Every number on the board is Switch's own data                             | `evidence/tryout-1/usage.json` (Switch usage API), `budgets.json` (Switch budgets API), `transcripts.json` (Switch chats API)                                                                |

The recorded run used a local Switch with Mattermost standing in for Slack and Discord; the steps
and the Switch rules are the same on both.

## With Bun and Docker (no Switch, no accounts)

```sh
make judge
```

It replays `evidence/` without Switch:

- re-runs the referee's five checks on every recorded branch from its git bundle, in the same
  sandbox, and expects the same verdict and the same `sha256:` digest;
- checks that each merge on main has the approved commit as a parent and carries its digest.

Expected last line: `✔ Every recorded verdict and merge holds`.

## With Switch (the full run, about 15 minutes)

```sh
bun install
bun run demo up      # Switch, Postgres and Mattermost in Docker, one agent controller
bun run e2e          # plays Arjun and Riya on Mattermost
```

Expected last line: `✔ Tryouts end to end in <n>s`. Along the way you see the hiring manager create
the candidates with `run_template`, the referee set Switch budgets, the scoreboard, the hire card,
Switch refusing the hire's invite into #bugs, Riya letting it in, the losers deleted on Arjun's
confirm, and bug #2 merged as probation 1 of 3.

## The two templates are the artefact

In Switch Console, go to Resources → Templates → Upload template → Load from file, and upload
`templates/tryout.yaml`, `templates/bugs-room.yaml` and `templates/tryouts-team.yaml`. Use
`tryouts-team`, then post a job in #hiring.
`bun run setup <repository>` prepares the three folders and the `tryouts` command they need.

## What Switch enforces, and what it does not

- **Enforced by Switch:** only Arjun answers the hire and merge cards; the hiring manager cannot add
  the hire to #bugs because Arjun does not own that room; losers are deleted only on the owner's
  `!delete-agent … confirm`; a candidate past its budget gets no more messages.
- **Enforced by `tryouts hire|merge` against Switch's record:** it merges only if Switch shows Arjun
  answered "Allow once" on the hiring manager's card for that exact command, and that card was never
  used before. A candidate that runs `tryouts hire` on itself is refused.
- **Enforced by OpenCode and Switch together:** the referee's folder allows only
  `tryouts verify|board|budget` and refuses everything else; every command the hiring manager runs
  is an approval card that only Arjun can answer.
- **Not enforced:** anyone in #bugs may type `!invite-agent`; every candidate runs as the same OS user
  on one machine; usage is counted when a turn ends; dollars are list-price estimates; one bug is a
  sample of one.
