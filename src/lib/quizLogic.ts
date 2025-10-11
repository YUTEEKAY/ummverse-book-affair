import { supabase } from "@/integrations/supabase/client";
import type { QuizAnswers } from "./quizStorage";

export const mapFeelingToMood = (feeling: string): string => {
  const mappings: Record<string, string> = {
    "Passion & Heat": "Spicy & Steamy",
    "Magic & Wonder": "Magical & Enchanting",
    "Comfort & Warmth": "Cozy & Comforting",
    "Epic & Sweeping": "Sweeping & Epic",
  };
  
  return mappings[feeling] || "Spicy & Steamy";
};

export const mapHeatLevelToDb = (heatLevel: string): string => {
  const mappings: Record<string, string> = {
    "Sweet & Wholesome": "sweet",
    "Warm": "warm",
    "Hot": "hot",
    "Scorching": "scorching",
  };
  
  return mappings[heatLevel] || "warm";
};

export const getRecommendationsFromQuiz = async (answers: QuizAnswers) => {
  const mood = mapFeelingToMood(answers.feeling);
  const heatLevel = mapHeatLevelToDb(answers.heatLevel);

  let query = supabase
    .from("books")
    .select("*")
    .eq("mood", mood)
    .limit(9);

  // Add heat level filter if specified
  if (heatLevel) {
    query = query.eq("heat_level", heatLevel);
  }

  // Add trope filter as optional secondary filter
  if (answers.trope) {
    query = query.ilike("trope", `%${answers.trope}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }

  return data || [];
};
