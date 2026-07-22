import { useState, type Dispatch } from "react";
import type { GameAction, GameState, GateAction } from "../game/state";
import { CrewPicker } from "./CrewPicker";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

const actions: { action: GateAction; label: string; detail: string }[] = [
  { action: "attack", label: "Attack", detail: "Push damage through the Gate." },
  { action: "guard", label: "Guard", detail: "Reduce the next Herald mark." },
  { action: "useTorch", label: "Torch", detail: "Spend Torch to cut night pressure." },
  { action: "useSalve", label: "Salve", detail: "Spend Herb Salve to heal the party." },
];

export function GateScreen({ state, dispatch }: Props) {
  const [selectedIds, setSelectedIds] = useState(() =>
    state.run.survivors.filter((survivor) => !survivor.onExpedition && survivor.currentHp > 0).slice(0, 3).map((survivor) => survivor.id),
  );
  const gate = state.run.gate;
  const available = state.run.survivors.filter((survivor) => !survivor.onExpedition);
  const party = state.run.survivors.filter((survivor) => gate.partyIds.includes(survivor.id));
  const selected = available.filter((survivor) => selectedIds.includes(survivor.id) && survivor.currentHp > 0);
  const hpPercent = Math.max(0, Math.round((gate.heraldHp / gate.heraldMaxHp) * 100));

  return (
    <section className="screen boss-layout">
      <div className="panel boss-scene gate-scene">
        <p className="eyebrow">Cinder Gate</p>
        <h2>{gate.status === "active" ? "Night Herald" : "The Gate Is Open"}</h2>
        <div className="boss-art boss-nightHerald" aria-label="Night Herald">NH</div>
        {gate.status === "active" ? (
          <>
            <div className="meter">
              <span aria-label={`Night Herald health ${hpPercent}%`} style={{ width: `${hpPercent}%` }} />
            </div>
            <p>
              HP {Math.ceil(gate.heraldHp)}/{gate.heraldMaxHp} · Night {gate.nightPressure} · Guard {gate.guardStacks} ·
              Turn {gate.turn}
            </p>
          </>
        ) : (
          <p>All five Beacons are lit. Send your strongest crew through the Gate to finish the run.</p>
        )}
      </div>

      <div className="panel">
        <h3>{gate.status === "active" ? "Gate Party" : "Ready Crew"}</h3>
        {gate.status === "active" ? (
          <div className="survivor-list">
            {party.map((survivor) => (
              <article className="survivor-row" key={survivor.id}>
                <div>
                  <strong>{survivor.name}</strong>
                  <span>
                    HP {Math.floor(survivor.currentHp)}/{survivor.stats.hp} · ATK {survivor.stats.atk} · WIS{" "}
                    {survivor.stats.wis}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <CrewPicker survivors={available} selectedIds={selectedIds} max={3} onChange={setSelectedIds} stats={["atk", "wis", "def"]} />
        )}
        {(gate.status === "open" || gate.status === "lost") && (
          <button
            className="primary"
            disabled={selected.length < 2 || selected.length > 3}
            onClick={() => dispatch({ type: "startGate", survivorIds: selected.map((survivor) => survivor.id) })}
          >
            {gate.status === "lost" ? "Re-enter Gate" : "Enter Gate"}
          </button>
        )}
      </div>

      <div className="panel">
        <h3>Actions</h3>
        {gate.status === "active" ? (
          <div className="action-grid">
            {actions.map((item) => (
              <button
                className={item.action === "attack" ? "primary" : ""}
                disabled={isDisabled(item.action, state)}
                key={item.action}
                onClick={() => dispatch({ type: "gateAction", action: item.action })}
              >
                <strong>{item.label}</strong>
                <span>{actionDetail(item.action, item.detail, state)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="result-box">
            <strong>{gate.status === "cleared" ? "Gate Cleared" : "Awaiting Party"}</strong>
            <p>{gate.status === "lost" ? "Recover at camp and challenge the Night Herald again." : "Night Herald waits beyond the Gate."}</p>
            {gate.status === "lost" && <button onClick={() => dispatch({ type: "leaveGateResult" })}>Return to Camp</button>}
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Gate Log</h3>
        <ol className="log">
          {gate.log.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function isDisabled(action: GateAction, state: GameState): boolean {
  if (action === "useTorch") return state.run.items.torch <= 0;
  if (action === "useSalve") return state.run.items.herbSalve <= 0;
  return false;
}

function actionDetail(action: GateAction, detail: string, state: GameState): string {
  if (action === "useTorch") return `${detail} (${state.run.items.torch} ready)`;
  if (action === "useSalve") return `${detail} (${state.run.items.herbSalve} ready)`;
  return detail;
}
