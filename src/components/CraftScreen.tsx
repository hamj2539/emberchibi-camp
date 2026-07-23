import type { Dispatch } from "react";
import { formatCost, getRecipe, recipes } from "../data/recipes";
import type { GameAction, GameState, ResourceKey } from "../game/state";
import { GameIcon, type GameIconName } from "./GameIcon";

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export function CraftScreen({ state, dispatch }: Props) {
  const craftWorkers = state.run.survivors.filter((survivor) => !survivor.onExpedition && survivor.job === "craft");

  return (
    <section className="screen">
      <div className="panel">
        <p className="eyebrow">Craft Bench</p>
        <h2>Craft Bench</h2>
        <p>Queue up to 3 items. Survivors assigned to Craft speed up every active task.</p>
      </div>

      <div className="panel compact">
        <h3>Queue</h3>
        {state.run.craftQueue.length === 0 ? (
          <p>No active craft tasks. Assign someone to Craft before starting longer recipes.</p>
        ) : (
          <div className="queue-list">
            {state.run.craftQueue.map((task) => {
              const recipe = getRecipe(task.recipeId);
              return (
                <div className="queue-row" key={task.id}>
                  <div>
                    <strong>{recipe.name}</strong>
                    <div className="mini-meter">
                      <span style={{ width: `${craftProgress(recipe.craftSeconds, task.remainingSeconds)}%` }} />
                    </div>
                  </div>
                  <span>{Math.ceil(task.remainingSeconds)}s left</span>
                </div>
              );
            })}
          </div>
        )}
        <span className="helper-text">{craftWorkers.length} survivor(s) assigned to Craft.</span>
      </div>

      <div className="recipe-grid">
        {recipes.map((recipe) => {
          const affordable = canAfford(state, recipe.cost);
          const queueFull = state.run.craftQueue.length >= 3;
          return (
            <article className="recipe-card" key={recipe.id}>
              <GameIcon label={recipe.name} name={recipe.id as GameIconName} size="lg" />
              <h3>{recipe.name}</h3>
              <span>{formatCost(recipe.cost)}</span>
              <p>{recipe.effect}</p>
              <div className="recipe-meta">
                <span>{recipe.craftSeconds}s</span>
                <span>Owned {state.run.items[recipe.id]}</span>
              </div>
              <button
                className={affordable && !queueFull ? "primary" : ""}
                disabled={!affordable || queueFull}
                title={queueFull ? "Unavailable: craft queue has three items." : affordable ? recipe.effect : `Unavailable: requires ${formatCost(recipe.cost)}.`}
                onClick={() => dispatch({ type: "startCraft", recipeId: recipe.id })}
              >
                {queueFull ? "Queue Full" : affordable ? "Craft" : "Need Resources"}
              </button>
            </article>
          );
        })}
      </div>
      <div className="panel compact">
        <strong>Current stock:</strong> {formatAmount(state.run.resources.wood)} wood,{" "}
        {formatAmount(state.run.resources.food)} food, {formatAmount(state.run.resources.herb)} herb,{" "}
        {formatAmount(state.run.resources.stone)} stone
      </div>
    </section>
  );
}

function canAfford(state: GameState, cost: Partial<Record<ResourceKey, number>>): boolean {
  return Object.entries(cost).every(([key, amount]) => state.run.resources[key as ResourceKey] >= amount);
}

function craftProgress(totalSeconds: number, remainingSeconds: number): number {
  return Math.max(0, Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100));
}

function formatAmount(value: number): string {
  return value % 1 === 0 ? `${value}` : value.toFixed(1);
}
