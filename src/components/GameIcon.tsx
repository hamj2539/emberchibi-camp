export type GameIconName =
  | "wood"
  | "food"
  | "herb"
  | "stone"
  | "ore"
  | "relicShard"
  | "torch"
  | "ration"
  | "stoneSpear"
  | "herbSalve"
  | "warmCloak"
  | "repairKit"
  | "brokenChest"
  | "fadedChest"
  | "ironChest"
  | "ancientChest"
  | "cinderHeart"
  | "beacon";

type Props = {
  name: GameIconName;
  label: string;
  size?: "sm" | "md" | "lg";
};

export function GameIcon({ name, label, size = "md" }: Props) {
  return (
    <span aria-label={label} className={`game-icon game-icon-${size} icon-${name}`} role="img">
      {initials(label)}
    </span>
  );
}

function initials(label: string): string {
  return label
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
}
