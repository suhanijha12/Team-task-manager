import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function LoadingState({
  title = "Loading",
  description = "Fetching the latest workspace data.",
  className
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 items-center justify-center rounded-lg border border-dashed bg-background p-8",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <Spinner className="h-6 w-6 text-primary" />
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
    </div>
  );
}
