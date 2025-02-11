import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveVisualizerProps {
  url: string;
  onReady?: () => void;
  height?: number;
  waveColor?: string;
  progressColor?: string;
}

export function WaveVisualizer({
  url,
  onReady,
  height = 128,
  waveColor = "#535353",
  progressColor = "#1DB954",
}: WaveVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor,
      progressColor,
      backend: "WebAudio",
      normalize: true,
    });

    wavesurfer.current.load(url);
    wavesurfer.current.on("ready", () => {
      onReady?.();
    });

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [url]);

  return <div ref={containerRef} />;
}
