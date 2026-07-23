import { useState, type Dispatch } from "react";
import { beacons, getBeaconByBossRoute, getBeaconByPrepRoute } from "../data/beacons";
import { routes } from "../data/routes";
import { getRouteDecision, getRunModifier } from "../data/routeContent";
import type { GameAction, GameState, RouteId } from "../game/state";
import { calculateExpeditionDuration, calculateExpeditionSafety, expeditionSuccessChance, labelSuccessChance } from "../game/expedition";
import { canResolveRouteChoice } from "../game/routeDecisions";
import { alpha7Events } from "../data/alpha7Content";
import { bondLevel } from "../game/journal";
import { CrewPicker } from "./CrewPicker";
import { GameIcon, type GameIconName } from "./GameIcon";
import { LiveExpeditionView } from "./LiveExpeditionView";
import { useI18n } from "../i18n";
import { DetailsDisclosure, VisualBadge, choicePreview } from "./VisualUI";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function ExploreScreen({ state, dispatch }: Props) {
  const { t } = useI18n();
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

  if (expedition) {
    return (
      <section className="screen expedition-live-screen">
        <LiveExpeditionView dispatch={dispatch} state={state} />
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="panel compact modifier-banner">
        <div>
          <p className="eyebrow">{t("explore.modifier")}</p>
          <h3>{t(`modifier.${modifier.id}.name`, undefined, modifier.name)}</h3>
        </div>
        <div>
          <p>{t(`modifier.${modifier.id}.description`, undefined, modifier.description)}</p>
          <small className="modifier-forecast">{modifier.forecast}</small>
        </div>
      </div>
      {decision && (
        <div className="panel route-decision">
          <div className="visual-card-heading">
            <span className={`decision-emblem decision-${decision.kind}`} aria-label={decision.kind === "event" ? "Route event" : "Normal encounter"}>{decision.kind === "event" ? "EV" : "EN"}</span>
            <div><p className="eyebrow">{decision.kind === "event" ? "Route Event" : "Normal Encounter"}</p><h2>{decision.name}</h2></div>
            <VisualBadge label="Choices" value={decision.choices.length} tone="info" />
          </div>
          <DetailsDisclosure summary="Scene details"><p>{decision.description}</p></DetailsDisclosure>
          <div className="decision-choices">
            {decision.choices.map((choice) => {
              const available = canResolveRouteChoice(state, choice);
              return <button className="decision-choice visual-choice" disabled={!available} title={available ? choice.result : `Unavailable: ${choice.detail}`} aria-label={`${choice.label}. ${choice.detail}`} key={choice.id} onClick={() => dispatch({ type: "resolveRouteDecision", choiceId: choice.id })}>
                <strong>{choice.label}</strong>
                <div className="choice-badges">{choicePreview(choice.effect).map((badge, index) => <VisualBadge key={`${badge.label}-${index}`} {...badge} />)}</div>
                <small>{choice.requirement ? choice.detail : available ? "Ready" : "Unavailable"}</small>
              </button>;
            })}
          </div>
        </div>
      )}
      {!expedition && !activeDecision && (
        <div className="panel compact expedition-prep">
          <div>
            <p className="eyebrow">{t("explore.supplies")}</p>
            <h3>{t("explore.prepare")}</h3>
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
          <p className="eyebrow">{t("explore.crew")}</p>
          <h3>{t("explore.selectCrew")}</h3>
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
        <p className="eyebrow">{t("explore.beacons")}</p>
        <div className="beacon-strip">
          {beacons.map((beacon) => {
            const progress = state.run.beacons[beacon.id];
            const siteFound = state.run.routes[beacon.bossRouteId].discovered;
            const status = progress.repaired ? "Lit" : progress.bossDefeated ? "Core Ready" : siteFound ? "Guardian" : "Prep";
            return (
              <div className="beacon-chip" key={beacon.id}>
                <GameIcon
                  name={`${beacon.id}Beacon${progress.repaired ? "Lit" : "Unlit"}` as GameIconName}
                  label={`${beacon.name} ${progress.repaired ? "lit" : "unlit"}`}
                  size="sm"
                />
                <strong>{t(`beacon.${beacon.id}.name`, undefined, beacon.name)}</strong>
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
          const bossPartySize = state.run.vows.includes("soloGuardian") ? 1 : 2;
          const needsParty = route.kind === "boss" ? selectedSurvivors.length !== bossPartySize : selectedSurvivors.length < 1;
          const disabled = locked || needsParty || Boolean(state.run.activeExpedition) || Boolean(activeDecision);
          const disabledReason = locked
            ? "Unavailable: clear the linked preparation route first."
            : needsParty
              ? route.kind === "boss"
                ? `Unavailable: select exactly ${bossPartySize} conscious survivor${bossPartySize === 1 ? "" : "s"}.`
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
          const routeHints = alpha7Events.filter((event) => {
            if (!event.routes.includes(route.id)) return false;
            if (event.chainId && event.chainStep !== undefined) {
              const progress = state.run.eventChains[event.chainId];
              return !progress.outcome && progress.step === event.chainStep;
            }
            if (event.storyFor) {
              return selectedSurvivors.some((survivor) => survivor.id === event.storyFor) &&
                !state.run.storyEventsSeen.includes(event.storyId ?? event.id) &&
                bondLevel(state.legacy.bonds[event.storyFor] ?? 0) >= (event.minBond ?? 0);
            }
            return false;
          });

          return (
            <article className={`route-card route-${route.id}`} key={route.id}>
              <div className="visual-card-heading route-heading"><span className="route-emblem" aria-label={route.kind === "boss" ? "Guardian route" : "Expedition route"}>{route.kind === "boss" ? "B" : "R"}</span><div><p className="eyebrow">{locked ? "Undiscovered" : route.requirement}</p><h2>{t(`route.${route.id}.name`, undefined, route.name)}</h2></div></div>
              <div className="route-scanline"><VisualBadge label="Time" value={`${duration}s`} /><VisualBadge label="Risk" value={route.danger} tone={route.danger >= 40 ? "risk" : "neutral"} /><VisualBadge label="Safe" value={`${successChance}%`} tone={successChance >= 70 ? "good" : "risk"} /><VisualBadge label="Crew" value={selectedSurvivors.length} tone="info" /></div>
              <DetailsDisclosure summary="Route details"><p>{t(`route.${route.id}.purpose`, undefined, route.purpose)}</p><div className="route-meta"><span>Safety {safety}</span><span>{labelSuccessChance(successChance)}</span><span>Clears {progress.completed}</span><span>Fails {progress.failed}</span></div></DetailsDisclosure>
              <div className="reward-list">
                {beacon && <span>{beacon.bonus}</span>}
                {state.legacy.projects.includes("trailArchive") && routeHints.length === 0 && (
                  <span className="story-hint">Trail Archive: this route has no unresolved story lead.</span>
                )}
                {routeHints.slice(0, 2).map((hint) => <span className="story-hint" key={hint.id}>Story lead: {hint.name}</span>)}
                {route.id === "moonwellPath" && state.legacy.equippedRelics.includes("Coalglass Charm") && (
                  <span className="story-hint">Relic resonance: Coalglass Charm</span>
                )}
                {Object.keys(route.rewards).map((reward) => (
                  <span key={reward}>{reward}</span>
                ))}
              </div>
              <button
                className="primary"
                disabled={disabled}
                title={disabledReason ?? `Start ${t(`route.${route.id}.name`, undefined, route.name)}.`}
                onClick={() => startRoute(route.id)}
              >
                {locked ? "Find clues first" : needsParty ? (route.kind === "boss" ? `Select ${bossPartySize} survivor${bossPartySize === 1 ? "" : "s"}` : "Select a survivor") : "Start Expedition"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
