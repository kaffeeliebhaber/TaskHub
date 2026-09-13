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
  const chime = async () => {
    try {
      enableAudio();
      const ctx = audio.current;
      if (!ctx) return;
      if (ctx.state !== "running") await ctx.resume();
      const start = ctx.currentTime + 0.05;
      [0, 0.42, 0.84].forEach((delay, index) => {
        const oscillator = ctx.createOscillator(),
          gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.type = "sine";
        oscillator.frequency.value = [523.25, 659.25, 783.99][index];
        const t = start + delay;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.025);
        gain.gain.setValueAtTime(0.2, t + 0.19);
        gain.gain.linearRampToValueAtTime(0, t + 0.31);
        oscillator.start(t);
        oscillator.stop(t + 0.33);
      });
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
      void change((w) => {
        if (w.focus?.id === f.id) changeFocus(w, "complete");
      }).then((ok) => {
        if (ok) void chime();
        else finishing.current = null;
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
    testSound: () => void chime(),
    selectTask: (taskId: string) => {
      if (!active) setSelectedTaskId(taskId);
      setDockOpen(true);
    },
  };
}
