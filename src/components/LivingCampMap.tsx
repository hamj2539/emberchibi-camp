import { useState, type Dispatch } from "react";
import { beacons } from "../data/beacons";
import { getCrisis } from "../data/crises";
import { canResolveCrisisChoice } from "../game/crises";
import { getCurrentObjective } from "../game/objectives";
import type { BeaconId, GameAction, GameState, IdleJob, Survivor } from "../game/state";
import { mapActionItems, mapBeaconStatus } from "../game/campMap";
import { useI18n } from "../i18n";
import { DetailsDisclosure, VisualBadge, choicePreview } from "./VisualUI";

type Props = { state: GameState; dispatch: Dispatch<GameAction> };
type Sheet = "jobs" | "crisis" | "recruit" | null;

const stationByJob: Record<IdleJob, { label: string; x: number; y: number; glyph: string }> = {
  rest: { label: "Shelter", x: 37, y: 67, glyph: "REST" }, forage: { label: "Trail edge", x: 10, y: 56, glyph: "FOR" },
  craft: { label: "Bench", x: 60, y: 68, glyph: "FIX" }, guard: { label: "Watch post", x: 78, y: 35, glyph: "GUARD" },
  cook: { label: "Cook fire", x: 51, y: 75, glyph: "COOK" }, research: { label: "Map table", x: 45, y: 43, glyph: "MAP" },
};

