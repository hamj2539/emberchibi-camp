import type { Dispatch } from "react";
import { starterClasses } from "../data/classes";
import type { GameAction } from "../game/state";

type Props = {
  dispatch: Dispatch<GameAction>;
};

export function StarterSelect({ dispatch }: Props) {
  return (
    <section className="screen starter-screen">
      <div className="intro">
        <p className="eyebrow">Choose your first survivor</p>
        <h2>One ember. One chibi. A forest that keeps moving while you are away.</h2>
      </div>
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
