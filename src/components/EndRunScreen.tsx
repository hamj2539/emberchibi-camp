import type { Dispatch } from "react";
import { describeChestGrade } from "../game/rewards";
import { labelChestGrade } from "../game/scoring";
import type { GameAction, GameState } from "../game/state";
import { GameIcon } from "./GameIcon";
import { bondLevel } from "../game/journal";
import { challengeDefinitions, secretDefinitions } from "../data/journal";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function EndRunScreen({ state, dispatch }: Props) {
  const endRun = state.run.endRun;

  if (!endRun) {
    return (
      <section className="screen">
        <div className="panel">
          <h2>No Run Result</h2>
          <p>Clear the Cinder Gate to score this run.</p>
          <button onClick={() => dispatch({ type: "setScreen", screen: "camp" })}>Return to Camp</button>
        </div>
      </section>
    );
  }
  const nextGrade = nextChestTarget(endRun.score);
  const metrics = endRun.metrics;
  const storyOutcomes = Object.entries(state.run.eventChains).filter(([, progress]) => progress.outcome);

  return (
    <section className="screen end-layout">
      <div className="panel camp-hero">
        <p className="eyebrow">{endingLabel(endRun.endingId ?? endRun.outcome)}</p>
        <h2>{endRun.score} Score</h2>
        <p>
          {endRun.outcome === "victory"
            ? "The Night Herald is defeated. The five Beacons hold the forest gate open until the next run."
            : `The survivors carried what they could back through the dark. Collapse halves the score; this run earned a ${endRun.chestGrade} chest.`}
        </p>
        <strong>{labelChestGrade(endRun.chestGrade)}</strong>
        <span className="helper-text">
          {nextGrade ? `${nextGrade.points - endRun.score} more points needed for ${nextGrade.label}.` : "Highest chest threshold reached."}
        </span>
      </div>

      {(storyOutcomes.length > 0 || state.run.storyEventsSeen.length > 0 || state.run.secretsFound.length > 0 || state.legacy.completedChallenges.length > 0) && (
        <div className="panel">
          <p className="eyebrow">Run Discoveries</p>
          <h3>Stories carried forward</h3>
          <div className="discovery-ribbon">
            {storyOutcomes.map(([chain, progress]) => <span key={chain}>{chain}: {progress.outcome}</span>)}
            {state.run.storyEventsSeen.map((story) => <span key={story}>{story} remembered</span>)}
            {state.run.secretsFound.map((id) => <span key={id}>Secret: {secretDefinitions.find((secret) => secret.id === id)?.name ?? id}</span>)}
            {state.run.survivors.map((survivor) => (
              <span key={survivor.id}>{survivor.name} Bond {bondLevel(state.legacy.bonds[survivor.id] ?? 0)}</span>
            ))}
            {challengeDefinitions.filter((challenge) => state.legacy.completedChallenges.includes(challenge.id)).map((challenge) => (
              <span key={challenge.id}>Challenge: {challenge.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="panel metrics-panel">
        <p className="eyebrow">Local Playtest Metrics</p>
        <h3>Why this run ended here</h3>
        <div className="metrics-grid">
          <Metric label="Run time" value={formatDuration(metrics.durationSeconds)} />
          <Metric label="Starter" value={metrics.starterClass} />
          <Metric label="Route failures" value={metrics.routeFailures} />
          <Metric label="Crises" value={metrics.crisisCount} />
          <Metric label="Guardian attempts" value={Object.values(metrics.guardianAttempts).reduce((sum, value) => sum + value, 0)} />
          <Metric label="Gate Stability" value={`${metrics.gateStability}/15`} />
          <Metric label="Night Herald" value={metrics.nightHeraldOutcome} />
          <Metric label="Chest" value={metrics.chestGrade} />
        </div>
        <div className="core-summary">
          {Object.entries(metrics.coreQualities).map(([beacon, quality]) => (
            <span key={beacon}>{beacon}: {quality ?? "not recovered"}</span>
          ))}
        </div>
        {metrics.vows.length > 0 && <p><strong>Run vows:</strong> {metrics.vows.join(" · ")}</p>}
        {metrics.collapseReason && <p><strong>Collapse reason:</strong> {metrics.collapseReason}</p>}
        <small>Stored only in this browser. The latest 30 summaries stay with the local save.</small>
      </div>

      <div className="panel">
        <h3>Score Breakdown</h3>
        <div className="score-list">
          {endRun.lines.map((line) => (
            <div className="score-row" key={line.label}>
              <span>{line.label}</span>
              <strong>{line.points > 0 ? `+${line.points}` : line.points}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel chest-panel">
        <p className="eyebrow">Legacy Chest</p>
        <GameIcon label={labelChestGrade(endRun.chestGrade)} name={`${endRun.chestGrade}Chest`} size="lg" />
        <h3>{labelChestGrade(endRun.chestGrade)}</h3>
        <p>{describeChestGrade(endRun.chestGrade)}</p>
        {endRun.reward ? (
          <div className="result-box">
            <strong>{endRun.reward.label}</strong>
            <p>{endRun.reward.amount ? `Added ${endRun.reward.amount} Legacy Shards.` : "Saved to legacy collection."}</p>
          </div>
        ) : (
          <p>Open the chest to add one reward to your permanent legacy.</p>
        )}
        <button className="primary" disabled={endRun.claimed} onClick={() => dispatch({ type: "claimChest" })}>
          {endRun.claimed ? "Chest Claimed" : "Open Chest"}
        </button>
      </div>

      <div className="panel">
        <h3>Legacy</h3>
        <div className="resource-grid">
          <div className="resource">
            <span>Shards</span>
            <strong>{state.legacy.shards}</strong>
          </div>
          <div className="resource">
            <span>Blueprints</span>
            <strong>{state.legacy.blueprints.length}</strong>
          </div>
          <div className="resource">
            <span>Relics</span>
            <strong>{state.legacy.relics.length}</strong>
          </div>
          <div className="resource">
            <span>Unlocks</span>
            <strong>{state.legacy.unlocks.length}</strong>
          </div>
        </div>
        <button onClick={() => dispatch({ type: "resetRun", keepLegacy: true })}>Start Fresh Run</button>
        <button onClick={() => dispatch({ type: "setScreen", screen: "meta" })}>View Meta Progress</button>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function nextChestTarget(score: number): { label: string; points: number } | null {
  if (score < 750) return { label: "Faded", points: 750 };
  if (score < 1150) return { label: "Iron", points: 1150 };
  if (score < 1450) return { label: "Ancient", points: 1450 };
  return null;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

function endingLabel(id: string): string {
  const labels: Record<string, string> = {
    victory: "Run Complete",
    collapse: "Run Collapsed",
    perfectAlignment: "Fivefold Dawn Ending",
    savedFromCollapse: "Carried by the Beacons Ending",
    heraldSealed: "Quiet Seal Ending",
  };
  return labels[id] ?? "Run Complete";
}
