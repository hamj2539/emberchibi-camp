import type { Dispatch } from "react";
import { labelCoreQuality } from "../game/combat";
import type { GameAction, GameState } from "../game/state";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function EndRunScreen({ state, dispatch }: Props) {
  const quality = state.run.beaconRepair?.coreQuality;

  return (
    <section className="screen">
      <div className="panel camp-hero">
        <p className="eyebrow">Demo Run Complete</p>
        <h2>Ember Beacon Lit</h2>
        <p>
          {quality
            ? `${labelCoreQuality(quality)} stabilized the Beacon. Scoring and Legacy Chest arrive next.`
            : "The Beacon burns quietly in the dark."}
        </p>
        <button className="primary" onClick={() => dispatch({ type: "resetRun", keepLegacy: true })}>
          Start Fresh Run
        </button>
      </div>
    </section>
  );
}
