import { create } from 'zustand';
import { GameState, WeaponType, WeaponStats, ZombieEntity, AppSettings, HitMarkerState, ZombieVariant, HitType, DamageIndicator, BloodSpawnEvent } from './types';
import { Vector3 } from 'three';

// Weapon Configurations
export const WEAPONS: Record<WeaponType, WeaponStats> = {
  [WeaponType.PISTOL]: {
    name: 'M1911',
    damage: 25,
    fireRate: 200,
    magSize: 8,
    reloadTime: 1500,
    range: 50,
    price: 0,
    color: '#5e5e5e',
    scale: [0.1, 0.15, 0.3]
  },
  [WeaponType.RIFLE]: {
    name: 'AK-47',
    damage: 40,
    fireRate: 100,
    magSize: 30,
    reloadTime: 2500,
    range: 100,
    price: 1200,
    color: '#8B4513',
    scale: [0.12, 0.15, 0.8]
  },
  [WeaponType.SHOTGUN]: {
    name: 'Olympia',
    damage: 100,
    fireRate: 800,
    magSize: 2,
    reloadTime: 3000,
    range: 15,
    price: 500,
    color: '#2F2F2F',
    scale: [0.15, 0.12, 0.6]
  },
  [WeaponType.SMG]: {
    name: 'MP5',
    damage: 22,
    fireRate: 75,
    magSize: 40,
    reloadTime: 2000,
    range: 40,
    price: 1000,
    color: '#1a1a1a',
    scale: [0.1, 0.1, 0.5]
  },
  [WeaponType.SNIPER]: {
    name: 'L96A1',
    damage: 300,
    fireRate: 1200,
    magSize: 5,
    reloadTime: 3500,
    range: 200,
    price: 2500,
    color: '#3e4a38',
    scale: [0.1, 0.1, 0.9]
  },
  [WeaponType.PUMP]: {
    name: 'Remington 870',
    damage: 150,
    fireRate: 900,
    magSize: 6,
    reloadTime: 4000, // Shotgun reload logic is simplified to clip for now
    range: 20,
    price: 1500,
    color: '#443322',
    scale: [0.1, 0.1, 0.7]
  }
};

const DEFAULT_SETTINGS: AppSettings = {
  sensitivity: 1.0,
  fov: 90,
  keys: {
    forward: 'KeyW',
    backward: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    jump: 'Space',
    sprint: 'ShiftLeft',
    interact: 'KeyE',
    reload: 'KeyR',
    pause: 'Escape',
    melee: 'KeyV'
  }
};

interface GameStore {
  gameState: GameState;
  settings: AppSettings;
  round: number;
  roundMessage: string;
  
  // Player
  player: {
    health: number;
    maxHealth: number;
    points: number;
    position: Vector3;
    isMoving: boolean;
    isSprinting: boolean;
  };
  
  // Weaponry
  currentWeapon: WeaponType;
  ammo: Record<WeaponType, { mag: number; reserve: number }>;
  isReloading: boolean;
  reloadStartTime: number;
  lastFired: number;
  lastMelee: number;
  
  // Visuals
  hitMarker: HitMarkerState | null;
  damageIndicators: DamageIndicator[];
  bloodQueue: BloodSpawnEvent[];

  // Interaction
  hoveredWallBuy: { weapon: WeaponType; cost: number } | null;

  // Enemies
  zombies: ZombieEntity[];
  zombiesKilled: number;
  
  // Actions
  setGameState: (state: GameState) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateKeyBinding: (action: keyof AppSettings['keys'], code: string) => void;
  
  setRoundMessage: (msg: string) => void;
  nextRound: () => void;
  damagePlayer: (amount: number) => void;
  healPlayer: () => void; // Auto regen hook
  shootWeapon: () => boolean; // returns true if shot fired
  meleeAttack: () => boolean; // returns true if melee performed
  reloadWeapon: () => void;
  finishReload: () => void;
  buyWeapon: (weapon: WeaponType) => void;
  buyAmmo: (weapon: WeaponType, cost: number) => void;
  setHoveredWallBuy: (data: { weapon: WeaponType; cost: number } | null) => void;
  updatePlayerPosition: (pos: Vector3) => void;
  setPlayerMovementState: (isMoving: boolean, isSprinting: boolean) => void;
  triggerHitMarker: (isHeadshot: boolean) => void;
  addDamageIndicator: (position: [number, number, number], damage: number, isCritical: boolean) => void;
  removeDamageIndicator: (id: string) => void;
  
  addBloodSplatter: (position: [number, number, number], count: number, color?: string) => void;
  clearBloodQueue: () => void;

