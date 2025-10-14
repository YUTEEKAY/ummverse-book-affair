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

  // Attempt 1: Try all filters (mood + heat_level + trope)
  let query = supabase
    .from("books")
    .select("*")
    .eq("mood", mood)
    .eq("heat_level", heatLevel);
  
  if (answers.trope) {
    query = query.ilike("trope", `%${answers.trope}%`);
  }
  
  let { data, error } = await query.limit(9);

  // Attempt 2: If no results, try without trope filter
  if (!error && (!data || data.length === 0) && answers.trope) {
    console.log("No matches with trope, trying mood + heat level only...");
    const result = await supabase
      .from("books")
      .select("*")
      .eq("mood", mood)
      .eq("heat_level", heatLevel)
      .limit(9);
    
    data = result.data;
    error = result.error;
  }

  // Attempt 3: If still no results, try mood only
  if (!error && (!data || data.length === 0)) {
    console.log("No matches with heat level, trying mood only...");
    const result = await supabase
      .from("books")
      .select("*")
      .eq("mood", mood)
      .limit(9);
    
    data = result.data;
    error = result.error;
  }

  // Attempt 4: Last resort - return any books
  if (!error && (!data || data.length === 0)) {
    console.log("No matches with mood, returning random books...");
    const result = await supabase
      .from("books")
      .select("*")
      .limit(9);
    
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }

  console.log(`Found ${data?.length || 0} recommendations`);
  return data || [];
};
