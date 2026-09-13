export const focusSounds = [
  { id: "amber", name: "Amber Glow", description: "Warme Abendglocken", wave: "sine", notes: [523.25, 659.25, 783.99, 1046.5] },
  { id: "tea", name: "Tea Garden", description: "Leicht und freundlich", wave: "triangle", notes: [587.33, 739.99, 880, 1174.66] },
  { id: "cabin", name: "Cabin Bell", description: "Ruhiges Holzhaus", wave: "sine", notes: [440, 554.37, 659.25, 880] },
  { id: "dawn", name: "Soft Dawn", description: "Sanfter Morgen", wave: "triangle", notes: [392, 493.88, 587.33, 783.99] },
  { id: "lantern", name: "Lantern", description: "Goldener Lichtschein", wave: "sine", notes: [349.23, 440, 523.25, 698.46] },
  { id: "rain", name: "Rain Window", description: "Leise Regentropfen", wave: "sine", notes: [329.63, 392, 493.88, 659.25] },
  { id: "velvet", name: "Velvet Night", description: "Tief und weich", wave: "triangle", notes: [261.63, 329.63, 392, 523.25] },
  { id: "coffee", name: "Coffee Break", description: "Heller Café-Moment", wave: "sine", notes: [523.25, 587.33, 659.25, 783.99] },
  { id: "meadow", name: "Meadow", description: "Helle Wiesenluft", wave: "triangle", notes: [466.16, 587.33, 698.46, 932.33] },
  { id: "moon", name: "Moonlight", description: "Stiller Ausklang", wave: "sine", notes: [293.66, 369.99, 440, 587.33] },
] as const;
export type FocusSoundId = (typeof focusSounds)[number]["id"];
export const focusSound = (id?: string) => focusSounds.find(sound => sound.id === id) ?? focusSounds[0];
