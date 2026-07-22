import { useEffect, useReducer } from "react";
import { CampScreen } from "./components/CampScreen";
import { CraftScreen } from "./components/CraftScreen";
import { ExploreScreen } from "./components/ExploreScreen";
import { StarterSelect } from "./components/StarterSelect";
import { SurvivorsScreen } from "./components/SurvivorsScreen";
import { gameReducer } from "./game/reducer";
import { deleteSave, loadGame, saveGame } from "./game/save";
import type { Screen } from "./game/state";

const navItems: { screen: Screen; label: string }[] = [
  { screen: "camp", label: "Camp" },
  { screen: "explore", label: "Explore" },
  { screen: "survivors", label: "Survivors" },
  { screen: "craft", label: "Craft" },
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

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Prototype Run</p>
          <h1>Emberchibi Camp</h1>
        </div>
        {state.run.started && (
          <nav className="nav" aria-label="Main screens">
            {navItems.map((item) => (
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
        {screen === "starter" && <StarterSelect dispatch={dispatch} />}
        {screen === "camp" && <CampScreen dispatch={dispatch} state={state} onReset={resetRun} />}
        {screen === "explore" && <ExploreScreen dispatch={dispatch} state={state} />}
        {screen === "survivors" && <SurvivorsScreen dispatch={dispatch} state={state} />}
        {screen === "craft" && <CraftScreen state={state} />}
      </main>
    </div>
  );
}
