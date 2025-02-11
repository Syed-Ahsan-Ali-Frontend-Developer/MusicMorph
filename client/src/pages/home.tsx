import { useQuery, useMutation } from "@tanstack/react-query";
import { Track } from "@shared/schema";
import { UploadForm } from "@/components/upload-form";
import { TrackList } from "@/components/track-list";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

export default function Home() {
  const { toast } = useToast();

  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  const generateMutation = useMutation({
    mutationFn: async (trackId: number) => {
      const response = await fetch("/api/tracks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trackId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Generation failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast({
        title: "Success",
        description: "New track generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to generate track",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-4 mx-auto" />
          <p className="text-muted-foreground">Loading tracks...</p>
        </div>
      </div>
    );
  }

  const hasTracks = tracks && tracks.length > 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">AI Music Generator</h1>

      <div className="grid gap-8 md:grid-cols-[300px,1fr]">
        <div>
          <UploadForm />
        </div>

        <div>
          {hasTracks ? (
            <TrackList
              tracks={tracks || []}
              onGenerateNew={(trackId) => {
                toast({
                  title: "Generating Music",
                  description: "Please wait while we generate a similar track...",
                });
                generateMutation.mutate(trackId);
              }}
              isGenerating={generateMutation.isPending}
            />
          ) : (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tracks yet</h3>
              <p className="text-sm text-muted-foreground">
                Upload a track to get started with AI music generation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}