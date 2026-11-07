# Judging Tryouts in five minutes

Every claim below comes with a command you can run and the line you should see.

## Without installing anything

| Claim                                                                      | Where to look                                                                                                                                                                                |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code, Codex and OpenCode each fixed the same bug, and one was hired | `apps/web/records/1.json` and `evidence/tryout-1/`                                                                                                                                           |
| The hire's merge closed the real GitHub issue, and names its proof         | [Commit 0eb4b33](https://github.com/aryan877/tinychunk/commit/0eb4b33) closing [issue #1](https://github.com/aryan877/tinychunk/issues/1): its `Referee:`, `Hired:` and `Approved-by:` lines |
| The hire's first real job was checked and merged                           | [Commit 9abc13f](https://github.com/aryan877/tinychunk/commit/9abc13f) closing [issue #2](https://github.com/aryan877/tinychunk/issues/2): `Probation: 1 of 3`                               |
| Every recorded number is Switch's own data                                 | `evidence/tryout-1/usage.json` (Switch usage API), `budgets.json` (Switch budgets API), `transcripts.json` (Switch chats API)                                                                |

The recorded run is the one in the video: a self-hosted Switch with the team lead in Slack and the
community in Discord. `bun run e2e` replays the same steps on Mattermost, with the same Switch rules.

## With Bun and Docker (no Switch, no accounts)

```sh
make judge
```

It replays `evidence/` without Switch:

- re-runs the referee's five checks on every recorded branch from its git bundle, in the same
  sandbox, and expects the same verdict and the same `sha256:` digest;
- runs every fix against each rival's new tests again and expects the same digest;
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
  `!delete-agent … confirm`; a candidate past its budget gets no more messages (a turn already
  running still finishes).
- **Enforced by `tryouts hire|merge` against Switch's record:** it merges only if Switch shows Arjun
  answered "Allow once" on the hiring manager's card for that exact command, and that card was never
  used before; a card is used up before the merge starts, so a failed merge cannot reuse it. A
  candidate that runs `tryouts hire` on itself is refused.
- **Enforced by the referee:** a candidate cannot weaken an old test (the original version of every
  test file it changed must still pass) or hide one with a `.gitattributes` file.
- **Enforced by OpenCode and Switch together:** the referee's folder allows only
  `tryouts verify|board|budget` and refuses everything else; every command the hiring manager runs
  is an approval card that only Arjun can answer.
- **Enforced by Switch's addressing policy:** only people in #bugs with a linked Switch account can give the
  hire work; strangers get Switch's refusal.
- **Not enforced:** anyone in #bugs may type `!invite-agent`; every candidate runs as the same OS user
  on one machine, so a determined candidate could read the team lead's Switch login from the
  `tryouts` config and act as him; usage is counted when a turn ends; dollars are list-price
  estimates; one bug is a sample of one; a branch can pass the five checks and fix nothing, which rival
  tests catch in a tryout and the approver's diff has to catch on probation.
