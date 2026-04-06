import { useCallback, useRef, useEffect } from "react";

export function useAudioPlayer() {
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on first user interaction if possible, 
    // but we'll try to init it lazily in playBeep
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const playBeep = useCallback((frequency = 800, duration = 0.15) => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Resume context if suspended (browser policy)
    if (audioContext.current.state === "suspended") {
      audioContext.current.resume();
    }

    const ctx = audioContext.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Smooth envelope to avoid clicking
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find Polish voice, fallback to default
    const plVoice = voices.find(v => v.lang.includes('pl') || v.lang.includes('PL'));
    if (plVoice) {
      utterance.voice = plVoice;
    }
    
    utterance.rate = 1.1; // Slightly faster for workout context
    utterance.pitch = 1;
    
    window.speechSynthesis.speak(utterance);
  }, []);

  return { playBeep, speak };
}
