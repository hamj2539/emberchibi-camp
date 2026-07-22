import type { Dispatch } from "react";
import { starterClasses } from "../data/classes";
import { getLegacyBonuses } from "../game/meta";
import type { GameAction, GameState } from "../game/state";

type Props = {
  dispatch: Dispatch<GameAction>;
  state: GameState;
};

export function StarterSelect({ dispatch, state }: Props) {
  const bonuses = getLegacyBonuses(state.legacy);
  return (
    <section className="screen starter-screen">
      <div className="intro">
        <p className="eyebrow">Choose your first survivor</p>
        <h2>One ember. One chibi. A forest that keeps moving while you are away.</h2>
      </div>
      {state.legacy.runsCompleted > 0 && (
        <div className="panel legacy-preview">
          <p className="eyebrow">Legacy Run {state.legacy.runsCompleted + 1}</p>
          <h3>{bonuses.length} permanent bonuses ready</h3>
          <p>Best score {state.legacy.bestScore} · {state.legacy.shards} Legacy Shards</p>
        </div>
      )}
      <div className="class-grid">
        {starterClasses.map((starter) => (
          <article className="class-card" key={starter.id}>
            <div className={`portrait portrait-${starter.id}`}>{starter.name.slice(0, 1)}</div>
            <h3>{starter.name}</h3>
            <p>{starter.role}</p>
            <ul>
              {starter.strengths.map((strength) => (
                <li key={strength}>{strength}</li>
              ))}
            </ul>
            <div className="stat-row">
              {Object.entries(starter.stats).map(([key, value]) => (
                <span key={key}>
                  {key.toUpperCase()} {value}
                </span>
              ))}
            </div>
            <button className="primary" onClick={() => dispatch({ type: "chooseStarter", classId: starter.id })}>
              Start as {starter.name}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
