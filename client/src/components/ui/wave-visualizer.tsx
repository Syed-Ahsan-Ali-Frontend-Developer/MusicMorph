import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveVisualizerProps {
  url: string;
  isPlaying?: boolean;
  onPlayPause?: (playing: boolean) => void;
  onReady?: () => void;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  barWidth?: number;
  barGap?: number;
  responsive?: boolean;
}

export function WaveVisualizer({
  url,
  isPlaying = false,
  onPlayPause,
  onReady,
  height = 80,
  waveColor = "#535353",
  progressColor = "#1DB954",
  barWidth = 2,
  barGap = 1,
  responsive = true,
}: WaveVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor,
      progressColor,
      barWidth,
      barGap,
      barRadius: 2,
      cursorWidth: 0,
      normalize: true,
      minPxPerSec: 1,
      backend: "MediaElement",
      mediaControls: true,
    });

    wavesurfer.current = ws;

    // Ensure the URL is absolute
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

    ws.load(fullUrl);

    ws.on("ready", () => {
      setDuration(ws.getDuration());
      onReady?.();
    });

    ws.on("play", () => onPlayPause?.(true));
    ws.on("pause", () => onPlayPause?.(false));
    ws.on("finish", () => onPlayPause?.(false));

    ws.on("error", (err) => {
      console.error("WaveSurfer error:", err);
    });

    return () => {
      ws.destroy();
    };
  }, [url, height, waveColor, progressColor, barWidth, barGap]);

  // Handle play/pause from props
  useEffect(() => {
    if (!wavesurfer.current) return;

    if (isPlaying) {
      wavesurfer.current.play();
    } else {
      wavesurfer.current.pause();
    }
  }, [isPlaying]);

  return (
    <div className="relative">
      <div 
        ref={containerRef} 
        className="w-full hover:cursor-pointer"
        style={{
          background: "transparent",
          borderRadius: "4px",
        }}
      />
      {duration > 0 && (
        <div className="absolute bottom-0 right-0 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          {formatTime(duration)}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}