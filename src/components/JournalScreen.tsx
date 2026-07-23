import type { Dispatch } from "react";
import { bondNotes, challengeDefinitions, journalCollections, secretDefinitions } from "../data/journal";
import { eventChainDefinitions } from "../data/alpha7Content";
import { bondLevel } from "../game/journal";
import type { CollectionCategory, GameAction, GameState } from "../game/state";
import { aggregateRunMetrics, getLongTermGoals } from "../game/alpha9";
import { runVows } from "../data/alpha9Progression";
import { DetailsDisclosure, VisualBadge } from "./VisualUI";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

const categoryLabels: Record<CollectionCategory, string> = {
  relics: "Legacy Relics",
  runItems: "Run Relics & Equipment",
  blueprints: "Blueprints",
  survivors: "Survivors",
  beacons: "Beacons",
  guardians: "Guardians",
  endings: "Endings",
  routeEvents: "Route Events",
};

export function JournalScreen({ state, dispatch }: Props) {
  const discoveredTotal = Object.values(state.legacy.collection).reduce((sum, entries) => sum + entries.length, 0);
  const collectionTotal = Object.values(journalCollections).reduce((sum, entries) => sum + entries.length, 0);
  const goals = getLongTermGoals(state);
  const metrics = aggregateRunMetrics(state.legacy.runHistory);

  return (
    <section className="screen journal-layout">
      <div className="panel journal-hero">
        <p className="eyebrow">Solo Discovery Record</p>
        <h2>Collection Journal</h2>
        <div className="journal-progress"><VisualBadge label="Found" value={`${discoveredTotal}/${collectionTotal}`} tone="good" /><div className="meter" aria-label={`${discoveredTotal} of ${collectionTotal} collection entries`}><span style={{ width: `${Math.round((discoveredTotal / collectionTotal) * 100)}%` }} /></div></div>
        {state.legacy.titles.length > 0 && <p className="journal-titles">Titles: {state.legacy.titles.join(" · ")}</p>}
      </div>

      <section className="panel long-term-panel">
        <p className="eyebrow">Across Many Runs</p>
        <h3>Long-term Goals</h3>
        <div className="goal-grid">
          {goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.progress / goal.target) * 100));
            return (
              <article className={`long-goal ${goal.progress >= goal.target ? "complete" : ""}`} key={goal.id}>
                <div><strong>{goal.name}</strong><span>{goal.progress}/{goal.target}</span></div>
                <div className="meter" aria-label={`${goal.name}: ${percent}% complete`}><span style={{ width: `${percent}%` }} /></div>
                <DetailsDisclosure summary="Goal details"><p>{goal.detail}</p></DetailsDisclosure>
              </article>
            );
          })}
        </div>
      </section>

      <div className="journal-sections">
        {(Object.keys(journalCollections) as CollectionCategory[]).map((category) => (
          <section className="panel collection-panel" key={category}>
            <h3>{categoryLabels[category]}</h3>
            <div className="journal-entry-grid">
              {journalCollections[category].map((entry) => {
                const discovered = state.legacy.collection[category].includes(entry.id);
                return (
                  <article className={`journal-entry collection-card ${discovered ? "discovered" : "unknown"}`} key={entry.id}>
                    <span className="collection-stamp" aria-hidden="true">{discovered ? "Found" : "???"}</span>
                    <span className="collection-glyph" aria-hidden="true">{discovered ? entry.name.slice(0, 1) : "?"}</span>
                    <strong>{discovered ? entry.name : "???"}</strong>
                    {discovered ? <DetailsDisclosure summary="Field note"><p>{entry.flavor}</p></DetailsDisclosure> : <small>Undiscovered</small>}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="panel">
        <p className="eyebrow">This Run</p>
        <h3>Event Chain Progress</h3>
        <div className="journal-entry-grid">
          {eventChainDefinitions.map((chain) => {
            const progress = state.run.eventChains[chain.id];
            return (
              <article className="journal-entry collection-card" key={chain.id}>
                <span className="collection-glyph" aria-hidden="true">{Math.min(progress.step, chain.steps)}</span>
                <strong>{chain.name}</strong>
                <VisualBadge label="Step" value={`${Math.min(progress.step, chain.steps)}/${chain.steps}`} tone={progress.outcome ? "good" : "info"} />
                <DetailsDisclosure summary="Chain details"><p>{progress.outcome ? `Outcome: ${progress.outcome}` : progress.step > 0 ? "The next clue can appear on a later route." : "No clue found this run."}</p></DetailsDisclosure>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Difficulty Records</p>
        <h3>Run Vows</h3>
        <div className="challenge-list">
          {runVows.map((vow) => {
            const complete = state.legacy.completedVows.includes(vow.id);
            return (
              <article className="challenge-row" key={vow.id}>
                <span>{complete ? "Cleared" : "Open"}</span>
                <div><strong>{vow.name}</strong><p>{vow.description} {vow.reward}.</p></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel metrics-panel">
        <p className="eyebrow">Local Run History</p>
        <h3>Balance Record</h3>
        <div className="metrics-grid">
          <Metric label="Recorded runs" value={metrics.runs} />
          <Metric label="Average duration" value={formatDuration(metrics.averageDurationSeconds)} />
          <Metric label="Wins" value={metrics.wins} />
          <Metric label="Collapses" value={metrics.collapses} />
        </div>
        <h4>Chest distribution</h4>
        <div className="status-strip">
          {Object.entries(metrics.chestDistribution).map(([grade, count]) => <span key={grade}>{grade}: {count}</span>)}
        </div>
        <h4>Starter success</h4>
        <div className="status-strip">
          {Object.entries(metrics.starterDistribution).map(([starter, record]) => (
            <span key={starter}>{starter}: {record.wins}/{record.runs}</span>
          ))}
        </div>
        <h4>Common collapse causes</h4>
        <p>{metrics.commonFailureCauses.length
          ? metrics.commonFailureCauses.map((entry) => `${entry.cause} (${entry.count})`).join(" · ")
          : "No collapse data recorded yet."}</p>
        <small>Stored only in this browser. Up to 30 completed run summaries are retained.</small>
      </section>

      <section className="panel">
        <p className="eyebrow">Shared Routes</p>
        <h3>Survivor Bonds</h3>
        <div className="journal-entry-grid">
          {journalCollections.survivors.map((entry) => {
            const discovered = state.legacy.collection.survivors.includes(entry.id);
            const points = state.legacy.bonds[entry.id] ?? 0;
            const level = bondLevel(points);
            return (
              <article className={`journal-entry collection-card ${discovered ? "" : "unknown"}`} key={entry.id}>
                <span className="collection-glyph" aria-hidden="true">{discovered ? level : "?"}</span>
                <strong>{discovered ? entry.name : "???"}</strong>
                <VisualBadge label="Bond" value={`${level}/3`} tone={level === 3 ? "good" : "info"} />
                <DetailsDisclosure summary="Bond note"><p>{discovered ? bondNotes[level] : "Recruit this survivor to begin their bond."}</p></DetailsDisclosure>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Hidden Conditions</p>
        <h3>Secrets</h3>
        <div className="journal-entry-grid">
          {secretDefinitions.map((secret) => {
            const discovered = state.legacy.discoveredSecrets.includes(secret.id);
            return (
              <article className={`journal-entry collection-card ${discovered ? "" : "unknown"}`} key={secret.id}>
                <span className="collection-glyph" aria-hidden="true">{discovered ? "!" : "?"}</span>
                <strong>{discovered ? secret.name : "???"}</strong>
                <DetailsDisclosure summary={discovered ? "Reward" : "Hint"}><p>{discovered ? secret.reward : secret.hint}</p></DetailsDisclosure>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Optional Goals</p>
        <h3>Solo Challenges</h3>
        <div className="challenge-list">
          {challengeDefinitions.map((challenge) => {
            const complete = state.legacy.completedChallenges.includes(challenge.id);
            return (
              <article className="challenge-row" key={challenge.id}>
                <span aria-label={complete ? "Completed" : "Incomplete"}>{complete ? "Complete" : "Open"}</span>
                <div><strong>{challenge.name}</strong><p>{challenge.description} First clear: 4 Legacy Shards.</p></div>
              </article>
            );
          })}
        </div>
      </section>

      <button onClick={() => dispatch({ type: "setScreen", screen: state.run.started ? "camp" : "starter" })}>Return</button>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
