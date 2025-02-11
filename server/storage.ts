import { tracks, type Track, type InsertTrack } from "@shared/schema";

export interface IStorage {
  createTrack(track: InsertTrack): Promise<Track>;
  getAllTracks(): Promise<Track[]>;
  getTrack(id: number): Promise<Track | undefined>;
  deleteTrack(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private tracks: Map<number, Track>;
  private currentId: number;

  constructor() {
    this.tracks = new Map();
    this.currentId = 1;
  }

  async createTrack(track: InsertTrack): Promise<Track> {
    const id = this.currentId++;
    const newTrack: Track = {
      ...track,
      id,
      createdAt: new Date(),
    };
    this.tracks.set(id, newTrack);
    return newTrack;
  }

  async getAllTracks(): Promise<Track[]> {
    return Array.from(this.tracks.values());
  }

  async getTrack(id: number): Promise<Track | undefined> {
    return this.tracks.get(id);
  }

  async deleteTrack(id: number): Promise<void> {
    this.tracks.delete(id);
  }
}

export const storage = new MemStorage();
