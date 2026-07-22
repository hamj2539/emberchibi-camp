import { useEffect, useReducer } from "react";
import { BeaconRepairScreen } from "./components/BeaconRepairScreen";
import { BossBattleScreen } from "./components/BossBattleScreen";
import { CampScreen } from "./components/CampScreen";
import { CraftScreen } from "./components/CraftScreen";
import { EndRunScreen } from "./components/EndRunScreen";
import { ExploreScreen } from "./components/ExploreScreen";
import { ObjectivePanel } from "./components/ObjectivePanel";
import { StarterSelect } from "./components/StarterSelect";
import { SurvivorsScreen } from "./components/SurvivorsScreen";
import { beacons } from "./data/beacons";
import { gameReducer } from "./game/reducer";
import { deleteSave, loadGame, saveGame } from "./game/save";
import type { Screen } from "./game/state";

const navItems: { screen: Screen; label: string; when?: "boss" | "repair" | "end" }[] = [
  { screen: "camp", label: "Camp" },
  { screen: "explore", label: "Explore" },
  { screen: "survivors", label: "Survivors" },
  { screen: "craft", label: "Craft" },
  { screen: "boss", label: "Boss", when: "boss" },
  { screen: "repair", label: "Repair", when: "repair" },
  { screen: "end", label: "End", when: "end" },
];

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGame);

  useEffect(() => {
    dispatch({ type: "tick", now: Date.now() });
    const timer = window.setInterval(() => dispatch({ type: "tick", now: Date.now() }), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    saveGame(state);
  }, [state]);

  function resetRun() {
    deleteSave();
    dispatch({ type: "resetRun", keepLegacy: true });
  }

  const screen = state.run.screen;
  const allBeaconsLit = beacons.every((beacon) => state.run.beacons[beacon.id].repaired);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Prototype Run</p>
          <h1>Emberchibi Camp</h1>
        </div>
        {state.run.started && (
          <nav className="nav" aria-label="Main screens">
            {navItems
              .filter((item) => {
                if (item.when === "boss") return Boolean(state.run.bossBattle);
                if (item.when === "repair") return state.run.bossBattle?.status === "won";
                if (item.when === "end") return allBeaconsLit;
                return true;
              })
              .map((item) => (
                <button
                  className={screen === item.screen ? "active" : ""}
                  key={item.screen}
                  onClick={() => dispatch({ type: "setScreen", screen: item.screen })}
                >
                  {item.label}
                </button>
              ))}
          </nav>
        )}
      </header>

      <main>
        <ObjectivePanel state={state} />
        {screen === "starter" && <StarterSelect dispatch={dispatch} />}
        {screen === "camp" && <CampScreen dispatch={dispatch} state={state} onReset={resetRun} />}
        {screen === "explore" && <ExploreScreen dispatch={dispatch} state={state} />}
        {screen === "survivors" && <SurvivorsScreen dispatch={dispatch} state={state} />}
        {screen === "craft" && <CraftScreen dispatch={dispatch} state={state} />}
        {screen === "boss" && <BossBattleScreen dispatch={dispatch} state={state} />}
        {screen === "repair" && <BeaconRepairScreen dispatch={dispatch} state={state} />}
        {screen === "end" && <EndRunScreen dispatch={dispatch} state={state} />}
      </main>
    </div>
  );
}
