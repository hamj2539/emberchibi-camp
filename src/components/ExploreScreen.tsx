import type { Dispatch } from "react";
import { routes } from "../data/routes";
import type { GameAction, GameState, RouteId } from "../game/state";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function ExploreScreen({ state, dispatch }: Props) {
  const availableSurvivors = state.run.survivors.filter((survivor) => !survivor.onExpedition);
  const expedition = state.run.activeExpedition;

  function startRoute(routeId: RouteId) {
    const partySize = routeId === "emberBeaconSite" ? 2 : 1;
    dispatch({
      type: "startExpedition",
      routeId,
      survivorIds: availableSurvivors.slice(0, partySize).map((survivor) => survivor.id),
    });
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
        </div>
      )}
      <div className="route-grid">
        {routes.map((route) => {
          const progress = state.run.routes[route.id];
          const locked = !progress.discovered;
          const needsParty = route.id === "emberBeaconSite" && availableSurvivors.length < 2;
          const disabled = locked || needsParty || Boolean(state.run.activeExpedition) || availableSurvivors.length === 0;

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
