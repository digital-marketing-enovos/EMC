import { C } from "./theme";

export type Axis = "X" | "Y";
export type Raw = -3 | -1 | 1 | 3;
export type Kind = "today" | "target";

export type Item = {
  id: number;
  axis: Axis;
  theme: string;
  /** The HIGH pole is rendered on the LEFT (anti position-bias). */
  flip: boolean;
  stem: string;
  /** Low pole of the axis — X: collectivism · Y: integration */
  low: string;
  /** High pole of the axis — X: individualism · Y: fragmentation */
  high: string;
};

export const ITEMS: Item[] = [
  // ── AXIS X — Collectivism ↔ Individualism
  {
    id: 1,
    axis: "X",
    theme: "Recognition",
    flip: true,
    stem: "An important project has just landed. In our internal communications, we choose to…",
    low: "Credit all the teams that contributed, without naming anyone.",
    high: "Name the two or three people who made the difference.",
  },
  {
    id: 2,
    axis: "X",
    theme: "Our time",
    flip: false,
    stem: "Over the next twelve months, our time as managers goes first to…",
    low: "Raising the average level across the whole organisation.",
    high: "Personally coaching a handful of key people.",
  },
  {
    id: 3,
    axis: "X",
    theme: "Decision",
    flip: false,
    stem: "On a topic that spans several BUs/Departments, the decision is made…",
    low: "By a collective arbitration where everyone had a say.",
    high: "By the person mandated on the topic, deciding alone.",
  },
  {
    id: 4,
    axis: "X",
    theme: "Succession",
    flip: true,
    stem: "A key role opens up in our team. We give it to…",
    low: "Someone from the house who has been waiting a long time for this step.",
    high: "The best profile on the market, even if it blocks an internal path.",
  },
  {
    id: 5,
    axis: "X",
    theme: "Dependency",
    flip: false,
    stem: "Our important projects move forward mainly because a few people carry them on their shoulders. We…",
    low: "Hand the next ones to others, even at the cost of speed and reliability.",
    high: "Keep relying on them: they are the ones who get things done.",
  },
  {
    id: 6,
    axis: "X",
    theme: "Maverick",
    flip: true,
    stem: "Someone delivers excellent results working their own way, with no regard for what the rest of the team does. We…",
    low: "Ask them to work like everyone else, even if we lose performance.",
    high: "Let them be: the results speak for themselves.",
  },

  // ── AXIS Y — Integration ↔ Fragmentation
  {
    id: 7,
    axis: "Y",
    theme: "Rollout",
    flip: false,
    stem: "A practice proves itself in one BU. We…",
    low: "Roll it out everywhere identically, including where it fits poorly.",
    high: "Let each BU adapt it, even if nothing common is left.",
  },
  {
    id: 8,
    axis: "Y",
    theme: "Pace",
    flip: true,
    stem: "An important project is ready to start, but two BUs are not ready yet. We…",
    low: "Wait until they are, even if it costs us several months.",
    high: "Start without them, even if it locks in two speeds.",
  },
  {
    id: 9,
    axis: "Y",
    theme: "Structure",
    flip: false,
    stem: "When our priorities change, our organisation…",
    low: "Stays stable, even if the structures no longer fit the stakes.",
    high: "Reshapes itself, even if everyone has to find their place again.",
  },
  {
    id: 10,
    axis: "Y",
    theme: "Right to fail",
    flip: true,
    stem: "A misjudgement on a project cost us dearly. Afterwards, we…",
    low: "Tighten controls for everyone, even if it slows every project down.",
    high: "Handle it with the team involved, and change nothing else.",
  },
  {
    id: 11,
    axis: "Y",
    theme: "Investment",
    flip: false,
    stem: "At equal budget and capacity, we fund…",
    low: "One programme, carried through to the end, giving up on exploring anything else.",
    high: "Several parallel tracks, knowing some will not pan out.",
  },
  {
    id: 12,
    axis: "Y",
    theme: "Mobility",
    flip: true,
    stem: "One of our best people has the opportunity to move to another BU. We…",
    low: "Make the move happen, even if their current team suffers lastingly.",
    high: "Keep them where they are: that is where they create most value today.",
  },
];

/**
 * Rendering order only — never affects scoring.
 * Interleaved so the two axes are not perceptible as consecutive runs.
 * Change the order here and nowhere else.
 */
export const DISPLAY_ORDER = [1, 7, 2, 8, 3, 9, 4, 10, 5, 11, 6, 12];

export const ORDERED_ITEMS: Item[] = DISPLAY_ORDER.map((id) => {
  const item = ITEMS.find((i) => i.id === id);
  if (!item) throw new Error(`DISPLAY_ORDER references unknown item ${id}`);
  return item;
});

export const SCALE: { v: Raw; label: string }[] = [
  { v: -3, label: "◀ Strongly" },
  { v: -1, label: "◀ Somewhat" },
  { v: 1, label: "Somewhat ▶" },
  { v: 3, label: "Strongly ▶" },
];

export const RAW_VALUES: Raw[] = [-3, -1, 1, 3];

export type ZoneKey = "water" | "fire" | "earth" | "air";

export const WORLDS: Record<
  ZoneKey,
  {
    emoji: string;
    name: string;
    tagline: string;
    sub: string;
    color: string;
    axes: string;
    desc: string;
  }
> = {
  water: {
    emoji: "💧",
    name: "Water",
    tagline: "The world that nurtures and connects",
    sub: "Humans Come First",
    color: C.water,
    axes: "Collectivism · Fragmentation",
    desc: "A culture built on collective meaning, solidarity and agile structures. Enovos as a community first, an institution second.",
  },
  fire: {
    emoji: "🔥",
    name: "Fire",
    tagline: "The world that burns the rules",
    sub: "Innovation Rules",
    color: C.fire,
    axes: "Individualism · Fragmentation",
    desc: "A culture of individual autonomy in a lightly constrained environment. Expertise, initiative and fast experimentation drive it.",
  },
  earth: {
    emoji: "🌍",
    name: "Earth",
    tagline: "The world that anchors and protects",
    sub: "Companies Care",
    color: C.earth,
    axes: "Collectivism · Integration",
    desc: "A culture combining collective responsibility with institutional solidity. Enovos as a trusted actor with lasting impact.",
  },
  air: {
    emoji: "💨",
    name: "Air",
    tagline: "The world that is invisible yet everywhere",
    sub: "Corporate is King",
    color: C.air,
    axes: "Individualism · Integration",
    desc: "A culture of individual performance inside a strong, structured organisation. Excellence and institutional strength drive it.",
  },
};

/** √(4² + 4²) — the longest possible change vector on a 1–5 × 1–5 grid. */
export const MAX_VECTOR = Math.hypot(4, 4);
