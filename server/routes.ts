import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { insertTrackSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { openai } from "./openai";

const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (_req, file, cb) => {
      const uniqueSuffix = nanoid();
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

export function registerRoutes(app: Express): Server {
  app.post("/api/tracks/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        throw new Error("No file uploaded");
      }

      const trackData = {
        name: req.file.originalname,
        filePath: req.file.path,
        duration: "0:00", // TODO: Extract actual duration
        isGenerated: false,
        waveformData: JSON.stringify([]), // TODO: Generate waveform data
      };

      const parsed = insertTrackSchema.parse(trackData);
      const track = await storage.createTrack(parsed);
      res.json(track);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/tracks", async (_req, res) => {
    const tracks = await storage.getAllTracks();
    res.json(tracks);
  });

  app.post("/api/tracks/generate", async (req: Request<{ id: number }>, res) => {
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
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
