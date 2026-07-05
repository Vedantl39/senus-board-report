import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export function useAllMetrics(options = {}) {
  return useQuery({
    queryKey: ["disclosures", "metric"],
    queryFn: () => apiFetch("/disclosures?record_type=metric"),
    enabled: options.enabled !== false,
  });
}
