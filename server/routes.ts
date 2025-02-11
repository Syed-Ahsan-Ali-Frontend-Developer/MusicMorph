import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { insertTrackSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { generateSimilarMusic } from "./openai";
import express from "express";
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
        return res.status(400).json({ message: "No file uploaded" });
      }

      const trackData = {
        name: req.file.originalname,
        filePath: req.file.filename,
        duration: "0:00", // TODO: Extract actual duration
        isGenerated: false,
        waveformData: null,
      };

      const parsed = insertTrackSchema.parse(trackData);
      const track = await storage.createTrack(parsed);
      res.json(track);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload file";
      res.status(400).json({ message });
    }
  });

  app.get("/api/tracks", async (_req, res) => {
    try {
      const tracks = await storage.getAllTracks();
      res.json(tracks);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch tracks";
      res.status(500).json({ message });
    }
  });

  app.post("/api/tracks/generate", async (req: Request<never, never, { id: number }>, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          message: "OpenAI API key not configured. Please configure the API key to use music generation." 
        });
      }

      const sourceTrack = await storage.getTrack(req.body.id);
      if (!sourceTrack) {
        return res.status(404).json({ message: "Source track not found" });
      }

      const sourceFilePath = path.join("uploads", sourceTrack.filePath);
      if (!fs.existsSync(sourceFilePath)) {
        return res.status(404).json({ message: "Source audio file not found" });
      }

      // Generate similar music using OpenAI
      try {
        const generatedMusic = await generateSimilarMusic(sourceFilePath);

        const generatedTrackData = {
          name: `AI Generated - ${sourceTrack.name}`,
          filePath: path.basename(generatedMusic.filePath),
          duration: generatedMusic.duration,
          isGenerated: true,
          waveformData: null,
        };

        const parsed = insertTrackSchema.parse(generatedTrackData);
        const track = await storage.createTrack(parsed);
        res.json(track);
      } catch (error) {
        console.error('Music generation error:', error);
        return res.status(500).json({ 
          message: "Failed to generate music. Please try again later or contact support if the issue persists." 
        });
      }
    } catch (error) {
      console.error('Track generation error:', error);
      const message = error instanceof Error ? error.message : "Failed to generate track";
      res.status(500).json({ message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}