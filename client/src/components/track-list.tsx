import { Track } from "@shared/schema";
import { AudioPlayer } from "./audio-player";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface TrackListProps {
  tracks: Track[];
  onGenerateNew: (trackId: number) => void;
  isGenerating?: boolean;
}

export function TrackList({ tracks, onGenerateNew, isGenerating = false }: TrackListProps) {
  // Sort tracks: uploaded tracks first, then generated tracks
  const sortedTracks = [...tracks].sort((a, b) => {
    // First sort by type (uploaded vs generated)
    if (a.isGenerated !== b.isGenerated) {
      return a.isGenerated ? 1 : -1;
    }
    // Then sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      {sortedTracks.map((track) => (
        <div key={track.id} className="relative">
          <AudioPlayer
            track={track}
            onDownload={
              track.isGenerated
                ? () => window.open(`/uploads/${track.filePath}`, "_blank")
                : undefined
            }
          />
          {!track.isGenerated && (
            <Button
              onClick={() => onGenerateNew(track.id)}
              disabled={isGenerating}
              variant="link"
              className="mt-2 text-primary hover:text-primary/80"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Similar Track"
              )}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}