import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: () => (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-semibold tracking-tight capitalize">settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">Coming in the next phase.</p>
      <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        settings surface will be built out next.
      </div>
    </div>
  ),
});
