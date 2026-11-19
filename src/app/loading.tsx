import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main id="main" className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 md:px-8">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-14 w-64" />
      <Skeleton className="h-40 w-full" />
    </main>
  );
}
