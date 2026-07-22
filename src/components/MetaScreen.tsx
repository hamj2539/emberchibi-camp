import type { Dispatch } from "react";
import { getLegacyBonuses } from "../game/meta";
import { labelChestGrade } from "../game/scoring";
import type { GameAction, GameState } from "../game/state";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function MetaScreen({ state, dispatch }: Props) {
  const { legacy } = state;
  const bonuses = getLegacyBonuses(legacy);

  return (
    <section className="screen meta-layout">
      <div className="panel camp-hero">
        <p className="eyebrow">Across Every Run</p>
        <h2>Legacy</h2>
        <p>Chest rewards stay with the camp and prepare every future expedition.</p>
        <div className="resource-grid">
          <div className="resource"><span>Runs</span><strong>{legacy.runsCompleted}</strong></div>
          <div className="resource"><span>Best Score</span><strong>{legacy.bestScore}</strong></div>
          <div className="resource"><span>Best Chest</span><strong>{legacy.bestChestGrade ? labelChestGrade(legacy.bestChestGrade) : "None"}</strong></div>
          <div className="resource"><span>Shards</span><strong>{legacy.shards}</strong></div>
        </div>
      </div>

      <div className="panel">
        <h3>Next Run Bonuses</h3>
        {bonuses.length ? (
          <div className="legacy-list">
            {bonuses.map((bonus) => <div className="legacy-row" key={bonus.source}><strong>{bonus.source}</strong><span>{bonus.effect}</span></div>)}
          </div>
        ) : <p>Open Legacy Chests to earn permanent starting bonuses.</p>}
      </div>

      <div className="panel">
        <h3>Collection</h3>
        <Collection title="Blueprints" values={legacy.blueprints} />
        <Collection title="Relics" values={legacy.relics} />
        <Collection title="Survivor & Class Unlocks" values={legacy.unlocks} />
      </div>

      <button onClick={() => dispatch({ type: "setScreen", screen: state.run.gate.status === "cleared" ? "end" : "camp" })}>
        Return
      </button>
    </section>
  );
}

function Collection({ title, values }: { title: string; values: string[] }) {
  return <div className="collection-block"><strong>{title}</strong><p>{values.length ? values.join(" · ") : "None yet"}</p></div>;
}
