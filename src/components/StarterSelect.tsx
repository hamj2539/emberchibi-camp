import type { Dispatch } from "react";
import { starterClasses } from "../data/classes";
import { getLegacyBonuses } from "../game/meta";
import type { GameAction, GameState } from "../game/state";
import { runModifiers } from "../data/routeContent";
import { runVows, starterLoadouts } from "../data/alpha9Progression";

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
      <div className="panel run-vow-panel">
        <p className="eyebrow">Optional Difficulty</p>
        <h3>Run Vows</h3>
        <p>Vows make this run harder in exchange for score and permanent Journal completion.</p>
        <div className="vow-grid">
          {runVows.map((vow) => {
            const selected = state.run.vows.includes(vow.id);
            const completed = state.legacy.completedVows.includes(vow.id);
            return (
              <button
                className={`vow-card ${selected ? "selected" : ""}`}
                aria-pressed={selected}
                key={vow.id}
                onClick={() => dispatch({ type: "toggleVow", vowId: vow.id })}
              >
                <span>{completed ? "Cleared" : selected ? "Active" : "Optional"}</span>
                <strong>{vow.name}</strong>
                <small>{vow.description}</small>
                <em>{vow.reward}</em>
              </button>
            );
          })}
        </div>
      </div>
      {(state.legacy.projects.includes("weatherDial") || state.legacy.projects.includes("starterSatchel")) && (
        <div className="panel legacy-run-options">
          <p className="eyebrow">Tier II Legacy Options</p>
          {state.legacy.projects.includes("weatherDial") && (
            <label>
              <strong>Run Modifier</strong>
              <select
                value={state.run.runModifier}
                onChange={(event) => dispatch({ type: "selectRunModifier", modifierId: event.target.value as GameState["run"]["runModifier"] })}
              >
                {runModifiers.map((modifier) => <option value={modifier.id} key={modifier.id}>{modifier.name}</option>)}
              </select>
            </label>
          )}
          {state.legacy.projects.includes("starterSatchel") && (
            <label>
              <strong>Starter Loadout</strong>
              <select
                value={state.run.starterLoadout}
                onChange={(event) => dispatch({ type: "selectStarterLoadout", loadoutId: event.target.value as GameState["run"]["starterLoadout"] })}
              >
                {starterLoadouts.map((loadout) => <option value={loadout.id} key={loadout.id}>{loadout.name}: {loadout.description}</option>)}
              </select>
            </label>
          )}
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
