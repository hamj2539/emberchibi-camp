import { useState, type Dispatch } from "react";
import type { GameAction, GameState, GateAction } from "../game/state";
import type { CombatStatusId, CombatStatuses } from "../game/state";
import { calculateGateStability } from "../game/gate";
import { combatActions } from "../data/classes";
import { getIntent, heraldCombat } from "../data/bossCombat";
import { CrewPicker } from "./CrewPicker";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

const actions: { action: GateAction; label: string; detail: string }[] = [
  { action: "attack", label: "Attack", detail: "Push damage through the Gate." },
  { action: "guard", label: "Guard", detail: "Reduce the next Herald mark." },
  { action: "skill", label: "Class Skill", detail: "Use the next survivor's once-per-battle ability." },
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
  const stability = calculateGateStability(state);
  const phase = heraldCombat.phases.find((entry) => entry.id === gate.phaseId) ?? heraldCombat.phases[0];
  const intent = getIntent(heraldCombat, gate.pendingIntentId);

  return (
    <section className="screen boss-layout">
      <div className="panel boss-scene gate-scene">
        <p className="eyebrow">Cinder Gate</p>
        <h2>{gate.status === "active" ? "Night Herald" : "The Gate Is Open"}</h2>
        <div className="boss-art boss-nightHerald" aria-label="Night Herald">NH</div>
        <div className="status-strip">
          <span>Beacon Stability {stability}/15</span>
          <span>Herald HP penalty −{stability * 3}</span>
        </div>
        {gate.status === "active" ? (
          <>
            <div className="phase-intent">
              <div>
                <span>Phase</span>
                <strong>{phase.name}</strong>
              </div>
              <div className="intent-card">
                <span>Incoming Intent</span>
                <strong>{intent.name}</strong>
                <p>{intent.telegraph}</p>
                <small>Counter: {intent.counter.label}</small>
                <small>If missed: {intent.consequence}</small>
              </div>
            </div>
            <StatusRow label="Party" statuses={gate.partyStatuses} />
            <StatusRow label="Herald" statuses={gate.bossStatuses} />
            <p className={`counter-feedback ${gate.lastCounterFeedback.startsWith("Counter worked") ? "counter-success" : ""}`}>
              {gate.lastCounterFeedback}
            </p>
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
                  <small>{combatActions[survivor.classId].basic.name} · {combatActions[survivor.classId].identity.name}</small>
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
  if (action === "skill") {
    const gate = state.run.gate;
    return !gate.partyIds.some((id) => !gate.usedSkills.includes(id) && state.run.survivors.some((survivor) => survivor.id === id && survivor.currentHp > 0));
  }
  return false;
}

function actionDetail(action: GateAction, detail: string, state: GameState): string {
  if (action === "useTorch") return `${detail} (${state.run.items.torch} ready)`;
  if (action === "useSalve") return `${detail} (${state.run.items.herbSalve} ready)`;
  if (action === "skill") {
    const gate = state.run.gate;
    const user = state.run.survivors.find(
      (survivor) => gate.partyIds.includes(survivor.id) && survivor.currentHp > 0 && !gate.usedSkills.includes(survivor.id),
    );
    return user ? `${user.name}: ${combatActions[user.classId].identity.name} — ${combatActions[user.classId].identity.detail}` : detail;
  }
  return detail;
}

const statusMeta: Record<CombatStatusId, { icon: string; detail: string }> = {
  burn: { icon: "B", detail: "Deals damage after each unresolved intent." },
  poison: { icon: "P", detail: "Deals persistent damage after each turn." },
  guarded: { icon: "G", detail: "Reduces incoming intent damage." },
  exposed: { icon: "X", detail: "Takes increased attack damage." },
  bound: { icon: "R", detail: "Reduces outgoing attack damage." },
  inspired: { icon: "I", detail: "Increases party attack damage." },
  cursed: { icon: "C", detail: "Raises incoming and status damage." },
  focused: { icon: "F", detail: "Increases party attack damage." },
};

function StatusRow({ label, statuses }: { label: string; statuses: CombatStatuses }) {
  const active = Object.entries(statuses).filter(([, stacks]) => (stacks ?? 0) > 0) as [CombatStatusId, number][];
  if (!active.length) return null;
  return (
    <div className="combat-statuses">
      <span>{label}</span>
      {active.map(([id, stacks]) => (
        <span className={`combat-status status-${id}`} key={id} title={statusMeta[id].detail}>
          <b aria-hidden="true">{statusMeta[id].icon}</b> {id} {stacks}
        </span>
      ))}
    </div>
  );
}
