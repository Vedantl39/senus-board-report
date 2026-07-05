import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export function useCommentary(audience, options = {}) {
  return useQuery({
    queryKey: ["commentary", audience],
    queryFn: () => apiFetch(`/commentary/${audience}`),
    enabled: Boolean(audience) && options.enabled !== false,
    staleTime: Infinity,
    retry: false,
  });
}
