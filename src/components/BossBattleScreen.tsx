import { getBeacon } from "../data/beacons";
import { getIntent, guardianCombat } from "../data/bossCombat";
import { combatActions } from "../data/classes";
import type { Dispatch } from "react";
import { labelCoreQuality } from "../game/combat";
import type { BossAction, CombatStatusId, CombatStatuses, GameAction, GameState } from "../game/state";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

const actionLabels: { action: BossAction; label: string; detail: string }[] = [
  { action: "attack", label: "Attack", detail: "Party damage, stronger with Stone Spear." },
  { action: "guard", label: "Guard", detail: "Reduce the next scorch hits." },
  { action: "skill", label: "Class Skill", detail: "Use the next survivor's once-per-battle ability." },
  { action: "useTorch", label: "Torch", detail: "Spend Torch to cut burn pressure." },
  { action: "useSalve", label: "Salve", detail: "Spend Herb Salve to heal party burns." },
];

export function BossBattleScreen({ state, dispatch }: Props) {
  const battle = state.run.bossBattle;
  if (!battle) {
    return (
      <section className="screen">
        <div className="panel">
          <h2>No Guardian Found</h2>
          <p>Explore a Beacon Site to challenge its guardian.</p>
          <button onClick={() => dispatch({ type: "setScreen", screen: "explore" })}>Back to Explore</button>
        </div>
      </section>
    );
  }

  const party = state.run.survivors.filter((survivor) => battle.partyIds.includes(survivor.id));
  const bossHpPercent = Math.max(0, Math.round((battle.bossHp / battle.bossMaxHp) * 100));
  const beacon = getBeacon(battle.beaconId);
  const definition = guardianCombat[battle.beaconId];
  const phase = definition.phases.find((entry) => entry.id === battle.phaseId) ?? definition.phases[0];
  const intent = getIntent(definition, battle.pendingIntentId);

  return (
    <section className="screen boss-layout">
      <div className={`panel boss-scene scene-${battle.beaconId}`}>
        <p className="eyebrow">Beacon Guardian</p>
        <h2>{battle.bossName}</h2>
        <div className={`boss-art boss-${battle.bossId}`} aria-label={battle.bossName}>
          {battle.bossName.split(" ").map((word) => word[0]).join("")}
        </div>
        <p>{beacon.name}</p>
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
        <StatusRow label="Party" statuses={battle.partyStatuses} />
        <StatusRow label="Guardian" statuses={battle.bossStatuses} />
        <p className={`counter-feedback ${battle.lastCounterFeedback.startsWith("Counter worked") ? "counter-success" : ""}`}>
          {battle.lastCounterFeedback}
        </p>
        <div className="encounter-hints">
          <span><strong>Mechanic</strong>{beacon.mechanic}</span>
          <span><strong>Counter</strong>{beacon.counter}</span>
        </div>
        <div className="meter">
          <span aria-label={`${battle.bossName} health ${bossHpPercent}%`} style={{ width: `${bossHpPercent}%` }} />
        </div>
        <p>
          HP {Math.ceil(battle.bossHp)}/{battle.bossMaxHp} · Burn {battle.burnPressure} · Guard {battle.guardStacks} ·
          Turn {battle.turn} · Attempt {(state.run.beacons[battle.beaconId].failedAttempts ?? 0) + 1}
        </p>
      </div>

      <div className="panel">
        <h3>Party</h3>
        <div className="survivor-list">
          {party.map((survivor) => (
            <article className="survivor-row" key={survivor.id}>
              <div>
                <strong>{survivor.name}</strong>
                <span>
                  HP {Math.floor(survivor.currentHp)}/{survivor.stats.hp} · Injury {Math.floor(survivor.injury)}
                </span>
                <small>{combatActions[survivor.classId].basic.name} · {combatActions[survivor.classId].identity.name}</small>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Actions</h3>
        {battle.status === "active" ? (
          <div className="action-grid">
            {actionLabels.map((item) => (
              <button
                className={item.action === "attack" ? "primary" : ""}
                disabled={isDisabled(item.action, state)}
                title={disabledReason(item.action, state) ?? item.detail}
                key={item.action}
                onClick={() => dispatch({ type: "bossAction", action: item.action })}
              >
                <strong>{item.label}</strong>
                <span>{actionDetail(item.action, item.detail, state)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="result-box">
            <h3>{battle.status === "won" ? "Guardian Defeated" : "Attempt Failed"}</h3>
            <p>
              {battle.status === "won" && battle.coreQuality
                ? labelCoreQuality(battle.coreQuality, battle.coreName)
                : `The party returns injured. The next victory will yield a weaker ${battle.coreName}.`}
            </p>
            <button className="primary" onClick={() => dispatch({ type: "leaveBossResult" })}>
              Continue
            </button>
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Battle Log</h3>
        <ol className="log">
          {battle.log.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function isDisabled(action: BossAction, state: GameState): boolean {
  if (action === "useTorch") return state.run.items.torch <= 0;
  if (action === "useSalve") return state.run.items.herbSalve <= 0;
  if (action === "skill") {
    const battle = state.run.bossBattle;
    return !battle || !battle.partyIds.some((id) => !battle.usedSkills.includes(id) && state.run.survivors.some((survivor) => survivor.id === id && survivor.currentHp > 0));
  }
  return false;
}

function actionDetail(action: BossAction, detail: string, state: GameState): string {
  if (action === "useTorch") return `${detail} (${state.run.items.torch} ready)`;
  if (action === "useSalve") return `${detail} (${state.run.items.herbSalve} ready)`;
  if (action === "skill") {
    const battle = state.run.bossBattle;
    const user = battle && state.run.survivors.find(
      (survivor) => battle.partyIds.includes(survivor.id) && survivor.currentHp > 0 && !battle.usedSkills.includes(survivor.id),
    );
    return user ? `${user.name}: ${combatActions[user.classId].identity.name} — ${combatActions[user.classId].identity.detail}` : detail;
  }
  return detail;
}

function disabledReason(action: BossAction, state: GameState): string | null {
  if (action === "useTorch" && state.run.items.torch <= 0) return "Unavailable: craft or find a Torch.";
  if (action === "useSalve" && state.run.items.herbSalve <= 0) return "Unavailable: craft or find Herb Salve.";
  if (action === "skill" && isDisabled(action, state)) return "Unavailable: every conscious survivor has used their identity action.";
  return null;
}

const statusMeta: Record<CombatStatusId, { icon: string; detail: string }> = {
  burn: { icon: "B", detail: "Deals damage after each unresolved intent." },
  poison: { icon: "P", detail: "Deals persistent damage after each turn." },
  guarded: { icon: "G", detail: "Reduces incoming intent damage." },
  exposed: { icon: "X", detail: "Takes increased attack damage." },
  bound: { icon: "R", detail: "Reduces outgoing attack damage." },
  inspired: { icon: "I", detail: "Increases party attack damage." },
  cursed: { icon: "C", detail: "Raises incoming damage and status damage." },
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
