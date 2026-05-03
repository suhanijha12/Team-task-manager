import { LoadingState } from "@/components/loading-state";

export default function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <LoadingState
        className="w-full max-w-md"
        description="Preparing the authentication form."
        title="Loading"
      />
    </main>
  );
}
