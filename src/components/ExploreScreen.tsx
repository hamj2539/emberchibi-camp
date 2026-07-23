import { useState, type Dispatch } from "react";
import { beacons, getBeaconByBossRoute, getBeaconByPrepRoute } from "../data/beacons";
import { routes } from "../data/routes";
import { getRouteDecision, getRunModifier } from "../data/routeContent";
import type { GameAction, GameState, RouteId } from "../game/state";
import { calculateExpeditionDuration, calculateExpeditionSafety, expeditionSuccessChance, labelSuccessChance } from "../game/expedition";
import { canResolveRouteChoice } from "../game/routeDecisions";
import { CrewPicker } from "./CrewPicker";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function ExploreScreen({ state, dispatch }: Props) {
  const [useRation, setUseRation] = useState(false);
  const [useTorch, setUseTorch] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() =>
    state.run.survivors.filter((survivor) => !survivor.onExpedition && survivor.currentHp > 0).slice(0, 2).map((survivor) => survivor.id),
  );
  const availableSurvivors = state.run.survivors.filter((survivor) => !survivor.onExpedition);
  const selectedSurvivors = availableSurvivors.filter((survivor) => selectedIds.includes(survivor.id) && survivor.currentHp > 0);
  const expedition = state.run.activeExpedition;
  const activeDecision = state.run.activeRouteDecision;
  const decision = activeDecision ? getRouteDecision(activeDecision.id) : null;
  const modifier = getRunModifier(state.run.runModifier);

  function startRoute(routeId: RouteId) {
    dispatch({
      type: "startExpedition",
      routeId,
      survivorIds: selectedSurvivors.map((survivor) => survivor.id),
      useRation,
      useTorch,
    });
    setUseRation(false);
    setUseTorch(false);
  }

  return (
    <section className="screen">
      <div className="panel compact modifier-banner">
        <div>
          <p className="eyebrow">Run Modifier</p>
          <h3>{modifier.name}</h3>
        </div>
        <div>
          <p>{modifier.description}</p>
          <small className="modifier-forecast">{modifier.forecast}</small>
        </div>
      </div>
      {decision && (
        <div className="panel route-decision">
          <p className="eyebrow">{decision.kind === "event" ? "Route Event" : "Normal Encounter"}</p>
          <h2>{decision.name}</h2>
          <p>{decision.description}</p>
          <div className="decision-choices">
            {decision.choices.map((choice) => (
              <button
                className="decision-choice"
                disabled={!canResolveRouteChoice(state, choice)}
                title={canResolveRouteChoice(state, choice) ? choice.result : `Unavailable: ${choice.detail}`}
                aria-label={`${choice.label}. ${choice.detail}`}
                key={choice.id}
                onClick={() => dispatch({ type: "resolveRouteDecision", choiceId: choice.id })}
              >
                <strong>{choice.label}</strong>
                <span>{choice.detail}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {expedition && (
        <div className="panel compact">
          <p className="eyebrow">Active Expedition</p>
          <h2>{routes.find((route) => route.id === expedition.routeId)?.name}</h2>
          <div className="meter">
            <span style={{ width: `${expeditionProgress(expedition.startedAt, expedition.endsAt)}%` }} />
          </div>
          <p>{Math.max(0, Math.ceil((expedition.endsAt - Date.now()) / 1000))}s until return</p>
          {(expedition.usedRation || expedition.usedTorch) && (
            <div className="status-strip">
              {expedition.usedRation && <span>Ration: +6 safety, -4 fatigue</span>}
              {expedition.usedTorch && <span>Torch: +5 high-danger safety</span>}
            </div>
          )}
        </div>
      )}
      {!expedition && !activeDecision && (
        <div className="panel compact expedition-prep">
          <div>
            <p className="eyebrow">Expedition Supplies</p>
            <h3>Prepare the next route</h3>
          </div>
          <label>
            <input
              type="checkbox"
              checked={useRation}
              disabled={state.run.items.ration < 1}
              onChange={(event) => setUseRation(event.target.checked)}
            />
            <span><strong>Ration ({state.run.items.ration})</strong> +6 safety and -4 fatigue</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={useTorch}
              disabled={state.run.items.torch < 1}
              onChange={(event) => setUseTorch(event.target.checked)}
            />
            <span><strong>Torch ({state.run.items.torch})</strong> +5 safety on Danger 35+ routes</span>
          </label>
        </div>
      )}
      {!expedition && !activeDecision && (
        <div className="panel compact">
          <p className="eyebrow">Expedition Crew</p>
          <h3>Select 1–2 survivors</h3>
          <CrewPicker
            survivors={availableSurvivors}
            selectedIds={selectedIds}
            max={2}
            onChange={setSelectedIds}
            stats={["surv", "spd", "luck"]}
          />
        </div>
      )}
      <div className="panel compact">
        <p className="eyebrow">Five Beacon Skeleton</p>
        <div className="beacon-strip">
          {beacons.map((beacon) => {
            const progress = state.run.beacons[beacon.id];
            const siteFound = state.run.routes[beacon.bossRouteId].discovered;
            const status = progress.repaired ? "Lit" : progress.bossDefeated ? "Core Ready" : siteFound ? "Guardian" : "Prep";
            return (
              <div className="beacon-chip" key={beacon.id}>
                <strong>{beacon.name}</strong>
                <span>{status}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="route-grid">
        {routes.map((route) => {
          const progress = state.run.routes[route.id];
          const locked = !progress.discovered;
          const needsParty = route.kind === "boss" ? selectedSurvivors.length !== 2 : selectedSurvivors.length < 1;
          const disabled = locked || needsParty || Boolean(state.run.activeExpedition) || Boolean(activeDecision);
          const disabledReason = locked
            ? "Unavailable: clear the linked preparation route first."
            : needsParty
              ? route.kind === "boss"
                ? "Unavailable: select exactly two conscious survivors."
                : "Unavailable: select at least one conscious survivor."
              : state.run.activeExpedition
                ? "Unavailable: another expedition is active."
                : activeDecision
                  ? "Unavailable: resolve the pending route decision first."
                  : null;
          const beacon = getBeaconByBossRoute(route.id) ?? getBeaconByPrepRoute(route.id);
          const safety = calculateExpeditionSafety(state, selectedSurvivors.map((survivor) => survivor.id), route, { useRation, useTorch });
          const successChance = expeditionSuccessChance(safety, route.danger);
          const duration = calculateExpeditionDuration(route, selectedSurvivors, state);

          return (
            <article className={`route-card route-${route.id}`} key={route.id}>
              <p className="eyebrow">{locked ? "Undiscovered" : route.requirement}</p>
              <h2>{route.name}</h2>
              <p>{route.purpose}</p>
              <div className="route-meta">
                <span>{duration}s</span>
                <span>Danger {route.danger}</span>
                <span>Safety {safety}</span>
                <span>{labelSuccessChance(successChance)} {successChance}%</span>
                <span>Clears {progress.completed}</span>
                <span>Fails {progress.failed}</span>
                <span>{selectedSurvivors.length} selected</span>
                {modifier.routes?.includes(route.id) && <span>{modifier.name}: {modifier.counterClass && selectedSurvivors.some((survivor) => survivor.classId === modifier.counterClass) ? "Countered" : "Active"}</span>}
              </div>
              <div className="reward-list">
                {beacon && <span>{beacon.bonus}</span>}
                {Object.keys(route.rewards).map((reward) => (
                  <span key={reward}>{reward}</span>
                ))}
              </div>
              <button
                className="primary"
                disabled={disabled}
                title={disabledReason ?? `Start ${route.name}.`}
                onClick={() => startRoute(route.id)}
              >
                {locked ? "Find clues first" : needsParty ? (route.kind === "boss" ? "Select 2 survivors" : "Select a survivor") : "Start Expedition"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function expeditionProgress(startedAt: number, endsAt: number): number {
  const duration = endsAt - startedAt;
  if (duration <= 0) return 100;
  return Math.max(0, Math.min(100, ((Date.now() - startedAt) / duration) * 100));
}
