import { LoadingState } from "@/components/loading-state";

export default function RootLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <LoadingState />
    </main>
  );
}
