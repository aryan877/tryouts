import type { TryoutRecord } from "@tryouts/kit/record";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { appOf } from "@/lib/board";
import { rerunOf } from "@/lib/digest";
import { commitUrl } from "@/lib/site";
import { type Evidence, Verifier } from "./verifier";

export function evidenceFrom(records: TryoutRecord[]): Evidence[] {
  return records.flatMap((record) =>
    record.candidates.flatMap((c) =>
      c.report
        ? [
            {
              agent: c.agent,
              issue: record.issue,
              room: c.room,
              app: appOf(record, c.room),
              report: c.report,
              merged:
                record.hire?.agent === c.agent && record.hire.sha === c.report.head.sha
                  ? {
                      sha: record.hire.merged,
                      url: commitUrl(record.repository, record.hire.merged),
                    }
                  : null,
            },
          ]
        : [],
    ),
  );
}

function Command({ value, note }: { value: string; note?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-control bg-screen py-1.5 pr-1.5 pl-4">
      <code className="mono min-w-0 flex-1 overflow-x-auto py-1 text-[13px] whitespace-nowrap text-screen-ink">
        <span className="text-screen-ink-3">$ </span>
        {value}
        {note && <span className="text-screen-ink-3">{`  # ${note}`}</span>}
      </code>
      <CopyButton
        value={value}
        label={`Copy: ${value}`}
        className="text-screen-ink-2 hover:bg-screen-line hover:text-screen-ink"
      />
    </div>
  );
}

export function VerifyPage({
  records,
  digest,
}: {
  records: TryoutRecord[];
  digest: string | null;
}) {
  const evidence = evidenceFrom(records);
  if (evidence.length === 0) {
    return (
      <EmptyState
        title="Nothing to verify yet."
        body="Once a tryout is recorded, every referee card it produced can be checked here, with no login."
      />
    );
  }
  const shown = evidence.find((e) => e.report.digest === digest) ?? evidence[0];
  return (
    <div className="container-page max-w-[960px] py-12">
      <h1 className="h1">Check it yourself. No login.</h1>
      <p className="mt-3 max-w-[40em] text-[17px] leading-[26px] text-ink-2">
        The referee is plain code. Its card ends with a digest. Recompute it here, or re-run the
        checks on your machine.
      </p>
      <div className="mt-8">
        <Verifier evidence={evidence} initial={digest} />
      </div>
      <section aria-labelledby="rerun-title" className="mt-12">
        <h2 id="rerun-title" className="h3">
          Re-run the referee on your machine
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {shown && <Command value={rerunOf(shown.report)} />}
          <Command value="make judge" note="replays every recorded branch from git bundles" />
        </div>
      </section>
      <section className="mt-12 grid gap-6 text-[15px] leading-[23px] sm:grid-cols-2">
        <p>
          <span className="font-semibold">What the digest proves:</span>{" "}
          <span className="text-ink-2">the record was not edited after the referee ran.</span>
        </p>
        <p>
          <span className="font-semibold">What it does not prove:</span>{" "}
          <span className="text-ink-2">that the checks are right. Re-run them for that.</span>
        </p>
      </section>
    </div>
  );
}
