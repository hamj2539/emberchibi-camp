import type { Dispatch } from "react";
import { describeChestGrade } from "../game/rewards";
import { labelChestGrade } from "../game/scoring";
import type { GameAction, GameState } from "../game/state";
import { GameIcon } from "./GameIcon";

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

  return (
    <section className="screen end-layout">
      <div className="panel camp-hero">
        <p className="eyebrow">{endRun.outcome === "victory" ? "Run Complete" : "Run Collapsed"}</p>
        <h2>{endRun.score} Score</h2>
        <p>
          {endRun.outcome === "victory"
            ? "The Night Herald is defeated. The five Beacons hold the forest gate open until the next run."
            : "The survivors carried what they could back through the dark. Collapse halves the score and yields a Broken Chest."}
        </p>
        <strong>{labelChestGrade(endRun.chestGrade)}</strong>
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
