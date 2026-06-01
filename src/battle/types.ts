import type { DropInSnapshot } from "@/battle/dropIn";
import type { CombatResult } from "@/types/game";
import type { NpcTemplate } from "@/types/visual";

export type BattleDomain = "ground" | "space";
export type BattleMode = "fps" | "rts";

export interface BattleContext {
  domain: BattleDomain;
  mode: BattleMode;
  zoneName: string;
  threat: number;
  factionColor: string;
  squadSize: number;
  playerMaxHp: number;
  playerDamage: number;
  opponent: NpcTemplate;
  opponentImage: string;
  /** Set when entering FPS from RTS (F — drop in) */
  dropIn?: DropInSnapshot;
}

export interface BattleOutcome {
  victory: boolean;
  casualties: number;
  loot: number;
  message: string;
  kills?: number;
  unitsLost?: number;
  /** Return to RTS command view with updated snapshot */
  returnToRts?: boolean;
  dropInSnapshot?: DropInSnapshot;
}
export function outcomeToCombatResult(outcome: BattleOutcome): CombatResult {
  return {
    victory: outcome.victory,
    casualties: outcome.casualties,
    loot: outcome.loot,
    message: outcome.message,
  };
}
