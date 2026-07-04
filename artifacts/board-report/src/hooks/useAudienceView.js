import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

const AUDIENCE_PATHS = {
  management: "/views/management",
  board: "/views/board",
  investors: "/views/investors",
  lenders: "/views/lenders",
};

export function useAudienceView(audience, options = {}) {
  return useQuery({
    queryKey: ["audience-view", audience],
    queryFn: () => apiFetch(AUDIENCE_PATHS[audience]),
    enabled: Boolean(audience) && options.enabled !== false,
  });
}
