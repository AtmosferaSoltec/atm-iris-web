import { useQuery } from "@tanstack/react-query";
import { fetchLatestRelease } from "./release";

export function useLatestRelease() {
  return useQuery({
    queryKey: ["release", "latest"],
    queryFn: fetchLatestRelease,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
