import type { Dispatch } from "react";
import type { GameAction, GameState } from "../game/state";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  onReset: () => void;
};

const resourceLabels = {
  wood: "Wood",
  food: "Food",
  herb: "Herb",
  stone: "Stone",
  ore: "Ore",
  relicShard: "Relic Shard",
};

export function CampScreen({ state, dispatch, onReset }: Props) {
  const expedition = state.run.activeExpedition;
  const secondsLeft = expedition ? Math.max(0, Math.ceil((expedition.endsAt - Date.now()) / 1000)) : 0;

  return (
    <section className="screen dashboard">
      <div className="panel camp-hero">
        <p className="eyebrow">Campfire Status</p>
        <h2>Camp holds for {formatTime(state.run.daySeconds)}</h2>
        <p>Assign idle jobs, gather enough supplies, and send careful expeditions into the dark forest.</p>
        {expedition && <strong>Expedition returns in {secondsLeft}s</strong>}
      </div>

      <div className="panel">
        <h3>Resources</h3>
        <div className="resource-grid">
          {Object.entries(state.run.resources).map(([key, value]) => (
            <div className="resource" key={key}>
              <span>{resourceLabels[key as keyof typeof resourceLabels]}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Idle Jobs</h3>
        <div className="survivor-list">
          {state.run.survivors.map((survivor) => (
            <article className="survivor-row" key={survivor.id}>
              <div>
                <strong>{survivor.name}</strong>
                <span>{survivor.onExpedition ? "On expedition" : `Current: ${survivor.job}`}</span>
              </div>
              <select
                value={survivor.job}
                disabled={survivor.onExpedition}
                onChange={(event) =>
                  dispatch({ type: "assignJob", survivorId: survivor.id, job: event.target.value as never })
                }
              >
                <option value="rest">Rest</option>
                <option value="forage">Forage</option>
                <option value="craft">Craft</option>
                <option value="guard">Guard</option>
                <option value="cook">Cook</option>
                <option value="research">Research</option>
              </select>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Camp Log</h3>
        <ol className="log">
          {state.run.log.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ol>
        <button className="danger" onClick={onReset}>
          Reset Run
        </button>
      </div>
    </section>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}
