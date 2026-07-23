import type { Dispatch } from "react";
import { bondNotes, challengeDefinitions, journalCollections, secretDefinitions } from "../data/journal";
import { bondLevel } from "../game/journal";
import type { CollectionCategory, GameAction, GameState } from "../game/state";

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

  return (
    <section className="screen journal-layout">
      <div className="panel journal-hero">
        <p className="eyebrow">Solo Discovery Record</p>
        <h2>Collection Journal</h2>
        <p>Unknown records reveal their names and field notes when discovered during play.</p>
        <strong>{discoveredTotal}/{collectionTotal} collection entries</strong>
        {state.legacy.titles.length > 0 && <p className="journal-titles">Titles: {state.legacy.titles.join(" · ")}</p>}
      </div>

      <div className="journal-sections">
        {(Object.keys(journalCollections) as CollectionCategory[]).map((category) => (
          <section className="panel collection-panel" key={category}>
            <h3>{categoryLabels[category]}</h3>
            <div className="journal-entry-grid">
              {journalCollections[category].map((entry) => {
                const discovered = state.legacy.collection[category].includes(entry.id);
                return (
                  <article className={`journal-entry ${discovered ? "" : "unknown"}`} key={entry.id}>
                    <strong>{discovered ? entry.name : "???"}</strong>
                    <p>{discovered ? entry.flavor : "Undiscovered"}</p>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="panel">
        <p className="eyebrow">Shared Routes</p>
        <h3>Survivor Bonds</h3>
        <div className="journal-entry-grid">
          {journalCollections.survivors.map((entry) => {
            const discovered = state.legacy.collection.survivors.includes(entry.id);
            const points = state.legacy.bonds[entry.id] ?? 0;
            const level = bondLevel(points);
            return (
              <article className={`journal-entry ${discovered ? "" : "unknown"}`} key={entry.id}>
                <strong>{discovered ? entry.name : "???"}</strong>
                <span>Bond {level}/3 · {points}/9</span>
                <p>{discovered ? bondNotes[level] : "Recruit this survivor to begin their bond."}</p>
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
              <article className={`journal-entry ${discovered ? "" : "unknown"}`} key={secret.id}>
                <strong>{discovered ? secret.name : "???"}</strong>
                <p>{discovered ? secret.reward : secret.hint}</p>
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
                <div><strong>{challenge.name}</strong><p>{challenge.description}</p></div>
              </article>
            );
          })}
        </div>
      </section>

      <button onClick={() => dispatch({ type: "setScreen", screen: state.run.started ? "camp" : "starter" })}>Return</button>
    </section>
  );
}
