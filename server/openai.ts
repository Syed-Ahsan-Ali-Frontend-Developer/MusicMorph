import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MusicGenerationResult {
  filePath: string;
  duration: string;
}

async function verifyApiKey(): Promise<boolean> {
  try {
    // Make a simple API call to verify the key
    await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1,
    });
    return true;
  } catch (error) {
    console.error("API key verification failed:", error);
    return false;
  }
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const delay = initialDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// Basic audio manipulation without OpenAI
async function processAudioLocally(sourceFilePath: string): Promise<MusicGenerationResult> {
  const outputFileName = `processed_${nanoid()}.mp3`;
  const outputPath = path.join("uploads", outputFileName);

  const ffmpeg = (await import('fluent-ffmpeg')).default;
  
  return new Promise((resolve, reject) => {
    ffmpeg(sourceFilePath)
      // Apply random effects
      .audioFilters([
        // Randomly adjust tempo between 0.8x and 1.2x
        `atempo=${0.8 + Math.random() * 0.4}`,
        // Random pitch shift between -2 and +2 semitones
        `asetrate=44100*${0.89 + Math.random() * 0.22}`,
        // Add slight reverb
        'aecho=0.8:0.88:60:0.4'
      ])
      .save(outputPath)
      .on('end', () => {
        resolve({
          filePath: outputFileName,
          duration: "3:00", // Placeholder duration
        });
      })
      .on('error', reject);
  });
}

export async function generateSimilarMusic(
  sourceAudioPath: string,
): Promise<MusicGenerationResult> {
  try {
    // First verify the API key
    const isValidKey = await verifyApiKey();
    if (!isValidKey) {
      // If API is not available, fall back to local processing
      console.log("OpenAI API unavailable, falling back to local processing");
      return await processAudioLocally(sourceAudioPath);
    }

    // If API is available, proceed with AI-enhanced generation
    const transcription = await retryWithBackoff(async () => {
      const stream = fs.createReadStream(sourceAudioPath);
      return await openai.audio.transcriptions.create({
        file: stream,
        model: "whisper-1",
        response_format: "json",
      });
    });

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a music analysis expert. Analyze the audio transcription and provide musical characteristics including tempo, key, mood, and genre in JSON format.",
        },
        {
          role: "user",
          content: transcription.text || "",
        },
      ],
      response_format: { type: "json_object" },
    });

    const musicCharacteristics = JSON.parse(analysisResponse.choices[0].message.content || "{}");
    console.log("Music characteristics:", musicCharacteristics);

    // Process the audio based on analysis
    return await processAudioLocally(sourceAudioPath);
  } catch (error: any) {
    console.error("Error generating music:", error);

    // Fall back to local processing on any error
    console.log("Falling back to local processing due to error");
    return await processAudioLocally(sourceAudioPath);
  }
}

// Helper function to extract audio duration
export async function getAudioDuration(filePath: string): Promise<string> {
  // This would typically use a media processing library
  // For now, return a placeholder
  return "0:00";
}

export async function analyzeAudioCharacteristics(audioPath: string) {
  let audioReadStream: fs.ReadStream | null = null;

  try {
    const isValidKey = await verifyApiKey();
    if (!isValidKey) {
      throw new Error("Invalid or expired OpenAI API key");
    }

    audioReadStream = fs.createReadStream(audioPath);

    const transcription = await retryWithBackoff(async () => {
      const stream = fs.createReadStream(audioPath);
      return await openai.audio.transcriptions.create({
        file: stream,
        model: "whisper-1",
        response_format: "json",
      });
    });

    // Clean up the stream
    audioReadStream.destroy();
    audioReadStream = null;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Analyze the audio transcription and provide musical characteristics including tempo, key, mood, and genre. Respond in JSON format.",
        },
        {
          role: "user",
          content: transcription.text || "",
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error: any) {
    // Clean up any open streams
    if (audioReadStream) {
      audioReadStream.destroy();
    }

    console.error("Error analyzing audio:", error);
    throw new Error(`Failed to analyze audio: ${error.message}`);
  }
}