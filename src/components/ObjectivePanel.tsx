import { getCurrentObjective } from "../game/objectives";
import type { GameState } from "../game/state";

type Props = {
  state: GameState;
};

export function ObjectivePanel({ state }: Props) {
  const objective = getCurrentObjective(state);

  if (!state.run.started) return null;

  return (
    <section className="objective-panel" aria-label="Current objective">
      <div>
        <p className="eyebrow">Current Goal</p>
        <h2>{objective.title}</h2>
        <p>{objective.detail}</p>
      </div>
      <div className="objective-progress">
        <strong>{objective.progress}%</strong>
        <div className="mini-meter">
          <span style={{ width: `${objective.progress}%` }} />
        </div>
      </div>
    </section>
  );
}
