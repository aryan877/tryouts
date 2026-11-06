import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-32 text-center">
      <h1 className="text-heading-32">Nothing here.</h1>
      <p className="mt-3 text-copy-16 text-gray-900">Tryouts is one page now.</p>
      <Button asChild variant="secondary" shape="rounded" className="mt-8">
        <Link href="/">Back to the start</Link>
      </Button>
    </div>
  );
}
