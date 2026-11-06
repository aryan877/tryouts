import { SwitchIcon } from "@/components/icons";

export interface HowStep {
  title: string;
  text: string;
  switch: string;
}

export function HowItWorks({ steps, children }: { steps: HowStep[]; children?: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <ol className="grid gap-px bg-gray-alpha-400 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-col bg-background-100 p-6">
            <span className="grid size-7 place-items-center rounded-full border border-gray-alpha-400 text-label-14 font-medium tabular-nums">
              {i + 1}
            </span>
            <h3 className="mt-4 text-heading-16">{step.title}</h3>
            <p className="mt-1.5 text-copy-14 text-gray-900">{step.text}</p>
            <p className="mt-auto flex items-start gap-2 pt-5 text-copy-14 text-gray-900">
              <SwitchIcon className="mt-0.5 text-blue-700" />
              <span>
                <strong className="font-medium text-gray-1000">Switch</strong> {step.switch}
              </span>
            </p>
          </li>
        ))}
        {children && <li className="flex flex-col bg-background-200 p-6">{children}</li>}
      </ol>
    </div>
  );
}