export function LivingCampMap({ state, dispatch }: Props) {
  const { t } = useI18n();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selectedSurvivorId, setSelectedSurvivorId] = useState<string | null>(null);
  const objective = getCurrentObjective(state);
  const crisis = state.run.activeCrisis ? getCrisis(state.run.activeCrisis.id) : null;
  const expedition = state.run.activeExpedition;
  const lit = beacons.filter((beacon) => state.run.beacons[beacon.id].repaired).length;
  const actions = mapActionItems(state);
  const selectedSurvivor = state.run.survivors.find((survivor) => survivor.id === selectedSurvivorId) ?? null;
  const activeBeaconId = expedition ? beaconForRoute(expedition.routeId) : null;

  return <section className="living-camp-map" aria-label="Living camp and world map">
    <div className="camp-map-hud">
      <div className="map-run-state"><span className="map-fire" aria-hidden="true" /><strong>{lit}/5</strong><small>{t("map.beacons")}</small></div>
      <button className="map-objective" title={objective.detail} onClick={() => dispatch({ type: "setScreen", screen: objective.screen })}><span aria-hidden="true">GO</span><strong>{objective.title}</strong></button>
      <div className="map-resource-hud" aria-label={t("map.resources")}><VisualBadge label="Food" value={Math.floor(state.run.resources.food)} /><VisualBadge label={t("camp.fire")} value={Math.round(state.run.campPressure.fire)} tone={state.run.campPressure.fire < 35 ? "risk" : "good"} /><VisualBadge label={t("camp.morale")} value={Math.round(state.run.campPressure.morale)} tone={state.run.campPressure.morale < 35 ? "risk" : "good"} /></div>
    </div>

    <div className="world-map-stage">
      <div className="map-ambient" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="camp-core" aria-label="Emberchibi camp" title={t("map.camp")}><span className="campfire-flame" aria-hidden="true" /><span className="campfire-log log-one" aria-hidden="true" /><span className="campfire-log log-two" aria-hidden="true" /><span className="camp-smoke" aria-hidden="true" /></div>
      {Object.entries(stationByJob).map(([job, station]) => <CampStation key={job} job={job as IdleJob} {...station} active={state.run.survivors.some((survivor) => survivor.job === job && !survivor.onExpedition)} />)}
      {beacons.map((beacon, index) => <BeaconNode beaconId={beacon.id} index={index} key={beacon.id} state={state} onOpen={() => dispatch({ type: "setScreen", screen: mapBeaconStatus(state, beacon.id) === "repair" ? "repair" : "explore" })} />)}
      {state.run.gate.status !== "sealed" && <button className="map-gate" aria-label="Cinder Gate" title="Cinder Gate" onClick={() => dispatch({ type: "setScreen", screen: "gate" })}><span aria-hidden="true" /></button>}
      {beacons.map((beacon, index) => <MapRoute key={beacon.id} index={index} beaconId={beacon.id} active={activeBeaconId === beacon.id} progress={expedition ? expeditionProgress(expedition.currentNodeIndex, expedition.nodes.length) : 0} onOpen={() => dispatch({ type: "setScreen", screen: "explore" })} />)}
      {state.run.survivors.filter((survivor) => !survivor.onExpedition).map((survivor) => <SurvivorToken survivor={survivor} key={survivor.id} onOpen={() => { setSelectedSurvivorId(survivor.id); setSheet("jobs"); }} />)}
      {expedition && <div className="map-expedition-token" style={{ "--expedition-progress": `${20 + expeditionProgress(expedition.currentNodeIndex, expedition.nodes.length) * 0.65}%` } as React.CSSProperties} title={t("map.expedition")}><span className="portrait portrait-mini portrait-scout" aria-hidden="true" /><b>{expedition.paused ? "!" : "GO"}</b></div>}
      <div className="map-action-ring">{actions.map((action) => <ActionIcon action={action} key={action.id} onOpen={() => {
        if (action.id === "crisis") setSheet("crisis"); else if (action.id === "recruit") setSheet("recruit"); else dispatch({ type: "setScreen", screen: action.screen });
      }} />)}</div>
    </div>

    <details className="map-context"><summary>{t("map.details")}</summary><div><VisualBadge label={t("camp.shelter")} value={Math.round(state.run.campPressure.shelter)} /><VisualBadge label={t("camp.supplies")} value={Math.round(state.run.campPressure.supplies)} /><VisualBadge label={t("camp.collapse")} value={`${Math.round(state.run.collapseMeter)}%`} tone={state.run.collapseMeter >= 70 ? "risk" : "neutral"} />{expedition && <p>{expedition.paused ? t("map.waiting") : t("map.moving")}.</p>}</div></details>

    {sheet === "jobs" && selectedSurvivor && <DetailSheet title={selectedSurvivor.name} onClose={() => setSheet(null)}><p>{selectedSurvivor.onExpedition ? t("map.onExpedition") : t("map.assign")}</p><div className="sheet-job-grid">{(Object.keys(stationByJob) as IdleJob[]).map((job) => <button className={selectedSurvivor.job === job ? "active" : ""} disabled={selectedSurvivor.onExpedition} key={job} onClick={() => dispatch({ type: "assignJob", survivorId: selectedSurvivor.id, job })}><b>{stationByJob[job].glyph}</b><span>{stationByJob[job].label}</span></button>)}</div></DetailSheet>}
    {sheet === "crisis" && crisis && state.run.activeCrisis && <DetailSheet title={crisis.name} onClose={() => setSheet(null)}><div className="sheet-badges"><VisualBadge label="Deadline" value={`${Math.max(0, Math.ceil(state.run.activeCrisis.deadlineAt - state.run.daySeconds))}s`} tone="risk" /><VisualBadge label="Severity" value={crisis.severity} tone="risk" /></div><div className="sheet-choice-grid">{crisis.choices.map((choice) => <button className="sheet-choice" disabled={!canResolveCrisisChoice(state, choice)} key={choice.id} title={choice.detail} onClick={() => { dispatch({ type: "resolveCrisis", choiceId: choice.id }); setSheet(null); }}><strong>{choice.label}</strong><div>{choicePreview(choice.effect).map((badge, index) => <VisualBadge key={`${badge.label}-${index}`} {...badge} />)}</div></button>)}</div><DetailsDisclosure summary="Details"><p>{crisis.warning}</p></DetailsDisclosure></DetailSheet>}
    {sheet === "recruit" && state.run.recruitEvent && <DetailSheet title={state.run.recruitEvent.name} onClose={() => setSheet(null)}><p>{state.run.recruitEvent.status === "available" ? t("map.recruitHelp") : state.run.recruitEvent.branchNote ?? "Follow this lead on a route."}</p><button className="primary" onClick={() => dispatch({ type: "setScreen", screen: "explore" })}>{t("map.viewLead")}</button></DetailSheet>}
  </section>;
}

