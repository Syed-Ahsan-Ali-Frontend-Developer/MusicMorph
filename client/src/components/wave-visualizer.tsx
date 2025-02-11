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
      backend: "MediaElement", 
      normalize: true,
      pixelRatio: window.devicePixelRatio || 1,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      minPxPerSec: 1,
      mediaControls: true,
      interact: true,
    });

    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

    wavesurfer.current.load(fullUrl);

    wavesurfer.current.on("ready", () => {
      onReady?.();
    });

    wavesurfer.current.on("error", (err) => {
      console.error("WaveSurfer error:", err);
    });

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [url, height, waveColor, progressColor]);

  return <div ref={containerRef} />;
}