import type { Dispatch } from "react";
import { biomeMoods } from "../data/expeditionNodes";
import { getRoute } from "../data/routes";
import { canUseNodeChoice } from "../game/expeditionJourney";
import type { ExpeditionNodeType, GameAction, GameState, PartyActivity } from "../game/state";
import { useI18n } from "../i18n";
import { expeditionCue } from "../game/presentation";
import { DetailsDisclosure, VisualBadge } from "./VisualUI";

type Props = { state: GameState; dispatch: Dispatch<GameAction> };

const nodeSymbols: Record<ExpeditionNodeType, string> = {
  resource: "RES", event: "?", encounter: "EN", hazard: "!", rest: "REST", shrine: "RUIN", shortcut: "WAY", clue: "CLUE", bossGate: "BEACON",
};

export function LiveExpeditionView({ state, dispatch }: Props) {
  const { t } = useI18n();
  const expedition = state.run.activeExpedition;
  if (!expedition) return null;
  const route = getRoute(expedition.routeId);
  const mood = biomeMoods.find((entry) => entry.id === expedition.biomeMood) ?? biomeMoods[0];
  const node = expedition.nodes[expedition.currentNodeIndex] ?? expedition.nodes[expedition.nodes.length - 1];
  const party = state.run.survivors.filter((survivor) => expedition.survivorIds.includes(survivor.id));
  const progress = Math.min(100, Math.round((expedition.currentNodeIndex / Math.max(1, expedition.nodes.length - 1)) * 100));
  const cue = expeditionCue(node.type, expedition.activity);
  const activity = sceneActivity(expedition.activity, node.type, expedition.currentNodeIndex === expedition.nodes.length - 1);
  const supplies = [expedition.usedRation ? "Ration" : "", expedition.usedTorch ? "Torch" : ""].filter(Boolean).join(" · ") || t("common.none");

  return (
    <section className={`live-expedition scene-first mood-${mood.id} activity-${activity} node-${node.type} cue-${cue} ${node.type === "bossGate" ? "boss-lead-in" : ""}`}>
      <div className={`ambient-layer ambient-${mood.effect}`} aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>
      <div className="scene-hud scene-top-hud">
        <div><p className="eyebrow">{t(`mood.${mood.id}`, undefined, mood.name)}</p><h2>{t(`route.${route.id}.name`, undefined, route.name)}</h2></div>
        <div className="scene-mode" role="group" aria-label="Expedition mode">
          <button className={expedition.mode === "manual" ? "active" : ""} aria-pressed={expedition.mode === "manual"} title="Manual choices" onClick={() => dispatch({ type: "setExpeditionMode", mode: "manual" })}>M</button>
          <button className={expedition.mode === "autoSafe" ? "active" : ""} aria-pressed={expedition.mode === "autoSafe"} title="Auto-safe choices" onClick={() => dispatch({ type: "setExpeditionMode", mode: "autoSafe" })}>A</button>
        </div>
      </div>

      <div className="diorama-scene" aria-label={`${t(`route.${route.id}.name`, undefined, route.name)} expedition diorama`}>
        <div className="scene-backdrop" aria-hidden="true"><i /><i /><i /></div>
        <div className="diorama-path" aria-label={`Route progress ${progress}%`} style={{ "--node-count": expedition.nodes.length } as React.CSSProperties}>
          <span className="diorama-trail" />
          {expedition.nodes.map((entry, index) => {
            const position = nodePosition(index, expedition.nodes.length);
            return <div className={`diorama-node object-${entry.type} ${index < expedition.currentNodeIndex ? "resolved" : ""} ${index === expedition.currentNodeIndex ? "current" : ""}`} style={position} key={entry.id} title={`${entry.title}: ${entry.type}`} aria-label={`${entry.title}, ${entry.type}`}>
              <b aria-hidden="true">{nodeSymbols[entry.type]}</b><span className="node-spark" aria-hidden="true" />
            </div>;
          })}
        </div>
        <div className="scene-beat" aria-live="polite"><span>{nodeSymbols[node.type]}</span><strong>{shortBeat(node.type, t)}</strong></div>
        <div className="party-stage diorama-party" style={{ "--journey-progress": `${Math.max(5, progress)}%` } as React.CSSProperties}>
          {party.map((survivor, index) => <div className={`live-chibi chibi-${index} state-${activity}`} key={survivor.id}>
            <span className={`portrait portrait-mini portrait-${survivor.id.replace("survivor-", "")}`} aria-hidden="true" /><small>{activityLabel(activity, t)}</small>
          </div>)}
        </div>
        {node.type === "bossGate" && <div className="guardian-omen"><span aria-hidden="true">BEACON</span><strong>{t("explore.guardianStirs")}</strong></div>}
        <div className="scene-floaters" aria-live="polite">{expedition.teasers.slice(0, 2).map((teaser, index) => <span key={`${teaser}-${index}`}>{shortTeaser(teaser)}</span>)}</div>
      </div>

      <div className="scene-hud scene-bottom-hud">
        <VisualBadge label="Risk" value={node.type === "hazard" || node.type === "encounter" ? "HIGH" : "LOW"} tone={cue === "threat" || cue === "hazard" ? "risk" : "good"} />
        <VisualBadge label="Supplies" value={supplies} tone="info" />
        <VisualBadge label="Node" value={`${expedition.currentNodeIndex + 1}/${expedition.nodes.length}`} tone="neutral" />
        <DetailsDisclosure summary="Route details"><p>{node.flavor}</p><p>{node.beat}</p></DetailsDisclosure>
      </div>

      {expedition.paused && node.major && <div className="scene-choice-backdrop" role="dialog" aria-labelledby="node-choice-title">
        <div className="scene-choice-sheet">
          <span className={`choice-scene-icon object-${node.type}`} aria-hidden="true">{nodeSymbols[node.type]}</span>
          <div><p className="eyebrow">{t("explore.majorChoice")}</p><h3 id="node-choice-title">{node.title}</h3></div>
          <p className="choice-summary">{shortFlavor(node.flavor)}</p>
          <div className="scene-choice-grid">{node.choices.map((choice) => {
            const enabled = canUseNodeChoice(state, choice);
            return <button className={`scene-choice choice-${choice.id}`} disabled={!enabled} title={enabled ? choice.result : `Unavailable: ${choice.requirementLabel ?? choice.detail}`} key={choice.id} onClick={() => dispatch({ type: "resolveExpeditionNode", choiceId: choice.id })}>
              <span className="choice-icon" aria-hidden="true">{choice.id === "safe" ? "SAFE" : choice.id === "risky" ? "RISK" : "WAY"}</span><strong>{choice.label}</strong>
              <small>{choice.requirementLabel ?? choice.detail}</small>
            </button>;
          })}</div>
          <DetailsDisclosure summary="Details"><p>{node.flavor}</p></DetailsDisclosure>
        </div>
      </div>}
    </section>
  );
}

