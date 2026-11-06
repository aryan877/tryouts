import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="container-page py-24">
      <div className="card mx-auto flex max-w-lg flex-col items-center gap-3 px-8 py-12 text-center">
        <h1 className="text-heading-24">{title}</h1>
        <p className="text-copy-14 text-gray-900">{body}</p>
        {action && (
          <Button asChild variant="secondary" className="mt-3">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
