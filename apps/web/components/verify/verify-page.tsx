import type { TryoutRecord } from "@tryouts/kit/record";
import { Snippet } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/geist";
import { rerunOf } from "@/lib/digest";
import { appOf } from "@/lib/run";
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
        title="Nothing to check yet."
        body="Once a tryout is recorded, every referee report it produced can be checked here, with no login."
      />
    );
  }
  const initial = digest ?? records.find((record) => record.hire)?.hire?.digest ?? null;
  const shown = evidence.find((e) => e.report.digest === initial) ?? evidence[0];
  return (
    <div className="container-page max-w-[880px] py-10">
      <h1 className="text-heading-32">Check it yourself</h1>
      <p className="mt-2 max-w-[60ch] text-copy-16 text-gray-900">
        The referee is plain code, not an AI. Every report it posts ends with a digest: a
        fingerprint of the evidence. Recompute it here, with no login, or re-run every check on your
        own machine.
      </p>
      <div className="mt-8">
        <Verifier evidence={evidence} initial={initial} />
      </div>
      <Section
        id="rerun"
        title="Re-run the referee yourself"
        description="make judge replays every recorded branch from git bundles. It needs Bun and Docker."
        className="mt-12"
      >
        <div className="flex flex-col gap-2">
          {shown && <Snippet value={rerunOf(shown.report)} />}
          <Snippet value="make judge" />
        </div>
      </Section>
      <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-gray-alpha-400 bg-gray-alpha-400 sm:grid-cols-2">
        <p className="bg-background-100 p-5 text-copy-14 text-gray-900">
          <strong>What the digest proves.</strong> The report was not edited after the referee ran.
        </p>
        <p className="bg-background-100 p-5 text-copy-14 text-gray-900">
          <strong>What it doesn't prove.</strong> That the checks are right. Re-run them for that.
        </p>
      </div>
    </div>
  );
}
