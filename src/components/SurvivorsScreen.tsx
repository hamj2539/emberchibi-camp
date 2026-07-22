import type { Dispatch } from "react";
import type { GameAction, GameState } from "../game/state";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function SurvivorsScreen({ state, dispatch }: Props) {
  return (
    <section className="screen survivor-grid">
      {state.run.survivors.map((survivor) => (
        <article className="panel survivor-card" key={survivor.id}>
          <div className={`portrait portrait-${survivor.classId}`}>{survivor.name.slice(0, 1)}</div>
          <h2>{survivor.name}</h2>
          <p>{survivor.role}</p>
          <div className="meters">
            <span>HP {survivor.currentHp}/{survivor.stats.hp}</span>
            <span>Fatigue {survivor.fatigue}</span>
            <span>Injury {survivor.injury}</span>
          </div>
          <div className="stat-row">
            {Object.entries(survivor.stats).map(([key, value]) => (
              <span key={key}>
                {key.toUpperCase()} {value}
              </span>
            ))}
          </div>
          <button onClick={() => dispatch({ type: "setScreen", screen: "camp" })}>Assign Job</button>
        </article>
      ))}
    </section>
  );
}
