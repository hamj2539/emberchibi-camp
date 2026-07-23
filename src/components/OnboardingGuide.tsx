import type { Dispatch } from "react";
import type { GameAction, GameState } from "../game/state";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

const steps = [
  {
    title: "Keep the camp working",
    detail: "Assign Rest to recover, Forage for supplies, Guard for safer routes, and Craft or Cook when you need tools.",
    cue: "Start with one survivor Foraging, then change jobs as pressure rises.",
  },
  {
    title: "Explore with a plan",
    detail: "Route forecasts show duration, danger, modifiers, and counters. Events pause exploration until you choose an outcome.",
    cue: "Use Rations or Torches when the forecast is Risky or Severe.",
  },
  {
    title: "Answer crisis deadlines",
    detail: "Fire, Morale, Shelter, and Supplies can trigger a timed crisis. Every response shows its requirement and tradeoff.",
    cue: "A visible crisis takes priority over the normal objective.",
  },
  {
    title: "Build a run loadout",
    detail: "Temporary Tool, Charm, and Provision items change rules for this run. Their effects reset when the run ends.",
    cue: "Equip one item in each slot from the Camp screen.",
  },
  {
    title: "Read boss intent",
    detail: "Guardians announce dangerous moves one action early. Match the shown counter with Guard, supplies, or a class identity skill.",
    cue: "Counter feedback explains exactly why the response worked or failed.",
  },
  {
    title: "Repair every Beacon",
    detail: "After winning a Guardian fight, spend Wood and Stone and assign a repair crew. Better Core quality improves the final Gate.",
    cue: "Craft a Repair Kit when materials or time are tight.",
  },
  {
    title: "Carry progress forward",
    detail: "Score determines chest grade. Legacy Chest rewards, projects, blueprints, and permanent relics remain for future runs.",
    cue: "The end screen explains the score, chest threshold, and local run metrics.",
  },
];

export function OnboardingGuide({ state, dispatch }: Props) {
  if (!state.run.started || state.legacy.onboardingComplete) return null;
  const index = Math.min(steps.length - 1, state.legacy.onboardingStep);
  const step = steps[index];
  return (
    <aside className="onboarding-guide" aria-label="First run guide" aria-live="polite">
      <div>
        <p className="eyebrow">First Run Guide · {index + 1}/{steps.length}</p>
        <h2>{step.title}</h2>
        <p>{step.detail}</p>
        <small>{step.cue}</small>
      </div>
      <div className="onboarding-actions">
        <button onClick={() => dispatch({ type: "skipOnboarding" })}>Skip Guide</button>
        <button className="primary" onClick={() => dispatch({ type: "advanceOnboarding" })}>
          {index === steps.length - 1 ? "Finish Guide" : "Next"}
        </button>
      </div>
    </aside>
  );
}
