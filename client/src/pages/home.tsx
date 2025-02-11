import { useQuery, useMutation } from "@tanstack/react-query";
import { Track } from "@shared/schema";
import { UploadForm } from "@/components/upload-form";
import { TrackList } from "@/components/track-list";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
        throw new Error("Generation failed");
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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">AI Music Generator</h1>
      
      <div className="grid gap-8 md:grid-cols-[300px,1fr]">
        <div>
          <UploadForm />
        </div>
        
        <div>
          <TrackList
            tracks={tracks || []}
            onGenerateNew={(trackId) => generateMutation.mutate(trackId)}
          />
        </div>
      </div>
    </div>
  );
}
