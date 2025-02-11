import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MusicGenerationResult {
  filePath: string;
  duration: string;
}

export async function generateSimilarMusic(
  sourceAudioPath: string,
): Promise<MusicGenerationResult> {
  try {
    // First, transcribe the source audio to understand its characteristics
    const audioReadStream = fs.createReadStream(sourceAudioPath);
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    // Analyze the musical characteristics
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a music analysis expert. Analyze the transcription and provide key musical characteristics in JSON format.",
        },
        {
          role: "user",
          content: transcription.text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const musicCharacteristics = JSON.parse(analysisResponse.choices[0].message.content);

    // Generate music based on the analysis
    // Note: This is a placeholder for actual music generation
    // In reality, you would use a specialized music generation model
    // For now, we'll create a simple audio file as a demonstration
    const generatedFilePath = path.join("uploads", `generated_${nanoid()}.mp3`);
    
    // Copy the source file as a placeholder
    // In a real implementation, this would be replaced with actual generated music
    fs.copyFileSync(sourceAudioPath, generatedFilePath);

    return {
      filePath: generatedFilePath,
      duration: "3:00", // Placeholder duration
    };
  } catch (error) {
    console.error("Error generating music:", error);
    throw new Error("Failed to generate music: " + error.message);
  }
}

export async function analyzeAudioCharacteristics(audioPath: string) {
  try {
    const audioReadStream = fs.createReadStream(audioPath);
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Analyze the audio transcription and provide musical characteristics including tempo, key, mood, and genre. Respond in JSON format.",
        },
        {
          role: "user",
          content: transcription.text,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing audio:", error);
    throw new Error("Failed to analyze audio: " + error.message);
  }
}

// Helper function to extract audio duration
export async function getAudioDuration(filePath: string): Promise<string> {
  // This would typically use a media processing library
  // For now, return a placeholder
  return "0:00";
}