function nodePosition(index: number, total: number): React.CSSProperties {
  const x = total <= 1 ? 50 : 8 + (index / (total - 1)) * 84;
  const y = [68, 42, 61, 33, 58, 25][index] ?? 50;
  return { left: `${x}%`, top: `${y}%` };
}

function sceneActivity(activity: PartyActivity, type: ExpeditionNodeType, last: boolean): string {
  if (last && type !== "bossGate") return "celebrating";
  if (type === "clue" || type === "shrine") return "investigating";
  if (type === "hazard" || type === "encounter" || type === "bossGate") return activity === "bracing" ? "bracing" : "startled";
  if (type === "rest") return "resting";
  if (type === "resource") return "gathering";
  return activity === "walking" ? "walking" : "idle";
}

function activityLabel(activity: string, t: (key: string, values?: Record<string, string | number>, fallback?: string) => string): string {
  const key = activity === "investigating" ? "inspecting" : activity === "startled" ? "reacting" : activity === "idle" || activity === "celebrating" ? "walking" : activity;
  return t(`activity.${key}`, undefined, activity);
}

function shortBeat(type: ExpeditionNodeType, t: (key: string, values?: Record<string, string | number>, fallback?: string) => string): string {
  return t(`node.${type}`, undefined, type).toUpperCase();
}

function shortTeaser(teaser: string): string { return teaser.replace(/\.$/, "").split(/[.:]/)[0].slice(0, 30); }
function shortFlavor(flavor: string): string { return flavor.split(/[.!]/)[0].slice(0, 90); }
