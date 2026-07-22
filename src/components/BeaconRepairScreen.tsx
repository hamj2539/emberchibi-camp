import { getBeacon } from "../data/beacons";
import { useState, type Dispatch } from "react";
import { labelCoreQuality } from "../game/combat";
import type { GameAction, GameState } from "../game/state";
import { CrewPicker } from "./CrewPicker";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function BeaconRepairScreen({ state, dispatch }: Props) {
  const [selectedIds, setSelectedIds] = useState(() =>
    state.run.survivors.filter((survivor) => !survivor.onExpedition && survivor.currentHp > 0).slice(0, 2).map((survivor) => survivor.id),
  );
  const quality = state.run.bossBattle?.coreQuality;
  const battle = state.run.bossBattle;
  const repair = state.run.beaconRepair;
  const beacon = battle ? getBeacon(battle.beaconId) : null;
  const available = state.run.survivors.filter((survivor) => !survivor.onExpedition);
  const selected = available.filter((survivor) => selectedIds.includes(survivor.id) && survivor.currentHp > 0);
  const canStart =
    Boolean(quality) &&
    repair?.status !== "active" &&
    selected.length > 0 &&
    Boolean(beacon) &&
    state.run.resources.wood >= (beacon?.repairCost.wood ?? 0) &&
    state.run.resources.stone >= (beacon?.repairCost.stone ?? 0);

  if (!quality) {
    return (
      <section className="screen">
        <div className="panel">
          <h2>No Beacon Core</h2>
          <p>Defeat a Beacon guardian to recover its core before repairing the Beacon.</p>
          <button onClick={() => dispatch({ type: "setScreen", screen: "explore" })}>Back to Explore</button>
        </div>
      </section>
    );
  }

  return (
    <section className="screen repair-layout">
      <div className="panel camp-hero">
        <p className="eyebrow">Beacon Repair</p>
        <h2>{beacon?.name ?? repair?.beaconName ?? "Beacon"}</h2>
        <p>{labelCoreQuality(quality, battle?.coreName)} is ready for the repair ritual.</p>
        {repair?.status === "active" && (
          <>
            <div className="meter">
              <span style={{ width: `${Math.round((repair.progress / repair.requiredProgress) * 100)}%` }} />
            </div>
            <strong>{Math.round(repair.progress)} / {repair.requiredProgress}</strong>
          </>
        )}
        {repair?.status === "lit" && <strong>The {repair.beaconName} is lit.</strong>}
      </div>

      <div className="panel">
        <h3>Requirements</h3>
        <div className="resource-grid">
          <div className="resource">
            <span>Wood</span>
            <strong>{state.run.resources.wood}/{beacon?.repairCost.wood ?? 0}</strong>
          </div>
          <div className="resource">
            <span>Stone</span>
            <strong>{state.run.resources.stone}/{beacon?.repairCost.stone ?? 0}</strong>
          </div>
          <div className="resource">
            <span>Repair Kit</span>
            <strong>{state.run.items.repairKit}</strong>
          </div>
          <div className="resource">
            <span>Workers</span>
            <strong>{selected.length}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Assigned Repair Crew</h3>
        <CrewPicker survivors={available} selectedIds={selectedIds} max={2} onChange={setSelectedIds} stats={["craft", "wis"]} />
        <div className="choice-row">
          <button
            className="primary"
            disabled={!canStart}
            onClick={() =>
              dispatch({
                type: "startRepair",
                survivorIds: selected.map((survivor) => survivor.id),
                useRepairKit: false,
              })
            }
          >
            Start Repair
          </button>
          <button
            disabled={!canStart || state.run.items.repairKit < 1}
            onClick={() =>
              dispatch({
                type: "startRepair",
                survivorIds: selected.map((survivor) => survivor.id),
                useRepairKit: true,
              })
            }
          >
            Use Repair Kit
          </button>
        </div>
      </div>
    </section>
  );
}