export function CampStation({ job, label, x, y, active }: { job: IdleJob; label: string; x: number; y: number; active: boolean }) {
  return <div className={`camp-station station-${job} ${active ? "occupied" : ""}`} style={{ left: `${x}%`, top: `${y}%` }} title={label} aria-label={`${label}${active ? ", active" : ""}`}><span className="station-object" aria-hidden="true"><i /><i /><i /></span><span className="station-shadow" aria-hidden="true" /></div>;
}

export function SurvivorToken({ survivor, onOpen }: { survivor: Survivor; onOpen: () => void }) {
  const station = stationByJob[survivor.job];
  const injured = survivor.injury >= 10 || survivor.currentHp <= survivor.stats.hp / 3;
  return <button className={`map-survivor token-${survivor.job} ${injured ? "injured" : ""} ${survivor.currentHp <= 0 ? "downed" : ""}`} style={{ left: `${station.x + 3}%`, top: `${station.y - 5}%` }} title={`${survivor.name}: ${station.label}`} aria-label={`${survivor.name}, ${station.label}`} onClick={onOpen}><span className="token-activity" aria-hidden="true" /><span className={`portrait portrait-mini portrait-${survivor.classId}`} aria-hidden="true" /></button>;
}

export function MapRoute({ index, beaconId, active, progress, onOpen }: { index: number; beaconId: BeaconId; active: boolean; progress: number; onOpen: () => void }) {
  const point = beaconPoint(index);
  return <button className={`map-route route-to-${beaconId} ${active ? "active" : ""}`} style={{ "--route-x": `${point.x}%`, "--route-y": `${point.y}%`, "--route-progress": `${progress}%` } as React.CSSProperties} aria-label={`Route to ${beaconId} Beacon`} title={`Route to ${beaconId} Beacon`} onClick={onOpen}><span /></button>;
}

export function BeaconNode({ beaconId, index, state, onOpen }: { beaconId: BeaconId; index: number; state: GameState; onOpen: () => void }) {
  const point = beaconPoint(index); const status = mapBeaconStatus(state, beaconId);
  return <button className={`map-beacon beacon-${beaconId} state-${status}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} onClick={onOpen} aria-label={`${beaconId} Beacon, ${status}`} title={`${beaconId} Beacon: ${status}`}><span className="beacon-halo" aria-hidden="true" /><span className="beacon-structure" aria-hidden="true"><i /><i /><i /></span><span className="beacon-crystal" aria-hidden="true" /></button>;
}

export function ActionIcon({ action, onOpen }: { action: { id: string; label: string; glyph: string; screen: "explore" | "boss" | "repair" | "gate" | "end" }; onOpen: () => void }) {
  return <button className={`map-action-icon action-${action.id}`} title={action.label} aria-label={action.label} onClick={onOpen}><b aria-hidden="true" /></button>;
}

export function DetailSheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="map-sheet-backdrop" role="dialog" aria-modal="true" aria-label={title}><section className="map-detail-sheet"><button className="sheet-close" aria-label="Close" title="Close" onClick={onClose}>X</button><h3>{title}</h3>{children}</section></div>;
}

function beaconPoint(index: number) { return [{ x: 16, y: 18 }, { x: 82, y: 18 }, { x: 89, y: 63 }, { x: 70, y: 85 }, { x: 22, y: 83 }][index]; }
function expeditionProgress(index: number, total: number) { return Math.round((index / Math.max(1, total - 1)) * 100); }
function beaconForRoute(routeId: string): BeaconId { return beacons.find((beacon) => beacon.prepRouteId === routeId || beacon.bossRouteId === routeId)?.id ?? "ember"; }
