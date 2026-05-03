import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <LoaderCircle
      aria-label={label}
      className={cn("h-4 w-4 animate-spin", className)}
      role="status"
    />
  );
}
