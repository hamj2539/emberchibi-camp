import type { StarterClassId, Stats } from "../game/state.js";

export type StarterClass = {
  id: StarterClassId;
  name: string;
  role: string;
  strengths: string[];
  stats: Stats;
};

export const starterClasses: StarterClass[] = [
  {
    id: "scout",
    name: "Scout",
    role: "Exploration and route safety",
    strengths: ["Routes resolve faster", "High route safety", "Strong Beacon discovery stats"],
    stats: { hp: 24, atk: 4, def: 3, spd: 8, wis: 4, craft: 3, surv: 7, luck: 6 },
  },
  {
    id: "hunter",
    name: "Hunter",
    role: "Combat and food gathering",
    strengths: ["Strong attacks", "+25% expedition Food", "Strong against beasts"],
    stats: { hp: 30, atk: 8, def: 4, spd: 5, wis: 3, craft: 3, surv: 7, luck: 3 },
  },
  {
    id: "herbalist",
    name: "Herbalist",
    role: "Healing and status control",
    strengths: ["Reduces route injuries", "Lowers party fatigue", "Efficient healing stats"],
    stats: { hp: 28, atk: 3, def: 3, spd: 4, wis: 8, craft: 4, surv: 7, luck: 4 },
  },
  {
    id: "tinker",
    name: "Tinker",
    role: "Crafting and repair",
    strengths: ["Faster craft tasks", "Better Beacon repair", "Tool bonuses"],
    stats: { hp: 26, atk: 4, def: 6, spd: 3, wis: 6, craft: 8, surv: 4, luck: 3 },
  },
];

export function getStarterClass(id: StarterClassId): StarterClass {
  const starter = starterClasses.find((item) => item.id === id);
  if (!starter) throw new Error(`Unknown starter class: ${id}`);
  return starter;
}