  // Zombie Management
  spawnZombie: (id: string, position: Vector3, speed: number, health: number, variant?: ZombieVariant) => void;
  damageZombie: (id: string, damage: number, hitType: HitType) => void;
  updateZombiePosition: (id: string, position: Vector3) => void;
  zombieAttack: (id: string) => void;
  
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: GameState.MENU,
  settings: DEFAULT_SETTINGS,
  round: 0,
  roundMessage: "",
  
  player: {
    health: 100,
    maxHealth: 100,
    points: 500,
    position: new Vector3(0, 0, 0),
    isMoving: false,
    isSprinting: false
  },
  
  currentWeapon: WeaponType.PISTOL,
  ammo: {
    [WeaponType.PISTOL]: { mag: 8, reserve: 32 },
    [WeaponType.RIFLE]: { mag: 30, reserve: 120 },
    [WeaponType.SHOTGUN]: { mag: 2, reserve: 20 },
    [WeaponType.SMG]: { mag: 40, reserve: 200 },
    [WeaponType.SNIPER]: { mag: 5, reserve: 30 },
    [WeaponType.PUMP]: { mag: 6, reserve: 48 },
  },
  isReloading: false,
  reloadStartTime: 0,
  lastFired: 0,
  lastMelee: 0,
  
  hitMarker: null,
  damageIndicators: [],
  bloodQueue: [],
  hoveredWallBuy: null,
  
  zombies: [],
  zombiesKilled: 0,
  
