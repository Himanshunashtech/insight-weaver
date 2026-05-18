import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  component: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Auth coming in the next phase.</p>
        <Link to="/" className="mt-6 inline-block underline">Back home</Link>
      </div>
    </div>
  ),
});
