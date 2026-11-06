import { Check, Close } from "@/components/icons";

export interface SwitchRow {
  step: string;
  with: string;
  without: string;
}

const th = "h-10 px-4 text-left font-medium whitespace-nowrap";

export function WithoutSwitch({ rows }: { rows: SwitchRow[] }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-label-14">
        <caption className="sr-only">What each step needs from Switch</caption>
        <thead className="bg-background-200 text-gray-900 max-md:hidden">
          <tr className="border-b border-gray-alpha-400">
            <th scope="col" className={th}>
              Step
            </th>
            <th scope="col" className={th}>
              With Switch
            </th>
            <th scope="col" className={th}>
              Without Switch
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.step}
              className="flex flex-col gap-2 border-b border-gray-alpha-400 px-4 py-4 last:border-0 md:table-row md:p-0"
            >
              <th
                scope="row"
                className="text-left align-top font-medium text-gray-1000 md:w-[22%] md:px-4 md:py-3.5"
              >
                {row.step}
              </th>
              <td className="align-top md:w-[42%] md:px-4 md:py-3.5">
                <span className="flex gap-2.5 text-copy-14 text-gray-1000">
                  <Check className="mt-0.5 text-green-700" />
                  {row.with}
                </span>
              </td>
              <td className="align-top md:px-4 md:py-3.5">
                <span className="flex gap-2.5 text-copy-14 text-gray-900">
                  <Close className="mt-0.5 text-red-800" />
                  {row.without}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
