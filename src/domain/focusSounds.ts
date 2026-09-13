export const focusSounds = [
  { id: "amber", name: "Amber Glow", description: "Weiches Glockenspiel", instrument: "bell", notes: [523.25, 659.25, 783.99, 1046.5] },
  { id: "tea", name: "Tea Garden", description: "Helles Musikspiel", instrument: "music-box", notes: [587.33, 739.99, 880, 1174.66] },
  { id: "cabin", name: "Cabin Bell", description: "Holzklang und Wärme", instrument: "wood", notes: [440, 554.37, 659.25, 880] },
  { id: "dawn", name: "Soft Dawn", description: "Sanftes E-Piano", instrument: "piano", notes: [392, 493.88, 587.33, 783.99] },
  { id: "lantern", name: "Lantern", description: "Gläserne Laterne", instrument: "glass", notes: [349.23, 440, 523.25, 698.46] },
  { id: "rain", name: "Rain Window", description: "Regentropfen am Fenster", instrument: "rain", notes: [659.25, 783.99, 587.33, 880] },
  { id: "velvet", name: "Velvet Night", description: "Tiefer Samt-Pad", instrument: "pad", notes: [261.63, 329.63, 392, 523.25] },
  { id: "coffee", name: "Coffee Break", description: "Kurzer Café-Pluck", instrument: "pluck", notes: [523.25, 587.33, 659.25, 783.99] },
  { id: "meadow", name: "Meadow", description: "Warme Orgelharmonie", instrument: "organ", notes: [466.16, 587.33, 698.46, 932.33] },
  { id: "moon", name: "Moonlight", description: "Leises Marimba-Holz", instrument: "marimba", notes: [293.66, 369.99, 440, 587.33] },
] as const;
export type FocusSoundId = (typeof focusSounds)[number]["id"];
export type FocusInstrument = (typeof focusSounds)[number]["instrument"];
export const focusSound = (id?: string) => focusSounds.find(sound => sound.id === id) ?? focusSounds[0];
