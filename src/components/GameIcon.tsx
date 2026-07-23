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
  | "beacon"
  | "pristineCore"
  | "stableCore"
  | "crackedCore"
  | "fadedCore"
  | "emberBeaconUnlit"
  | "emberBeaconLit"
  | "tidalBeaconUnlit"
  | "tidalBeaconLit"
  | "galeBeaconUnlit"
  | "galeBeaconLit"
  | "rootBeaconUnlit"
  | "rootBeaconLit"
  | "lunarBeaconUnlit"
  | "lunarBeaconLit";

type Props = {
  name: GameIconName;
  label: string;
  size?: "sm" | "md" | "lg";
};

export function GameIcon({ name, label, size = "md" }: Props) {
  return <span aria-label={label} className={`game-icon game-icon-${size} icon-${name}`} role="img" />;
}