  setGameState: (state) => set({ gameState: state }),

  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),

  updateKeyBinding: (action, code) => set((state) => ({
    settings: {
        ...state.settings,
        keys: {
            ...state.settings.keys,
            [action]: code
        }
    }
  })),

  setRoundMessage: (msg) => set({ roundMessage: msg }),
  
  nextRound: () => set((state) => ({ 
    round: state.round + 1,
    zombies: [] 
  })),

  damagePlayer: (amount) => set((state) => {
    const newHealth = state.player.health - amount;
    if (newHealth <= 0) {
      return { 
        player: { ...state.player, health: 0 },
        gameState: GameState.GAME_OVER 
      };
    }
    return { player: { ...state.player, health: newHealth } };
  }),

  healPlayer: () => set((state) => {
    if (state.player.health < state.player.maxHealth && state.player.health > 0) {
      return { player: { ...state.player, health: Math.min(state.player.health + 1, state.player.maxHealth) } };
    }
    return {};
  }),

  updatePlayerPosition: (pos) => set((state) => ({
    player: { ...state.player, position: pos }
  })),

  setPlayerMovementState: (isMoving, isSprinting) => set((state) => ({
      player: { ...state.player, isMoving, isSprinting }
  })),

  shootWeapon: () => {
    const state = get();
    const now = Date.now();
    const weapon = WEAPONS[state.currentWeapon];
    const currentAmmo = state.ammo[state.currentWeapon];

    if (state.isReloading || now - state.lastFired < weapon.fireRate || currentAmmo.mag <= 0 || now - state.lastMelee < 500) {
      return false;
    }

    set((state) => ({
      lastFired: now,
      ammo: {
        ...state.ammo,
        [state.currentWeapon]: {
          ...state.ammo[state.currentWeapon],
          mag: state.ammo[state.currentWeapon].mag - 1
        }
      }
    }));
    return true;
  },

  meleeAttack: () => {
    const state = get();
    const now = Date.now();
    if (now - state.lastMelee < 800) return false; 

    set({ lastMelee: now });
    return true;
  },

  triggerHitMarker: (isHeadshot) => set({
      hitMarker: { id: Date.now(), time: Date.now(), isHeadshot }
  }),

  addDamageIndicator: (position, damage, isCritical) => set((state) => ({
    damageIndicators: [...state.damageIndicators, {
        id: Math.random().toString(36).substr(2, 9),
        position,
        damage,
        isCritical,
        timestamp: Date.now()
    }]
  })),

  removeDamageIndicator: (id) => set((state) => ({
    damageIndicators: state.damageIndicators.filter(d => d.id !== id)
  })),
  
  addBloodSplatter: (position, count, color = '#8a0303') => set((state) => ({
      bloodQueue: [...state.bloodQueue, { position, count, color }]
  })),

  clearBloodQueue: () => set({ bloodQueue: [] }),

  reloadWeapon: () => {
    const state = get();
    const currentAmmo = state.ammo[state.currentWeapon];
    const weapon = WEAPONS[state.currentWeapon];

    if (currentAmmo.mag === weapon.magSize || currentAmmo.reserve === 0 || state.isReloading) return;

    set({ isReloading: true, reloadStartTime: Date.now() });
  },

  finishReload: () => set((state) => {
    const weapon = WEAPONS[state.currentWeapon];
    const currentAmmo = state.ammo[state.currentWeapon];
    const needed = weapon.magSize - currentAmmo.mag;
    const amountToReload = Math.min(needed, currentAmmo.reserve);

    return {
      isReloading: false,
      ammo: {
        ...state.ammo,
        [state.currentWeapon]: {
          mag: currentAmmo.mag + amountToReload,
          reserve: currentAmmo.reserve - amountToReload
        }
      }
    };
  }),

  buyWeapon: (weaponType) => set((state) => {
    const cost = WEAPONS[weaponType].price;
    if (state.player.points >= cost) {
      if (state.currentWeapon === weaponType) {
         return {};
      }
      return {
        player: { ...state.player, points: state.player.points - cost },
        currentWeapon: weaponType,
        isReloading: false 
      };
    }
    return {};
  }),

  buyAmmo: (weaponType, cost) => set((state) => {
    if (state.player.points >= cost) {
       const weapon = WEAPONS[weaponType];
       return {
         player: { ...state.player, points: state.player.points - cost },
         ammo: {
           ...state.ammo,
           [weaponType]: { ...state.ammo[weaponType], reserve: weapon.magSize * 4 } 
         }
       };
    }
    return {};
  }),

  setHoveredWallBuy: (data) => set({ hoveredWallBuy: data }),

  spawnZombie: (id, position, speed, health, variant = 'standard') => set((state) => ({
    zombies: [...state.zombies, { 
      id, 
      position, 
      speed, 
      health,
      maxHealth: health,
      active: true,
      lastAttackTime: 0,
      variant,
      lastHitType: 'none'
    }]
  })),

  damageZombie: (id, damage, hitType) => set((state) => {
    const updatedZombies = state.zombies.map(z => {
      if (z.id !== id) return z;
      
      // Damage Calculation is done in Player.tsx now
      let actualDamage = damage;

      // Apply armor damage reduction for tanks (keep this logic here)
      if (z.variant === 'tank') {
          actualDamage = actualDamage * 0.5;
      }
      
      const remainingHealth = z.health - actualDamage;
      return { 
          ...z, 
          health: remainingHealth, 
          active: remainingHealth > 0,
          lastHitType: hitType
      };
    });

    const killed = updatedZombies.find(z => z.id === id && z.health <= 0);
    let pointsToAdd = 10; 
    if (killed) {
        pointsToAdd += 60; 
        if (hitType === 'head') pointsToAdd += 40; 
    }

    const livingZombies = updatedZombies.filter(z => z.active);

    return {
      zombies: livingZombies,
      player: { ...state.player, points: state.player.points + pointsToAdd },
      zombiesKilled: killed ? state.zombiesKilled + 1 : state.zombiesKilled
    };
  }),

  updateZombiePosition: (id, position) => set((state) => ({
    zombies: state.zombies.map(z => z.id === id ? { ...z, position } : z)
  })),

  zombieAttack: (id) => set((state) => {
    const now = Date.now();
    const zombie = state.zombies.find(z => z.id === id);
    if (zombie && now - zombie.lastAttackTime > 1000) {
      // Attack allowed
      const newHealth = state.player.health - 50; 
       if (newHealth <= 0) {
        return { 
          player: { ...state.player, health: 0 },
          gameState: GameState.GAME_OVER,
           zombies: state.zombies.map(z => z.id === id ? { ...z, lastAttackTime: now } : z)
        };
      }
      return {
        player: { ...state.player, health: newHealth },
        zombies: state.zombies.map(z => z.id === id ? { ...z, lastAttackTime: now } : z)
      };
    }
    return {};
  }),

  resetGame: () => set({
    gameState: GameState.PLAYING,
    round: 1,
    roundMessage: "Round 1",
    player: { health: 100, maxHealth: 100, points: 500, position: new Vector3(0,0,0), isMoving: false, isSprinting: false },
    currentWeapon: WeaponType.PISTOL,
    ammo: {
        [WeaponType.PISTOL]: { mag: 8, reserve: 32 },
        [WeaponType.RIFLE]: { mag: 30, reserve: 120 },
        [WeaponType.SHOTGUN]: { mag: 2, reserve: 20 },
        [WeaponType.SMG]: { mag: 40, reserve: 200 },
        [WeaponType.SNIPER]: { mag: 5, reserve: 30 },
        [WeaponType.PUMP]: { mag: 6, reserve: 48 },
    },
    zombies: [],
    zombiesKilled: 0,
    bloodQueue: []
  })

}));