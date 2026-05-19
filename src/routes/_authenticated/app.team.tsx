import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/team")({
  component: () => (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-semibold tracking-tight capitalize">team</h1>
      <p className="mt-2 text-sm text-muted-foreground">Coming in the next phase.</p>
      <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        team surface will be built out next.
      </div>
    </div>
  ),
});
