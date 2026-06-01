import { ARENA_SIZE } from "@/battle/constants";

export const RTS_MAP_W = 1200;
export const RTS_MAP_H = 800;

export interface DropInEnemy {
  rtsId: number;
  hp: number;
  maxHp: number;
  rtsX: number;
  rtsY: number;
}

export interface DropInSnapshot {
  unitId: number;
  unitLabel: string;
  unitHp: number;
  unitMaxHp: number;
  unitAtk: number;
  rtsX: number;
  rtsY: number;
  enemies: DropInEnemy[];
  enemyKills: number;
  elapsed: number;
}

export function rtsToArena(x: number, y: number): { x: number; z: number } {
  return {
    x: (x / RTS_MAP_W) * ARENA_SIZE - ARENA_SIZE / 2,
    z: ((RTS_MAP_H - y) / RTS_MAP_H) * ARENA_SIZE - ARENA_SIZE / 2,
  };
}

export function arenaToRts(ax: number, az: number): { x: number; y: number } {
  return {
    x: ((ax + ARENA_SIZE / 2) / ARENA_SIZE) * RTS_MAP_W,
    y: RTS_MAP_H - ((az + ARENA_SIZE / 2) / ARENA_SIZE) * RTS_MAP_H,
  };
}
