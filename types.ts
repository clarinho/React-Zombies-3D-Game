import { Vector3 } from 'three';

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export enum WeaponType {
  PISTOL = 'M1911',
  RIFLE = 'AK-47',
  SHOTGUN = 'Olympia',
  SMG = 'MP5',
  SNIPER = 'L96',
  PUMP = 'Remington 870'
}

export interface WeaponStats {
  name: string;
  damage: number;
  fireRate: number; // ms between shots
  magSize: number;
  reloadTime: number; // ms
  range: number;
  price: number;
  color: string;
  scale: [number, number, number]; 
}

export type ZombieVariant = 'standard' | 'fast' | 'tank';
export type HitType = 'body' | 'head' | 'none';

export interface ZombieEntity {
  id: string;
  position: Vector3;
  health: number;
  maxHealth: number;
  speed: number;
  active: boolean;
  lastAttackTime: number;
  variant: ZombieVariant;
  lastHitType: HitType;
}

export interface PlayerState {
  health: number;
  maxHealth: number;
  points: number;
  currentWeapon: WeaponType;
  ammo: Record<WeaponType, { mag: number; reserve: number }>;
  isReloading: boolean;
  reloadStartTime: number; // For HUD progress
  isMoving: boolean; 
  isSprinting: boolean; 
}

export interface DamageIndicator {
  id: string;
  position: [number, number, number];
  damage: number;
  isCritical: boolean;
  timestamp: number;
}

export interface BloodSpawnEvent {
    position: [number, number, number];
    count: number;
    color: string;
}

export interface KeyBindings {
  forward: string;
  backward: string;
  left: string;
  right: string;
  jump: string;
  sprint: string;
  interact: string;
  reload: string;
  pause: string;
  melee: string;
}

export interface AppSettings {
  sensitivity: number;
  fov: number;
  keys: KeyBindings;
}

export interface HitMarkerState {
  id: number;
  time: number;
  isHeadshot: boolean;
}