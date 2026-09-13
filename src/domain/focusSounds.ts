export const focusSounds = [
  { id: "amber", name: "Amber Glow", description: "Vier langsame Glocken", instrument: "bell", events: [[0, 523.25], [.52, 659.25], [1.12, 783.99], [1.8, 1046.5]] },
  { id: "tea", name: "Tea Garden", description: "Schnelles Aufwärts-Arpeggio", instrument: "music-box", events: [[0, 587.33], [.18, 739.99], [.36, 880], [.54, 1174.66], [1.15, 880]] },
  { id: "cabin", name: "Cabin Bell", description: "Drei tiefe Holzschläge", instrument: "wood", events: [[0, 440], [.82, 554.37], [1.72, 440]] },
  { id: "dawn", name: "Soft Dawn", description: "Piano mit Antwortton", instrument: "piano", events: [[0, 392], [.38, 493.88], [1.05, 587.33], [1.42, 493.88], [1.9, 783.99]] },
  { id: "lantern", name: "Lantern", description: "Glasakkord und Ausklang", instrument: "glass", events: [[0, 349.23], [0, 440], [.7, 523.25], [1.55, 698.46]] },
  { id: "rain", name: "Rain Window", description: "Verspielte Regentropfen", instrument: "rain", events: [[0, 659.25], [.12, 783.99], [.53, 587.33], [.74, 880], [1.32, 659.25], [1.5, 783.99]] },
  { id: "velvet", name: "Velvet Night", description: "Zwei lange Pad-Akkorde", instrument: "pad", events: [[0, 261.63], [0, 329.63], [1.25, 392], [1.25, 523.25]] },
  { id: "coffee", name: "Coffee Break", description: "Kurzer rhythmischer Pluck", instrument: "pluck", events: [[0, 523.25], [.24, 587.33], [.48, 659.25], [.96, 523.25], [1.2, 783.99]] },
  { id: "meadow", name: "Meadow", description: "Warmer Orgelakkord", instrument: "organ", events: [[0, 466.16], [0, 587.33], [0, 698.46], [1.35, 932.33]] },
  { id: "moon", name: "Moonlight", description: "Ruhige Marimba-Pause", instrument: "marimba", events: [[0, 293.66], [.62, 369.99], [1.45, 440], [2.15, 587.33]] },
] as const;
export type FocusSoundId = (typeof focusSounds)[number]["id"];
export type FocusInstrument = (typeof focusSounds)[number]["instrument"];
export const focusSound = (id?: string) => focusSounds.find(sound => sound.id === id) ?? focusSounds[0];
