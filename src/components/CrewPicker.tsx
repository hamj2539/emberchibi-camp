import type { Survivor } from "../game/state";

type Props = {
  survivors: Survivor[];
  selectedIds: string[];
  max: number;
  onChange: (ids: string[]) => void;
  stats: (keyof Survivor["stats"])[];
};

export function CrewPicker({ survivors, selectedIds, max, onChange, stats }: Props) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
      return;
    }
    if (selectedIds.length < max) onChange([...selectedIds, id]);
  }

  return (
    <div className="crew-picker">
      {survivors.map((survivor) => {
        const selected = selectedIds.includes(survivor.id);
        const unavailable = survivor.onExpedition || survivor.currentHp <= 0;
        return (
          <button
            type="button"
            className={selected ? "crew-option selected" : "crew-option"}
            aria-pressed={selected}
            disabled={unavailable || (!selected && selectedIds.length >= max)}
            key={survivor.id}
            onClick={() => toggle(survivor.id)}
          >
            <strong>{survivor.name}</strong>
            <span>HP {Math.floor(survivor.currentHp)}/{survivor.stats.hp}</span>
            <span>{stats.map((stat) => `${stat.toUpperCase()} ${survivor.stats[stat]}`).join(" · ")}</span>
          </button>
        );
      })}
    </div>
  );
}
