import type { GameState } from "../game/state";

type Props = {
  state: GameState;
};

const recipes = [
  ["Torch", "Wood 2, Herb 1", "Reduces night and burn route risk."],
  ["Ration", "Food 3", "Improves expedition safety."],
  ["Stone Spear", "Wood 2, Stone 3", "Adds combat power."],
  ["Herb Salve", "Herb 3", "Heals HP or injury."],
  ["Warm Cloak", "Hide 1, Herb 2", "Reduces Ember burn pressure."],
  ["Repair Kit", "Wood 4, Stone 4", "Improves Beacon repair efficiency."],
];

export function CraftScreen({ state }: Props) {
  return (
    <section className="screen">
      <div className="panel">
        <p className="eyebrow">Milestone 5 Preview</p>
        <h2>Craft Bench</h2>
        <p>Recipes are visible now; queueing and item effects come after the route loop is stable.</p>
      </div>
      <div className="recipe-grid">
        {recipes.map(([name, cost, effect]) => (
          <article className="recipe-card" key={name}>
            <div className="item-icon">{name.slice(0, 2)}</div>
            <h3>{name}</h3>
            <span>{cost}</span>
            <p>{effect}</p>
            <button disabled>Craft Soon</button>
          </article>
        ))}
      </div>
      <div className="panel compact">
        <strong>Current stock:</strong> {state.run.resources.wood} wood, {state.run.resources.food} food,{" "}
        {state.run.resources.herb} herb, {state.run.resources.stone} stone
      </div>
    </section>
  );
}
