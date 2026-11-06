import { Terminal } from "@/components/icons";
import { Band, card, SectionTitle } from "@/components/section";
import { GITHUB_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const code = "rounded-md bg-gray-alpha-200 px-1.5 py-0.5 font-mono text-[0.88em] text-gray-1000";

const STEPS: React.ReactNode[] = [
  <>Run Switch on your server and log in to Switch Console.</>,
  <>Connect your Slack and Discord in Switch Console.</>,
  <>
    On the machine that runs the agents: install Switch's agent controller, log in to Claude Code,
    Codex and OpenCode, and run <code className={code}>bun run setup &lt;your repo&gt;</code>.
  </>,
  <>
    Upload the three Tryouts templates in Switch Console and press “Use” on{" "}
    <code className={code}>tryouts-team</code>. #hiring appears in your Slack with the hiring
    manager and the referee.
  </>,
];

const PEOPLE = [
  {
    who: "Team lead",
    does: "Posts a job in Slack #hiring and presses “Allow once”.",
    account: "No new account",
  },
  {
    who: "Community",
    does: "Reports bugs in Discord #bugs.",
    account: "No new account",
  },
  {
    who: "AI agents",
    does: "Appear by themselves. Switch keeps them in their rooms and within budget.",
    account: "Made by Switch",
  },
];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-alpha-300 bg-background-200">
      <p className="flex items-center gap-2 border-b border-gray-alpha-200 px-4 py-2.5 font-mono text-[12px] text-gray-900">
        <Terminal className="size-3.5" />
        {title}
      </p>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-6 text-gray-1000">
        {children}
      </pre>
    </div>
  );
}

export function Setup() {
  const key = "text-blue-900";
  const value = "text-green-900";
  return (
    <Band id="setup" labelledBy="setup-title">
      <SectionTitle
        id="setup-title"
        eyebrow="Setup"
        title="Set it up once. Then everyone just chats."
      >
        There is no sign-up for Tryouts. A team adds it to its own Switch, and Switch handles
        accounts, chat connections and permissions.
      </SectionTitle>
      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className={cn(card, "reveal p-6 md:p-8")}>
          <p className="text-copy-15 text-gray-900">
            For the one person who sets it up: a team lead or IT
          </p>
          <ol className="mt-6 flex flex-col gap-6">
            {STEPS.map((step, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: steps are a fixed list
              <li key={i} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gray-1000 font-mono text-label-14 text-background-200">
                  {i + 1}
                </span>
                <p className="pt-1 text-copy-16 text-gray-1000">{step}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="reveal flex flex-col gap-4">
          <Panel title="On the agents' machine">
            <span className="text-gray-900">$ </span>
            {`git clone ${GITHUB_URL}\n`}
            <span className="text-gray-900">$ </span>
            {"cd tryouts && bun install\n"}
            <span className="text-gray-900">
              {"$ SWITCH_URL=… SWITCH_EMAIL=… SWITCH_PASSWORD=… \\\n    "}
            </span>
            {"bun run setup https://github.com/your/repo"}
          </Panel>
          <Panel title="referee.json, in your repo">
            {"{\n  "}
            <span className={key}>"test"</span>: [<span className={value}>"npm"</span>,{" "}
            <span className={value}>"test"</span>],{"\n  "}
            <span className={key}>"scope"</span>: [<span className={value}>"src/"</span>,{" "}
            <span className={value}>"test/"</span>],{"\n  "}
            <span className={key}>"sandbox"</span>: {"{ "}
            <span className={key}>"image"</span>: <span className={value}>"node:22"</span>
            {" }\n}"}
          </Panel>
          <Panel title="Switch Console → Resources → Templates">
            <span className="text-gray-900">Upload </span>templates/tryouts-team.yaml
            {"\n"}
            <span className="text-gray-900">Upload </span>templates/tryout.yaml
            {"\n"}
            <span className="text-gray-900">Upload </span>templates/bugs-room.yaml
            {"\n"}
            <span className="text-gray-900">Then press </span>Use
            <span className="text-gray-900"> on </span>tryouts-team
          </Panel>
          <p className="px-1 text-copy-15 text-gray-900">
            referee.json tells the referee how to run your tests, which folders a fix may touch, and
            which Docker image to run them in.
          </p>
        </div>
      </div>
      <div className={cn(card, "reveal mt-6 overflow-hidden")}>
        <p className="border-b border-gray-alpha-200 px-6 py-4 text-heading-16 md:px-8">
          Who does what
        </p>
        <dl>
          {PEOPLE.map(({ who, does, account }) => (
            <div
              key={who}
              className="grid gap-x-6 gap-y-1 border-b border-gray-alpha-200 px-6 py-4 last:border-0 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center md:px-8"
            >
              <dt className="text-copy-16 font-medium text-gray-1000">{who}</dt>
              <dd className="text-copy-16 text-gray-900">{does}</dd>
              <dd className="text-copy-15 text-gray-900 md:text-right">{account}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Band>
  );
}
