import type { ReactNode } from "react";
import { useI18n } from "../i18n";

type BadgeTone = "neutral" | "good" | "risk" | "cost" | "info";

export function VisualBadge({ label, value, tone = "neutral" }: { label: string; value?: string | number; tone?: BadgeTone }) {
  const { t } = useI18n();
  const localizedLabel = t(`visual.${label.toLowerCase().replace(/\s+/g, "")}`, undefined, label);
  return <span className={`visual-badge tone-${tone}`} aria-label={value === undefined ? localizedLabel : `${localizedLabel}: ${value}`} title={value === undefined ? localizedLabel : `${localizedLabel}: ${value}`}><b>{localizedLabel}</b>{value !== undefined && <strong>{value}</strong>}</span>;
}

export function DetailsDisclosure({ summary = "Details", children }: { summary?: string; children: ReactNode }) {
  const { t } = useI18n();
  return <details className="details-disclosure"><summary>{t(`visual.${summary.toLowerCase().replace(/\s+/g, "")}`, undefined, summary)}</summary><div>{children}</div></details>;
}

export function CompactTimeline({ entries, label }: { entries: string[]; label: string }) {
  const { t } = useI18n();
  const recent = entries.slice(0, 6);
  return (
    <details className="compact-timeline" open>
      <summary aria-label={t(`visual.${label.toLowerCase().replace(/\s+/g, "")}`, undefined, label)}>{t(`visual.${label.toLowerCase().replace(/\s+/g, "")}`, undefined, label)} <span>{entries.length}</span></summary>
      <ol>
        {recent.map((entry, index) => (
          <li className={index === 0 ? "important" : ""} key={`${entry}-${index}`}>
            <b aria-hidden="true">{timelineMark(entry)}</b><span>{shortenLog(entry)}</span>
            <DetailsDisclosure summary="More"><p>{entry}</p></DetailsDisclosure>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function choicePreview(effect: { resources?: Record<string, number | undefined>; items?: Record<string, number | undefined>; fatigue?: number; injury?: number; hp?: number; routeProgress?: number; score?: number; runItem?: string }) {
  const badges: { label: string; value: string | number; tone: BadgeTone }[] = [];
  if (effect.score) badges.push({ label: "Score", value: effect.score > 0 ? `+${effect.score}` : effect.score, tone: effect.score > 0 ? "good" : "risk" });
  if (effect.routeProgress) badges.push({ label: "Route", value: `+${effect.routeProgress}`, tone: "good" });
  if (effect.runItem) badges.push({ label: "Relic", value: "+1", tone: "good" });
  if (effect.resources) Object.values(effect.resources).forEach((value) => value && badges.push({ label: value > 0 ? "Gain" : "Cost", value: value > 0 ? `+${value}` : value, tone: value > 0 ? "good" : "cost" }));
  if (effect.items) Object.values(effect.items).forEach((value) => value && badges.push({ label: value > 0 ? "Item" : "Use", value: value > 0 ? `+${value}` : value, tone: value > 0 ? "good" : "cost" }));
  if (effect.fatigue) badges.push({ label: effect.fatigue > 0 ? "Fatigue" : "Rest", value: effect.fatigue > 0 ? `+${effect.fatigue}` : effect.fatigue, tone: effect.fatigue > 0 ? "risk" : "good" });
  if (effect.injury) badges.push({ label: "Injury", value: `+${effect.injury}`, tone: "risk" });
  if (effect.hp) badges.push({ label: effect.hp > 0 ? "Heal" : "HP", value: effect.hp > 0 ? `+${effect.hp}` : effect.hp, tone: effect.hp > 0 ? "good" : "risk" });
  return badges.slice(0, 4);
}

function shortenLog(entry: string): string {
  return entry.replace(/\.$/, "").split(/[.:]/)[0].slice(0, 72);
}

function timelineMark(entry: string): string {
  if (/collapse|failed|injur|missed/i.test(entry)) return "!";
  if (/repaired|defeated|worked|completed|lit/i.test(entry)) return "+";
  if (/crisis|warning|intent/i.test(entry)) return "?";
  return ">";
}
