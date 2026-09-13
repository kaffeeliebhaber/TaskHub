import { useEffect, useRef, useState } from "react";
import { changeFocus, focusRemaining } from "../domain/focus";
import type { Workspace } from "../domain/model";
import { focusSound } from "../domain/focusSounds";
export function useFocus(
  workspace: Workspace,
  change: (edit: (w: Workspace) => void) => Promise<boolean>,
  error: string,
) {
  const [now, setNow] = useState(Date.now());
  const [immersive, setImmersive] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const f = workspace.focus;
  const finishing = useRef<string | null>(null);
  const restored = useRef<string | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const enableAudio = () => {
    try {
      if (!audio.current || audio.current.state === "closed")
        audio.current = new AudioContext();
      void audio.current.resume().catch(() => {});
    } catch {
      /* Sound is optional; the timer remains visual. */
    }
  };
  const chime = () => {
    try {
      const ctx = audio.current;
      if (!ctx || ctx.state !== "running") return;
      const sound = focusSound(workspace.focusSound);
      const start = ctx.currentTime + 0.04;
      const level = Math.max(0.001, ((workspace.focusVolume ?? 55) / 100) * 0.65);
      const recipe = {
        bell: { waves: ["sine", "sine"], harmonics: [1, 2.76], decay: 0.95 },
        "music-box": { waves: ["triangle", "sine"], harmonics: [1, 2], decay: 0.62 },
        wood: { waves: ["triangle", "sine"], harmonics: [1, 0.5], decay: 0.42 },
        piano: { waves: ["triangle", "sine", "sine"], harmonics: [1, 2, 3], decay: 0.78 },
        glass: { waves: ["sine", "sine"], harmonics: [1, 3.01], decay: 1.2 },
        rain: { waves: ["sine", "triangle"], harmonics: [1, 1.5], decay: 0.36 },
        pad: { waves: ["sine", "sine"], harmonics: [1, 1.005], decay: 1.35 },
        pluck: { waves: ["triangle", "square"], harmonics: [1, 2], decay: 0.3 },
        organ: { waves: ["sine", "sine", "sine"], harmonics: [1, 2, 3], decay: 1.05 },
        marimba: { waves: ["triangle", "sine"], harmonics: [1, 3.5], decay: 0.5 },
      } as const;
      const instrument = recipe[sound.instrument];
      const pulse = (offset: number, frequency: number) => {
        const at = start + offset;
        instrument.harmonics.forEach((harmonic, index) => {
          const oscillator = ctx.createOscillator(), gain = ctx.createGain();
          oscillator.type = instrument.waves[index] as OscillatorType;
          oscillator.frequency.setValueAtTime(frequency * harmonic, at);
          oscillator.connect(gain); gain.connect(ctx.destination);
          const partialLevel = level / instrument.harmonics.length * (index === 0 ? 1 : 0.42);
          gain.gain.setValueAtTime(0.001, at);
          gain.gain.exponentialRampToValueAtTime(partialLevel, at + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, at + instrument.decay);
          oscillator.start(at); oscillator.stop(at + instrument.decay + 0.04);
        });
      };
      sound.notes.forEach((note, index) => pulse(index * 0.5, note));
    } catch {
      /* Optional audio must not interrupt completion. */
    }
  };
  useEffect(() => {
    const unlock = () => enableAudio();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  useEffect(() => {
    if (f && restored.current !== f.id) {
      restored.current = f.id;
      if (f.status === "running" || f.status === "paused") setImmersive(true);
    }
  }, [f?.id]);
  const remaining = f ? focusRemaining(f, now) : 0;
  useEffect(() => {
    if (
      f?.status === "running" &&
      remaining === 0 &&
      !error &&
      finishing.current !== f.id
    ) {
      finishing.current = f.id;
      chime();
      void change((w) => {
        if (w.focus?.id === f.id) changeFocus(w, "complete");
      }).then((ok) => {
        if (!ok) finishing.current = null;
      });
    }
  }, [f?.id, f?.status, remaining, error, change]);
  useEffect(() => {
    if (selectedTaskId && !workspace.tasks.some((t) => t.id === selectedTaskId))
      setSelectedTaskId(null);
  }, [workspace.tasks, selectedTaskId]);
  const active = !!f && ["running", "paused"].includes(f.status);
  return {
    now,
    remaining,
    immersive,
    setImmersive,
    dockOpen,
    setDockOpen,
    selectedTaskId,
    setSelectedTaskId,
    active,
    enableAudio,
    testSound: () => { enableAudio(); window.setTimeout(chime, 160); },
    selectTask: (taskId: string) => {
      if (!active) setSelectedTaskId(taskId);
      setDockOpen(true);
    },
  };
}
