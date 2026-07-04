import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Senus PLC Board Report</h1>
          <p className="text-sm text-muted-foreground">
            Foundation scaffold ready — pages will be added in a later task.
          </p>
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
