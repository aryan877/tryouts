import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      title="Nothing here."
      body="This page isn't part of any tryout."
      action={{ href: "/", label: "Back to the start" }}
    />
  );
}
