import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WaveVisualizer } from "./wave-visualizer";
import { Play, Pause, SkipBack, SkipForward, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { Track } from "@shared/schema";

interface AudioPlayerProps {
  track: Track;
  onDownload?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function AudioPlayer({ track, onDownload, onDelete, isDeleting = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  return (
    <Card className="p-4 bg-background">
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-lg font-semibold text-white">{track.name}</h3>
        {track.isGenerated && (
          <span className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">
            AI Generated
          </span>
        )}
      </div>

      <WaveVisualizer
        url={`/uploads/${track.filePath}`}
        onReady={() => setIsReady(true)}
      />

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            disabled={!isReady}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isDeleting}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            disabled={!isReady}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            disabled={!isReady}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {onDownload && (
          <Button variant="outline" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
      </div>
    </Card>
  );
}