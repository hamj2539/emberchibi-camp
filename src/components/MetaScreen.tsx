import type { Dispatch } from "react";
import { getLegacyBonuses } from "../game/meta";
import { labelChestGrade } from "../game/scoring";
import { legacyProjects } from "../data/progression";
import type { GameAction, GameState } from "../game/state";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function MetaScreen({ state, dispatch }: Props) {
  const { legacy } = state;
  const bonuses = getLegacyBonuses(legacy);

  return (
    <section className="screen meta-layout">
      <div className="panel camp-hero">
        <p className="eyebrow">Across Every Run</p>
        <h2>Legacy</h2>
        <p>Chest rewards stay with the camp and prepare every future expedition.</p>
        <div className="resource-grid">
          <div className="resource"><span>Runs</span><strong>{legacy.runsCompleted}</strong></div>
          <div className="resource"><span>Best Score</span><strong>{legacy.bestScore}</strong></div>
          <div className="resource"><span>Best Chest</span><strong>{legacy.bestChestGrade ? labelChestGrade(legacy.bestChestGrade) : "None"}</strong></div>
          <div className="resource"><span>Shards</span><strong>{legacy.shards}</strong></div>
        </div>
      </div>

      <div className="panel">
        <h3>Next Run Bonuses</h3>
        {bonuses.length ? (
          <div className="legacy-list">
            {bonuses.map((bonus) => <div className="legacy-row" key={bonus.source}><strong>{bonus.source}</strong><span>{bonus.effect}</span></div>)}
          </div>
        ) : <p>Open Legacy Chests to earn permanent starting bonuses.</p>}
      </div>

      <div className="panel">
        <p className="eyebrow">Shard Workshop</p>
        <h3>Legacy Projects</h3>
        <div className="upgrade-grid">
          {legacyProjects.map((project) => {
            const owned = legacy.projects.includes(project.id);
            const prerequisiteMet = !project.requires || legacy.projects.includes(project.requires);
            const requirement = project.requires
              ? legacyProjects.find((entry) => entry.id === project.requires)?.name
              : null;
            return (
              <article className={`upgrade-row tier-${project.tier}`} key={project.id}>
                <div>
                  <span className="project-tier">Tier {project.tier}</span>
                  <strong>{project.name}</strong><span>{project.description}</span>
                  <small>{project.cost} Shards{!prerequisiteMet ? ` · Requires ${requirement}` : ""}</small>
                </div>
                <button
                  className={owned ? "" : "primary"}
                  disabled={owned || legacy.shards < project.cost || !prerequisiteMet}
                  title={!prerequisiteMet ? `Unlock ${requirement} first.` : legacy.shards < project.cost ? `Requires ${project.cost} Shards.` : project.description}
                  onClick={() => dispatch({ type: "buyLegacyProject", projectId: project.id })}
                >
                  {owned ? "Owned" : "Unlock"}
                </button>
              </article>
            );
          })}
        </div>
      </div>
      {legacy.rememberedRunItem && (
        <div className="panel memory-panel">
          <p className="eyebrow">Memory Reliquary</p>
          <h3>{legacy.rememberedRunItem}</h3>
          <p>This run item will return equipped at the start of the next run.</p>
        </div>
      )}

      <div className="panel">
        <p className="eyebrow">2 Slots</p>
        <h3>Equipped Relics</h3>
        {legacy.relics.length ? (
          <div className="choice-row">
            {legacy.relics.map((relic) => {
              const equipped = legacy.equippedRelics.includes(relic);
              return (
                <button
                  className={equipped ? "primary" : ""}
                  disabled={!equipped && legacy.equippedRelics.length >= 2}
                  key={relic}
                  onClick={() => dispatch({ type: "toggleRelic", relic })}
                >
                  {equipped ? "Equipped: " : "Equip: "}{relic}
                </button>
              );
            })}
          </div>
        ) : <p>Find relics in Legacy Chests to create a loadout.</p>}
      </div>

      <div className="panel">
        <h3>Collection</h3>
        <Collection title="Blueprints" values={legacy.blueprints} />
        <Collection title="Relics" values={legacy.relics} />
        <Collection title="Survivor & Class Unlocks" values={legacy.unlocks} />
      </div>

      <button onClick={() => dispatch({ type: "setScreen", screen: state.run.gate.status === "cleared" ? "end" : "camp" })}>
        Return
      </button>
    </section>
  );
}

function Collection({ title, values }: { title: string; values: string[] }) {
  return <div className="collection-block"><strong>{title}</strong><p>{values.length ? values.join(" · ") : "None yet"}</p></div>;
}
