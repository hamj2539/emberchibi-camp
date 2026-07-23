import type { Dispatch } from "react";
import { beacons } from "../data/beacons";
import { GameIcon, type GameIconName } from "./GameIcon";
import { campUpgrades } from "../data/progression";
import { getRecruitDefinition } from "../data/events";
import { getCrisis } from "../data/crises";
import { canResolveCrisisChoice } from "../game/crises";
import type { CampPressureKey, GameAction, GameState, ResourceKey } from "../game/state";

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

const resourceIcons: Record<keyof typeof resourceLabels, GameIconName> = {
  wood: "wood",
  food: "food",
  herb: "herb",
  stone: "stone",
  ore: "ore",
  relicShard: "relicShard",
};

const jobDescriptions = {
  rest: "Recover HP and fatigue",
  forage: "Gather Food and Herb",
  craft: "Speed every craft task",
  guard: "+4 expedition safety",
  cook: "2 Food → 1 Ration / 30s",
  research: "Lower new Guardian pressure",
};

const pressureLabels: Record<CampPressureKey, string> = {
  fire: "Fire",
  morale: "Morale",
  shelter: "Shelter",
  supplies: "Supplies",
};

export function CampScreen({ state, dispatch, onReset }: Props) {
  const expedition = state.run.activeExpedition;
  const secondsLeft = expedition ? Math.max(0, Math.ceil((expedition.endsAt - Date.now()) / 1000)) : 0;
  const litBeacons = beacons.filter((beacon) => state.run.beacons[beacon.id].repaired).length;
  const recruitDefinition = state.run.recruitEvent ? getRecruitDefinition(state.run.recruitEvent.id) : null;
  const activeCrisis = state.run.activeCrisis;
  const crisis = activeCrisis ? getCrisis(activeCrisis.id) : null;
  const crisisSecondsLeft = activeCrisis ? Math.max(0, Math.ceil(activeCrisis.deadlineAt - state.run.daySeconds)) : 0;

  return (
    <section className="screen dashboard">
      <div className="panel camp-hero">
        <p className="eyebrow">Campfire Status</p>
        <h2>Camp holds for {formatTime(state.run.daySeconds)}</h2>
        <p>Assign idle jobs, gather enough supplies, and send careful expeditions into the dark forest.</p>
        <div className="status-strip">
          <span>{state.run.survivors.filter((survivor) => !survivor.onExpedition).length} ready</span>
          <span>{state.run.craftQueue.length} craft queued</span>
          <span>{litBeacons}/5 Beacons lit</span>
          <span>Offline: 10% · 8h cap</span>
        </div>
        {expedition && <strong>Expedition returns in {secondsLeft}s</strong>}
      </div>

      <div className="panel pressure-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Camp Pressure</p>
            <h3>Survival stability</h3>
          </div>
          <strong className={state.run.collapseMeter >= 70 ? "critical-text" : ""}>
            Collapse {Math.round(state.run.collapseMeter)}%
          </strong>
        </div>
        <div className="pressure-grid">
          {(Object.entries(state.run.campPressure) as [CampPressureKey, number][]).map(([key, value]) => (
            <div className="pressure-item" key={key}>
              <div>
                <span>{pressureLabels[key]}</span>
                <strong>{Math.round(value)}</strong>
              </div>
              <div className="pressure-meter" aria-label={`${pressureLabels[key]} ${Math.round(value)} percent`}>
                <span className={value <= 30 ? "danger-fill" : ""} style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {crisis && activeCrisis && (
        <div className={`panel crisis-panel severity-${crisis.severity}`}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{crisis.severity} crisis</p>
              <h3>{crisis.name}</h3>
            </div>
            <strong className="crisis-deadline">{crisisSecondsLeft}s remaining</strong>
          </div>
          <p>{crisis.warning}</p>
          <div className="crisis-facts">
            <span><strong>Triggered:</strong> {activeCrisis.reason}</span>
            <span><strong>If ignored:</strong> {crisis.consequence}</span>
          </div>
          <div className="crisis-choices">
            {crisis.choices.map((choice) => {
              const available = canResolveCrisisChoice(state, choice);
              return (
                <button
                  className={available ? "primary" : ""}
                  disabled={!available}
                  key={choice.id}
                  onClick={() => dispatch({ type: "resolveCrisis", choiceId: choice.id })}
                >
                  <strong>{choice.label}</strong>
                  <span>{choice.detail}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {state.run.recruitEvent?.status === "available" && (
        <div className="panel recruit-panel">
          <p className="eyebrow">Recruit Event</p>
          <h3>{state.run.recruitEvent.name}</h3>
          <p>{state.run.recruitEvent.description}</p>
          <div className="choice-row">
            <button
              className="primary"
              disabled={state.run.resources.herb < state.run.recruitEvent.herbCost}
              onClick={() => dispatch({ type: "resolveRecruit", choice: "herb" })}
            >
              Spend {state.run.recruitEvent.herbCost} Herb
              {recruitDefinition?.instantChoice === "herb" ? " · Join now" : " · Delayed lead"}
            </button>
            <button
              disabled={state.run.resources.food < state.run.recruitEvent.foodCost}
              onClick={() => dispatch({ type: "resolveRecruit", choice: "food" })}
            >
              Spend {state.run.recruitEvent.foodCost} Food
              {recruitDefinition?.instantChoice === "food" ? " · Join now" : " · Delayed lead"}
            </button>
            <button className="danger" onClick={() => dispatch({ type: "resolveRecruit", choice: "ignore" })}>
              Ignore
            </button>
          </div>
        </div>
      )}

      {state.run.recruitEvent?.status === "waiting" && (
        <div className="panel recruit-panel">
          <p className="eyebrow">Recruit Lead</p>
          <h3>{state.run.recruitEvent.name}</h3>
          <p>{state.run.recruitEvent.branchNote}</p>
          {recruitDefinition?.delayedItem && (
            <div className="status-strip">
              <span>Required: {recruitDefinition.delayedItem === "repairKit" ? "Repair Kit" : recruitDefinition.delayedItem}</span>
              <span>Ready: {state.run.items[recruitDefinition.delayedItem]}</span>
            </div>
          )}
        </div>
      )}

      <div className="panel">
        <h3>Resources</h3>
        <div className="resource-grid">
          {Object.entries(state.run.resources).map(([key, value]) => (
            <div className="resource" key={key}>
              <GameIcon
                label={resourceLabels[key as keyof typeof resourceLabels]}
                name={resourceIcons[key as keyof typeof resourceIcons]}
                size="sm"
              />
              <span>{resourceLabels[key as keyof typeof resourceLabels]}</span>
              <strong>{formatAmount(value)}</strong>
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
                {!survivor.onExpedition && <span className="job-effect">{jobDescriptions[survivor.job]}</span>}
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
        <p className="eyebrow">This Run</p>
        <h3>Camp Upgrades</h3>
        <div className="upgrade-grid">
          {campUpgrades.map((upgrade) => {
            const built = state.run.campUpgrades.includes(upgrade.id);
            const affordable = Object.entries(upgrade.cost).every(
              ([key, amount]) => state.run.resources[key as ResourceKey] >= (amount ?? 0),
            );
            return (
              <article className="upgrade-row" key={upgrade.id}>
                <div>
                  <strong>{upgrade.name}</strong>
                  <span>{upgrade.description}</span>
                  <small>{formatCost(upgrade.cost)}</small>
                </div>
                <button
                  className={built ? "" : "primary"}
                  disabled={built || !affordable}
                  onClick={() => dispatch({ type: "buyCampUpgrade", upgradeId: upgrade.id })}
                >
                  {built ? "Built" : "Build"}
                </button>
              </article>
            );
          })}
        </div>
      </div>

      <div className="panel log-panel">
        <h3>Camp Log</h3>
        <ol className="log">
          {state.run.log.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ol>
        <button className="danger" onClick={onReset}>
          Reset Run
        </button>
        <button
          className="danger"
          onClick={() => {
            if (window.confirm("End this run with a Broken Chest and half score?")) dispatch({ type: "abandonRun" });
          }}
        >
          Abandon Run
        </button>
      </div>
    </section>
  );
}

function formatCost(cost: Partial<Record<ResourceKey, number>>): string {
  return Object.entries(cost).map(([key, value]) => `${value} ${resourceLabels[key as keyof typeof resourceLabels]}`).join(" · ");
}

function formatAmount(value: number): string {
  return value % 1 === 0 ? `${value}` : value.toFixed(1);
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}
