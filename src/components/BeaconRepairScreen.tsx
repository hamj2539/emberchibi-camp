import type { Dispatch } from "react";
import { labelCoreQuality } from "../game/combat";
import type { GameAction, GameState } from "../game/state";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function BeaconRepairScreen({ state, dispatch }: Props) {
  const quality = state.run.bossBattle?.coreQuality;

  return (
    <section className="screen">
      <div className="panel camp-hero">
        <p className="eyebrow">Milestone 7 Preview</p>
        <h2>Ember Beacon Repair</h2>
        <p>
          {quality
            ? `${labelCoreQuality(quality)} is ready for the repair ritual.`
            : "Defeat Cinder Stag to recover a Cinder Heart."}
        </p>
        <button onClick={() => dispatch({ type: "setScreen", screen: "camp" })}>Return to Camp</button>
      </div>
    </section>
  );
}
