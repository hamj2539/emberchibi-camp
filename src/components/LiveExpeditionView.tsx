import type { Dispatch } from "react";
import { biomeMoods } from "../data/expeditionNodes";
import { getRoute } from "../data/routes";
import { canUseNodeChoice } from "../game/expeditionJourney";
import type { GameAction, GameState, PartyActivity } from "../game/state";
import { useI18n } from "../i18n";
import { expeditionCue } from "../game/presentation";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function LiveExpeditionView({ state, dispatch }: Props) {
  const { t } = useI18n();
  const expedition = state.run.activeExpedition;
  if (!expedition) return null;
  const route = getRoute(expedition.routeId);
  const mood = biomeMoods.find((entry) => entry.id === expedition.biomeMood) ?? biomeMoods[0];
  const node = expedition.nodes[expedition.currentNodeIndex] ?? expedition.nodes[expedition.nodes.length - 1];
  const nextNode = expedition.nodes[expedition.currentNodeIndex + 1];
  const party = state.run.survivors.filter((survivor) => expedition.survivorIds.includes(survivor.id));
  const progress = Math.min(100, Math.round((expedition.currentNodeIndex / expedition.nodes.length) * 100));
  const bossLeadIn = node?.type === "bossGate";
  const cue = expeditionCue(node.type, expedition.activity);

  return (
    <section className={`live-expedition mood-${mood.id} activity-${expedition.activity} node-${node.type} cue-${cue} ${bossLeadIn ? "boss-lead-in" : ""}`}>
      <div className={`ambient-layer ambient-${mood.effect}`} aria-hidden="true">
        <span /><span /><span /><span />
      </div>
      <header className="live-expedition-header">
        <div>
          <p className="eyebrow">Live Expedition · {t(`mood.${mood.id}`, undefined, mood.name)}</p>
          <h2>{t(`route.${route.id}.name`, undefined, route.name)}</h2>
          <p>{node.beat}</p>
        </div>
        <div className="expedition-mode" role="group" aria-label="Expedition mode">
          <button
            className={expedition.mode === "manual" ? "active" : ""}
            aria-pressed={expedition.mode === "manual"}
            onClick={() => dispatch({ type: "setExpeditionMode", mode: "manual" })}
          >
            {t("common.manual")}
          </button>
          <button
            className={expedition.mode === "autoSafe" ? "active" : ""}
            aria-pressed={expedition.mode === "autoSafe"}
            onClick={() => dispatch({ type: "setExpeditionMode", mode: "autoSafe" })}
          >
            {t("common.autoSafe")}
          </button>
        </div>
      </header>

      <div className="expedition-scene" aria-label={`${t(`route.${route.id}.name`, undefined, route.name)} live route scene`}>
        <span className="scene-cue" aria-live="polite">{t(`node.${node.type}`, undefined, node.type)}</span>
        <div className="route-glow" aria-hidden="true" />
        <div
          className="live-path"
          aria-label={`Route progress ${progress}%`}
          style={{ "--node-count": expedition.nodes.length } as React.CSSProperties}
        >
          <span className="path-line" />
          {expedition.nodes.map((entry, index) => (
            <div
              className={`path-node node-${entry.type} ${index < expedition.currentNodeIndex ? "resolved" : ""} ${index === expedition.currentNodeIndex ? "current" : ""}`}
              key={entry.id}
              title={`${entry.title}: ${entry.type}`}
            >
              <i aria-hidden="true" />
              <small>{index + 1}</small>
            </div>
          ))}
        </div>
        <div className="party-stage" style={{ "--journey-progress": `${Math.max(4, progress)}%` } as React.CSSProperties}>
          {party.map((survivor, index) => (
            <div className={`live-chibi chibi-${index} state-${expedition.activity}`} key={survivor.id}>
              <span className={`portrait portrait-mini portrait-${survivor.id.replace("survivor-", "")}`} aria-hidden="true" />
              <strong>{survivor.name}</strong>
              <small>{t(`activity.${expedition.activity}`, undefined, activityLabel(expedition.activity))}</small>
            </div>
          ))}
        </div>
        {bossLeadIn && (
          <div className="guardian-omen">
            <span aria-hidden="true">◆</span>
            <strong>{route.kind === "boss" ? t("explore.guardianStirs") : t("explore.gateAnswers")}</strong>
          </div>
        )}
      </div>

      <div className="live-status-grid">
        <article>
          <span>{t("explore.currentNode")}</span>
          <strong>{node.title}</strong>
          <small>{t(`node.${node.type}`, undefined, node.type)}</small>
        </article>
        <article>
          <span>{t("explore.nextNode")}</span>
          <strong>{nextNode?.title ?? t("common.routeEnd")}</strong>
          <small>{nextNode ? t(`node.${nextNode.type}`, undefined, nextNode.type) : t("common.destination")}</small>
        </article>
        <article>
          <span>{t("camp.supplies")}</span>
          <strong>{[expedition.usedRation ? "Ration" : "", expedition.usedTorch ? "Torch" : ""].filter(Boolean).join(" · ") || t("common.none")}</strong>
          <small>{t("explore.safety")} {expedition.nodeSafety >= 0 ? "+" : ""}{expedition.nodeSafety}</small>
        </article>
        <article>
          <span>{t("explore.routeUpside")}</span>
          <strong>x{expedition.rewardMultiplier.toFixed(2)} rewards</strong>
          <small>+{expedition.scoreBonus} score</small>
        </article>
      </div>

      {expedition.paused && node.major && (
        <div className="expedition-choice-card" role="dialog" aria-labelledby="node-choice-title">
          <p className="eyebrow">{t("explore.paused")} · {t("explore.majorChoice")}</p>
          <h3 id="node-choice-title">{node.title}</h3>
          <p>{node.flavor}</p>
          <div className="node-choice-grid">
            {node.choices.map((choice) => {
              const enabled = canUseNodeChoice(state, choice);
              return (
                <button
                  className={`node-choice choice-${choice.id}`}
                  disabled={!enabled}
                  title={enabled ? choice.result : `Unavailable: ${choice.requirementLabel ?? choice.detail}`}
                  key={choice.id}
                  onClick={() => dispatch({ type: "resolveExpeditionNode", choiceId: choice.id })}
                >
                  <span>{choice.id === "safe" ? t("explore.reliable") : choice.id === "risky" ? t("explore.highUpside") : t("explore.hiddenRoute")}</span>
                  <strong>{choice.label}</strong>
                  <small>{choice.detail}</small>
                  {choice.requirementLabel && <em>{choice.requirementLabel}</em>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="expedition-teasers" aria-live="polite">
        {expedition.teasers.slice(0, 3).map((teaser, index) => <p style={{ "--teaser-index": index } as React.CSSProperties} key={`${teaser}-${index}`}>{teaser}</p>)}
      </div>
    </section>
  );
}

function activityLabel(activity: PartyActivity): string {
  return {
    walking: "Walking",
    gathering: "Gathering",
    bracing: "Bracing",
    inspecting: "Inspecting",
    resting: "Resting",
    reacting: "Danger",
  }[activity];
}
