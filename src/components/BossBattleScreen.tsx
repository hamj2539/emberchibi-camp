import type { Dispatch } from "react";
import { labelCoreQuality } from "../game/combat";
import type { BossAction, GameAction, GameState } from "../game/state";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

const actionLabels: { action: BossAction; label: string; detail: string }[] = [
  { action: "attack", label: "Attack", detail: "Party damage, stronger with Stone Spear." },
  { action: "guard", label: "Guard", detail: "Reduce the next scorch hits." },
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
          <p>Explore the Ember Beacon Site to challenge the Cinder Stag.</p>
          <button onClick={() => dispatch({ type: "setScreen", screen: "explore" })}>Back to Explore</button>
        </div>
      </section>
    );
  }

  const party = state.run.survivors.filter((survivor) => battle.partyIds.includes(survivor.id));
  const bossHpPercent = Math.max(0, Math.round((battle.bossHp / battle.bossMaxHp) * 100));

  return (
    <section className="screen boss-layout">
      <div className="panel boss-scene">
        <p className="eyebrow">Beacon Guardian</p>
        <h2>Cinder Stag</h2>
        <div className="boss-art">CS</div>
        <div className="meter">
          <span style={{ width: `${bossHpPercent}%` }} />
        </div>
        <p>
          HP {battle.bossHp}/{battle.bossMaxHp} · Burn {battle.burnPressure} · Guard {battle.guardStacks} · Turn{" "}
          {battle.turn}
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
                  HP {survivor.currentHp}/{survivor.stats.hp} · Injury {survivor.injury}
                </span>
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
                key={item.action}
                onClick={() => dispatch({ type: "bossAction", action: item.action })}
              >
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="result-box">
            <h3>{battle.status === "won" ? "Guardian Defeated" : "Attempt Failed"}</h3>
            <p>
              {battle.status === "won" && battle.coreQuality
                ? labelCoreQuality(battle.coreQuality)
                : "The party returns injured. The next victory will yield a weaker Cinder Heart."}
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
  return false;
}
