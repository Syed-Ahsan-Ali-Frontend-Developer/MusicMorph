import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { insertTrackSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { openai } from "./openai";
import express from "express"; //Import express

// Create uploads directory if it doesn't exist
import fs from "fs";
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (_req: Express.Request, file: Express.Multer.File, cb) => {
      const uniqueSuffix = nanoid();
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only MP3, WAV, and OGG files are allowed."));
    }
  },
});

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export function registerRoutes(app: Express): Server {
  // Serve static files from uploads directory
  app.use("/uploads", express.static("uploads", {
    setHeaders: (res, filePath) => {
      // Set proper MIME types for audio files
      if (filePath.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
      } else if (filePath.endsWith('.wav')) {
        res.setHeader('Content-Type', 'audio/wav');
      } else if (filePath.endsWith('.ogg')) {
        res.setHeader('Content-Type', 'audio/ogg');
      }
    }
  }));

  app.post("/api/tracks/upload", upload.single("file"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const trackData = {
        name: req.file.originalname,
        filePath: req.file.filename,
        duration: "0:00", // TODO: Extract actual duration
        isGenerated: false,
        waveformData: null, // Removed unnecessary JSON.stringify([])
      };

      const parsed = insertTrackSchema.parse(trackData);
      const track = await storage.createTrack(parsed);
      res.json(track);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload file";
      res.status(400).json({ error: message });
    }
  });

  app.get("/api/tracks", async (_req, res) => {
    try {
      const tracks = await storage.getAllTracks();
      res.json(tracks);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch tracks";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/tracks/generate", async (req: Request<never, never, { id: number }>, res) => {
    try {
      const sourceTrack = await storage.getTrack(req.body.id);
      if (!sourceTrack) {
        return res.status(404).json({ error: "Source track not found" });
      }

      // TODO: Implement actual music generation with OpenAI
      const generatedTrackData = {
        name: `AI Generated - ${sourceTrack.name}`,
        filePath: sourceTrack.filePath, // Temporary, should be replaced with generated file
        duration: sourceTrack.duration,
        isGenerated: true,
        waveformData: sourceTrack.waveformData,
      };

      const parsed = insertTrackSchema.parse(generatedTrackData);
      const track = await storage.createTrack(parsed);
      res.json(track);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate track";
      res.status(500).json({ error: message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}