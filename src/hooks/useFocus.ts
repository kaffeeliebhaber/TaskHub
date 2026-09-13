import { useEffect, useRef, useState } from "react";
import { changeFocus, focusRemaining } from "../domain/focus";
import type { Workspace } from "../domain/model";
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
      // A single oscillator with several gain pulses is more reliable than
      // several short-lived nodes when the timer finishes in the background.
      const oscillator = ctx.createOscillator(), gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.connect(gain); gain.connect(ctx.destination);
      const start = ctx.currentTime + 0.04;
      const level = Math.max(0.001, ((workspace.focusVolume ?? 55) / 100) * 0.65);
      const pulse = (offset: number, frequency: number) => {
        const at = start + offset;
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0.001, at);
        gain.gain.exponentialRampToValueAtTime(level, at + 0.035);
        gain.gain.setValueAtTime(level, at + 0.28);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.43);
      };
      pulse(0, 523.25); pulse(0.48, 659.25); pulse(0.96, 659.25); pulse(1.44, 783.99); pulse(1.92, 659.25);
      oscillator.start(start); oscillator.stop(start + 2.4);
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
