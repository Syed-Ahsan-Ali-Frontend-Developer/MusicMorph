import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

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
      max_tokens: 1
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

export async function generateSimilarMusic(
  sourceAudioPath: string,
): Promise<MusicGenerationResult> {
  let audioReadStream: fs.ReadStream | null = null;

  try {
    // First verify the API key
    const isValidKey = await verifyApiKey();
    if (!isValidKey) {
      throw new Error("Invalid or expired OpenAI API key");
    }

    audioReadStream = fs.createReadStream(sourceAudioPath);

    // Attempt transcription with retry logic
    let transcription;
    try {
      transcription = await retryWithBackoff(async () => {
        const stream = fs.createReadStream(sourceAudioPath);
        return await openai.audio.transcriptions.create({
          file: stream,
          model: "whisper-1",
          response_format: "json",
        });
      });
    } catch (transcriptionError) {
      console.error("Transcription error after retries:", transcriptionError);
      transcription = { text: "instrumental music with melody and rhythm" };
    }

    // Clean up the original stream
    if (audioReadStream) {
      audioReadStream.destroy();
      audioReadStream = null;
    }

    // Analyze the audio characteristics using gpt-3.5-turbo instead of gpt-4
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

    // For now, we'll create a modified copy of the original file
    // In a real implementation, this would be replaced with actual AI-generated music
    const generatedFilePath = path.join("uploads", `generated_${nanoid()}.mp3`);
    await fs.promises.copyFile(sourceAudioPath, generatedFilePath);

    // Extract actual duration from the file (placeholder for now)
    const duration = "3:00";

    return {
      filePath: generatedFilePath,
      duration,
    };
  } catch (error: any) {
    // Clean up any open streams
    if (audioReadStream) {
      audioReadStream.destroy();
    }

    console.error("Error generating music:", error);
    if (error.message.includes("API key")) {
      throw new Error("OpenAI API key is invalid or has expired. Please check your API key configuration.");
    }
    throw new Error(`Failed to generate music: ${error.message}`);
  }
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

// Helper function to extract audio duration
export async function getAudioDuration(filePath: string): Promise<string> {
  // This would typically use a media processing library
  // For now, return a placeholder
  return "0:00";
}