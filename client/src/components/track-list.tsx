import { Track } from "@shared/schema";
import { AudioPlayer } from "./audio-player";

interface TrackListProps {
  tracks: Track[];
  onGenerateNew: (trackId: number) => void;
}

export function TrackList({ tracks, onGenerateNew }: TrackListProps) {
  return (
    <div className="space-y-4">
      {tracks.map((track) => (
        <AudioPlayer
          key={track.id}
          track={track}
          onDownload={
            track.isGenerated
              ? () => window.open(`/uploads/${track.filePath}`, "_blank")
              : undefined
          }
        />
      ))}
    </div>
  );
}
