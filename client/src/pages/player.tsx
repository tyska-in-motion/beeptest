import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { useSequence } from "@/hooks/use-sequences";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RefreshCw, X, Volume2, SkipForward } from "lucide-react";
import { Step } from "@shared/schema";

export default function Player() {
  const [, params] = useRoute("/player/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { data: sequence, isLoading } = useSequence(id);
  const { playBeep, speak } = useAudioPlayer();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const steps = (sequence?.steps || []) as Step[];
  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];

  // Initialize first step
  useEffect(() => {
    if (sequence && !isPlaying && timeLeft === 0 && !isFinished) {
      setTimeLeft(steps[0]?.duration || 0);
    }
  }, [sequence, isPlaying, timeLeft, isFinished]);

  // Handle timer tick
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const interval = 100; // 100ms for 0.1s precision
      timerRef.current = window.setTimeout(() => {
        setTimeLeft((prev) => Math.max(0, Math.round((prev - 0.1) * 10) / 10));
      }, interval);
    } else if (isPlaying && timeLeft === 0) {
      handleStepComplete();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, timeLeft]);

  // Audio cues logic
  useEffect(() => {
    if (!isPlaying) return;

    // Play start sound for step
    if (timeLeft === currentStep?.duration) {
      playBeep(1200, 0.2);
      speak(currentStep.label);
    }

  }, [timeLeft, isPlaying, currentStep, playBeep, speak]);

  const handleStepComplete = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTimeLeft(steps[nextIndex].duration);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = () => {
    setIsPlaying(false);
    setIsFinished(true);
    playBeep(1500, 0.4);
    speak("Trening zakończony. Dobra robota!");
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const resetWorkout = () => {
    setIsPlaying(false);
    setIsFinished(false);
    setCurrentStepIndex(0);
    setTimeLeft(steps[0]?.duration || 0);
  };

  const skipStep = () => {
    handleStepComplete();
  };

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-primary animate-pulse">Ładowanie...</div>;
  if (!sequence) return <div className="min-h-screen flex items-center justify-center text-white">Nie znaleziono treningu</div>;

  const progress = currentStep ? ((currentStep.duration - timeLeft) / currentStep.duration) * 100 : 0;
  const totalSteps = steps.length;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Background Pulse Effect on Beat */}
      <AnimatePresence>
        {isPlaying && timeLeft <= 3 && timeLeft > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20">
        <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <X className="w-6 h-6" />
        </Link>
        <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-primary">
          {sequence.name}
        </div>
        <div className="p-2 text-white/50">
          <Volume2 className="w-6 h-6" />
        </div>
      </div>

      {isFinished ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center space-y-8">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mb-4"
          >
            <RefreshCw className="w-16 h-16 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold font-display text-primary">TRENING ZAKOŃCZONY!</h1>
          <p className="text-xl text-muted-foreground">Świetna robota, tak trzymaj.</p>
          <div className="flex gap-4 w-full max-w-sm">
            <button onClick={resetWorkout} className="flex-1 py-4 bg-secondary rounded-xl font-bold text-lg hover:bg-secondary/80 transition-colors">
              Powtórz
            </button>
            <Link href="/" className="flex-1 flex items-center justify-center py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors">
              Zakończ
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center z-10 p-4 w-full max-w-md mx-auto">
          
          {/* Main Timer Display */}
          <div className="w-full aspect-square relative flex items-center justify-center">
            {/* Progress Circle SVG */}
            <svg className="w-full h-full -rotate-90 absolute inset-0">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                className="stroke-secondary/20 fill-none"
                strokeWidth="8"
              />
              <motion.circle
                cx="50%"
                cy="50%"
                r="45%"
                className="stroke-primary fill-none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="283%" // approximation of 2*pi*r where r=45%
                initial={{ strokeDashoffset: "283%" }}
                animate={{ strokeDashoffset: `${283 - (progress * 2.83)}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </svg>

            <div className="text-center space-y-2 relative z-10">
              <motion.div
                key={currentStep?.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl sm:text-4xl font-bold text-white/90 font-display uppercase tracking-wider"
              >
                {currentStep?.label}
              </motion.div>
              
              <div className="text-[8rem] leading-none font-timer font-bold tracking-tighter tabular-nums text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {timeLeft.toFixed(1)}
              </div>
              
              <div className="text-sm font-medium text-white/50 uppercase tracking-widest">
                KROK {currentStepIndex + 1} / {totalSteps}
              </div>
            </div>
          </div>

          {/* Next Step Preview */}
          <div className="w-full h-16 mb-8 flex items-center justify-center">
            {nextStep && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl px-6 py-3 flex items-center gap-3 border border-white/5"
              >
                <span className="text-xs uppercase text-white/40 font-bold">Następnie:</span>
                <span className="font-bold text-white/80">{nextStep.label}</span>
                <span className="text-primary font-timer font-bold">{nextStep.duration}s</span>
              </motion.div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 mb-8">
            <button 
              onClick={resetWorkout}
              className="p-4 rounded-full bg-secondary/30 text-white hover:bg-secondary/50 transition-all active:scale-95"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
            
            <button 
              onClick={togglePlay}
              className={`p-8 rounded-full transition-all duration-200 shadow-2xl active:scale-95 ${
                isPlaying 
                  ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/30 text-white" 
                  : "bg-primary hover:bg-primary/90 shadow-primary/30 text-primary-foreground"
              }`}
            >
              {isPlaying ? (
                <Pause className="w-10 h-10 fill-current" />
              ) : (
                <Play className="w-10 h-10 fill-current translate-x-1" />
              )}
            </button>
            
            <button 
              onClick={skipStep}
              className="p-4 rounded-full bg-secondary/30 text-white hover:bg-secondary/50 transition-all active:scale-95"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
