import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import OnboardingResults from "./OnboardingResults";
import { saveOnboardingData, type QuizAnswers } from "@/lib/quizStorage";
import { mapFeelingToMood } from "@/lib/quizLogic";

interface OnboardingQuizProps {
  open: boolean;
  onClose: () => void;
}

const OnboardingQuiz = ({ open, onClose }: OnboardingQuizProps) => {
  const [step, setStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswers>({
    feeling: "",
    trope: "",
    heatLevel: "",
  });

  const totalSteps = 3;

  const feelings = [
    { value: "Passion & Heat", emoji: "🔥", label: "Passion & Heat" },
    { value: "Magic & Wonder", emoji: "✨", label: "Magic & Wonder" },
    { value: "Comfort & Warmth", emoji: "🫖", label: "Comfort & Warmth" },
    { value: "Epic & Sweeping", emoji: "🌹", label: "Epic & Sweeping" },
  ];

  const tropes = [
    { value: "Enemies to Lovers", emoji: "💔", label: "Enemies to Lovers" },
    { value: "Second Chance", emoji: "💌", label: "Second Chance Romance" },
    { value: "Fantasy Royalty", emoji: "👑", label: "Fantasy Royalty" },
    { value: "Warrior Romance", emoji: "⚔️", label: "Warrior Romance" },
  ];

  const heatLevels = [
    { value: "Sweet & Wholesome", emoji: "❄️", label: "Sweet & Wholesome", desc: "Fade to black" },
    { value: "Warm", emoji: "🌡️", label: "Warm", desc: "Closed door, tension" },
    { value: "Hot", emoji: "🔥", label: "Hot", desc: "Open door, steamy" },
    { value: "Scorching", emoji: "🌶️", label: "Scorching", desc: "Explicit, no limits" },
  ];

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Submit quiz
      const recommendedMood = mapFeelingToMood(answers.feeling);
      saveOnboardingData(answers, recommendedMood);
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    saveOnboardingData({ feeling: "", trope: "", heatLevel: "" }, "");
    onClose();
  };

  const handleRetake = () => {
    setStep(1);
    setShowResults(false);
    setAnswers({ feeling: "", trope: "", heatLevel: "" });
  };

  const canProceed = () => {
    if (step === 1) return answers.feeling !== "";
    if (step === 2) return answers.trope !== "";
    if (step === 3) return answers.heatLevel !== "";
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blush/30 via-cream/30 to-dusty-rose/30 backdrop-blur-lg border-2 border-white/20">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 pt-4"
            >
              {/* Progress Indicator */}
              <div className="flex gap-2 justify-center">
                {[...Array(totalSteps)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-12 rounded-full transition-all ${
                      i + 1 <= step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Question 1: Feeling */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold">
                      What feeling do you crave from your next romance?
                    </h2>
                    <p className="text-muted-foreground">Choose the vibe that speaks to your heart</p>
                  </div>

                  <RadioGroup
                    value={answers.feeling}
                    onValueChange={(value) => {
                      setAnswers({ ...answers, feeling: value });
                      setTimeout(() => handleNext(), 300);
                    }}
                    className="grid grid-cols-2 gap-4"
                  >
                    {feelings.map((feeling) => (
                      <Label
                        key={feeling.value}
                        htmlFor={feeling.value}
                        className="cursor-pointer"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative flex flex-col items-center justify-center p-6 h-32 rounded-lg border-2 transition-all ${
                            answers.feeling === feeling.value
                              ? "border-primary border-3 bg-gradient-to-br from-primary/20 to-primary/10 shadow-xl shadow-primary/20 scale-105"
                              : "border-border hover:border-primary/50 hover:bg-accent/50"
                          }`}
                        >
                          <RadioGroupItem
                            value={feeling.value}
                            id={feeling.value}
                            className="sr-only"
                          />
                          {answers.feeling === feeling.value && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <span className="text-4xl mb-2">{feeling.emoji}</span>
                          <span className="font-semibold text-center">{feeling.label}</span>
                        </motion.div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Question 2: Trope */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold">
                      Pick the trope that makes your heart race:
                    </h2>
                    <p className="text-muted-foreground">Your favorite story pattern</p>
                  </div>

                  <RadioGroup
                    value={answers.trope}
                    onValueChange={(value) => {
                      setAnswers({ ...answers, trope: value });
                      setTimeout(() => handleNext(), 300);
                    }}
                    className="grid grid-cols-2 gap-4"
                  >
                    {tropes.map((trope) => (
                      <Label key={trope.value} htmlFor={trope.value} className="cursor-pointer">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative flex flex-col items-center justify-center p-6 h-32 rounded-lg border-2 transition-all ${
                            answers.trope === trope.value
                              ? "border-primary border-3 bg-gradient-to-br from-primary/20 to-primary/10 shadow-xl shadow-primary/20 scale-105"
                              : "border-border hover:border-primary/50 hover:bg-accent/50"
                          }`}
                        >
                          <RadioGroupItem
                            value={trope.value}
                            id={trope.value}
                            className="sr-only"
                          />
                          {answers.trope === trope.value && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <span className="text-4xl mb-2">{trope.emoji}</span>
                          <span className="font-semibold text-center">{trope.label}</span>
                        </motion.div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Question 3: Heat Level */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold">
                      How spicy do you like it?
                    </h2>
                    <p className="text-muted-foreground">Set your comfort level</p>
                  </div>

                  <RadioGroup
                    value={answers.heatLevel}
                    onValueChange={(value) => {
                      setAnswers({ ...answers, heatLevel: value });
                      setTimeout(() => handleNext(), 300);
                    }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    {heatLevels.map((level) => (
                      <Label key={level.value} htmlFor={level.value} className="cursor-pointer">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative flex flex-col items-center justify-center p-4 h-32 rounded-lg border-2 transition-all ${
                            answers.heatLevel === level.value
                              ? "border-primary border-3 bg-gradient-to-br from-primary/20 to-primary/10 shadow-xl shadow-primary/20 scale-105"
                              : "border-border hover:border-primary/50 hover:bg-accent/50"
                          }`}
                        >
                          <RadioGroupItem
                            value={level.value}
                            id={level.value}
                            className="sr-only"
                          />
                          {answers.heatLevel === level.value && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <span className="text-3xl mb-1">{level.emoji}</span>
                          <span className="font-semibold text-center text-sm">{level.label}</span>
                          <span className="text-xs text-muted-foreground text-center mt-1">
                            {level.desc}
                          </span>
                        </motion.div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 justify-between pt-4">
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  disabled={step === 1}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                <Button onClick={handleSkip} variant="ghost">
                  Skip for now
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  size="lg"
                  className="gap-2"
                >
                  {step === totalSteps ? "Show Results" : "Next"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <OnboardingResults
              answers={answers}
              onRetake={handleRetake}
              onClose={onClose}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingQuiz;
