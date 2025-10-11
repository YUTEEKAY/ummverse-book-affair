export interface QuizAnswers {
  feeling: string;
  trope: string;
  heatLevel: string;
}

export interface OnboardingData {
  completed: boolean;
  completedAt: string;
  answers: QuizAnswers;
  recommendedMood: string;
}

const STORAGE_KEY = 'ummverse_onboarding';

export const saveOnboardingData = (answers: QuizAnswers, recommendedMood: string) => {
  const data: OnboardingData = {
    completed: true,
    completedAt: new Date().toISOString(),
    answers,
    recommendedMood,
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getOnboardingData = (): OnboardingData | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const hasCompletedOnboarding = (): boolean => {
  const data = getOnboardingData();
  return data?.completed || false;
};

export const clearOnboardingData = () => {
  localStorage.removeItem(STORAGE_KEY);
};
