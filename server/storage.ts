import { tracks, type Track, type InsertTrack } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createTrack(track: InsertTrack): Promise<Track>;
  getAllTracks(): Promise<Track[]>;
  getTrack(id: number): Promise<Track | undefined>;
  deleteTrack(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createTrack(track: InsertTrack): Promise<Track> {
    const [newTrack] = await db
      .insert(tracks)
      .values(track)
      .returning();
    return newTrack;
  }

  async getAllTracks(): Promise<Track[]> {
    return await db.select().from(tracks);
  }

  async getTrack(id: number): Promise<Track | undefined> {
    const [track] = await db
      .select()
      .from(tracks)
      .where(eq(tracks.id, id));
    return track;
  }

  async deleteTrack(id: number): Promise<void> {
    await db
      .delete(tracks)
      .where(eq(tracks.id, id));
  }
}

export const storage = new DatabaseStorage();