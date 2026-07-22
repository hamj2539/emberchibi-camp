import { useState, type Dispatch } from "react";
import { beacons, getBeaconByBossRoute, getBeaconByPrepRoute } from "../data/beacons";
import { routes } from "../data/routes";
import type { GameAction, GameState, RouteId } from "../game/state";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function ExploreScreen({ state, dispatch }: Props) {
  const [useRation, setUseRation] = useState(false);
  const [useTorch, setUseTorch] = useState(false);
  const availableSurvivors = state.run.survivors.filter((survivor) => !survivor.onExpedition);
  const expedition = state.run.activeExpedition;

  function startRoute(routeId: RouteId) {
    const route = routes.find((item) => item.id === routeId);
    const partySize = route?.kind === "boss" ? 2 : 1;
    dispatch({
      type: "startExpedition",
      routeId,
      survivorIds: availableSurvivors.slice(0, partySize).map((survivor) => survivor.id),
      useRation,
      useTorch,
    });
    setUseRation(false);
    setUseTorch(false);
  }

  return (
    <section className="screen">
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
      {!expedition && (
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
          const needsParty = route.kind === "boss" && availableSurvivors.length < 2;
          const disabled = locked || needsParty || Boolean(state.run.activeExpedition) || availableSurvivors.length === 0;
          const beacon = getBeaconByBossRoute(route.id) ?? getBeaconByPrepRoute(route.id);

          return (
            <article className={`route-card route-${route.id}`} key={route.id}>
              <p className="eyebrow">{locked ? "Undiscovered" : route.requirement}</p>
              <h2>{route.name}</h2>
              <p>{route.purpose}</p>
              <div className="route-meta">
                <span>{route.durationSeconds}s</span>
                <span>Danger {route.danger}</span>
                <span>Clears {progress.completed}</span>
                <span>Fails {progress.failed}</span>
                <span>{availableSurvivors.length} ready</span>
              </div>
              <div className="reward-list">
                {beacon && <span>{beacon.bonus}</span>}
                {Object.keys(route.rewards).map((reward) => (
                  <span key={reward}>{reward}</span>
                ))}
              </div>
              <button className="primary" disabled={disabled} onClick={() => startRoute(route.id)}>
                {locked ? "Find clues first" : needsParty ? "Needs 2 survivors" : "Start Expedition"}
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
