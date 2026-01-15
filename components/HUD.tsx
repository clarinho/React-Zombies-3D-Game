import React, { useState, useEffect } from 'react';
import { useGameStore, WEAPONS } from '../store';
import { WeaponType, GameState } from '../types';

const HUD: React.FC = () => {
  const { 
    gameState, 
    setGameState,
    player, 
    currentWeapon, 
    ammo, 
    isReloading, 
    reloadStartTime,
    round, 
    roundMessage,
    resetGame,
    settings,
    updateSettings,
    hitMarker,
    hoveredWallBuy
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'main' | 'settings' | 'controls'>('main');
  const [showHitMarker, setShowHitMarker] = useState(false);
  const [reloadProgress, setReloadProgress] = useState(0);

  const weaponInfo = WEAPONS[currentWeapon];
  const currentAmmo = ammo[currentWeapon];

  // Hitmarker Logic
  useEffect(() => {
    if (hitMarker && Date.now() - hitMarker.time < 100) {
        setShowHitMarker(true);
        const timer = setTimeout(() => setShowHitMarker(false), 100);
        return () => clearTimeout(timer);
    }
  }, [hitMarker]);

  const isHeadshot = hitMarker?.isHeadshot && showHitMarker;

  // Reload Progress Bar Logic
  useEffect(() => {
      let frameId: number;
      const updateProgress = () => {
          if (isReloading) {
              const duration = weaponInfo.reloadTime;
              const elapsed = Date.now() - reloadStartTime;
              const pct = Math.min(100, (elapsed / duration) * 100);
              setReloadProgress(pct);
              if (pct < 100) frameId = requestAnimationFrame(updateProgress);
          } else {
              setReloadProgress(0);
          }
      };
      
      if (isReloading) frameId = requestAnimationFrame(updateProgress);
      return () => cancelAnimationFrame(frameId);
  }, [isReloading, reloadStartTime, weaponInfo]);

  if (gameState === GameState.MENU) {
     return (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 text-white">
           <h1 className="text-6xl font-black text-red-600 mb-4 tracking-tighter">ZOMBIES 3D</h1>
           <p className="mb-8 text-gray-400">Survival Mode</p>
           <button 
             onClick={resetGame}
             className="px-8 py-3 bg-red-900 hover:bg-red-700 text-white font-bold rounded text-xl border-2 border-red-500 transition-all shadow-[0_0_15px_rgba(255,0,0,0.5)]"
           >
             ENTER THE NIGHT
           </button>
        </div>
     );
  }

  if (gameState === GameState.PAUSED) {
    return (
       <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 text-white">
          <h1 className="text-5xl font-bold text-white mb-8 tracking-widest">PAUSED</h1>
          
          {activeTab === 'main' && (
              <div className="flex flex-col gap-4 w-64">
                <button onClick={() => setGameState(GameState.PLAYING)} className="btn-primary">RESUME</button>
                <button onClick={() => setActiveTab('settings')} className="btn-secondary">SETTINGS</button>
                <button onClick={() => setGameState(GameState.MENU)} className="btn-danger">QUIT</button>
              </div>
          )}

          {activeTab === 'settings' && (
              <div className="flex flex-col gap-6 w-96 p-6 bg-gray-900 border border-gray-700 rounded">
                  <h2 className="text-2xl font-bold text-center border-b border-gray-700 pb-2">SETTINGS</h2>
                  <div className="flex flex-col gap-2">
                      <label className="text-gray-400 text-sm">Sensitivity: {settings.sensitivity.toFixed(1)}</label>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="5.0" 
                        step="0.1"
                        value={settings.sensitivity}
                        onChange={(e) => updateSettings({ sensitivity: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                  </div>
                  <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                         <label className="text-gray-400 text-sm">FOV</label>
                         <input 
                            type="number" 
                            value={settings.fov} 
                            onChange={(e) => updateSettings({ fov: Math.max(90, Math.min(120, parseInt(e.target.value))) })}
                            className="bg-gray-800 text-white border border-gray-600 rounded px-2 w-16 text-center text-sm"
                         />
                      </div>
                      <input 
                        type="range" 
                        min="90" 
                        max="120" 
                        step="1"
                        value={settings.fov}
                        onChange={(e) => updateSettings({ fov: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                     <button onClick={() => setActiveTab('controls')} className="btn-secondary">CONTROLS</button>
                     <button onClick={() => setActiveTab('main')} className="btn-secondary mt-2">BACK</button>
                  </div>
              </div>
          )}

          {activeTab === 'controls' && (
              <div className="flex flex-col gap-2 w-96 p-6 bg-gray-900 border border-gray-700 rounded h-[80vh] overflow-y-auto">
                 <h2 className="text-2xl font-bold text-center border-b border-gray-700 pb-2 mb-4">CONTROLS</h2>
                 {Object.entries(settings.keys).map(([action, code]) => (
                     <div key={action} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                        <span className="uppercase text-sm font-bold text-gray-400">{action}</span>
                        <div className="relative group">
                            <span className="text-yellow-400 font-mono text-sm">{code}</span>
                            <div className="hidden group-hover:block absolute right-0 top-full text-xs text-gray-500 bg-black p-1">Edit in code for now</div>
                        </div>
                     </div>
                 ))}
                 <button onClick={() => setActiveTab('settings')} className="btn-secondary mt-4">BACK</button>
              </div>
          )}
       </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 text-white">
           <h1 className="text-6xl font-black text-red-600 mb-4">GAME OVER</h1>
           <p className="text-2xl mb-2">You survived {round} rounds.</p>
           <p className="text-yellow-500 text-xl mb-8">Score: {player.points}</p>
           <button 
             onClick={resetGame}
             className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded text-xl"
           >
             Try Again
           </button>
        </div>
    );
  }

  // Determine prompt
  let interactionPrompt = "";
  if (hoveredWallBuy) {
      if (currentWeapon === hoveredWallBuy.weapon) {
          const ammoCost = hoveredWallBuy.cost / 2;
          if (player.points >= ammoCost) {
              interactionPrompt = `Press [E] to Buy Ammo ($${ammoCost})`;
          } else {
              interactionPrompt = `Not enough points for Ammo ($${ammoCost})`;
          }
      } else {
          if (player.points >= hoveredWallBuy.cost) {
             interactionPrompt = `Press [E] to Buy Weapon ($${hoveredWallBuy.cost})`;
          } else {
             interactionPrompt = `Not enough points ($${hoveredWallBuy.cost})`;
          }
      }
  }

  const hpPercent = (player.health / player.maxHealth) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      <style>{`
        .btn-primary { @apply px-6 py-2 bg-gray-100 hover:bg-white text-black font-bold rounded transition-colors; }
        .btn-secondary { @apply px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded border border-gray-600 transition-colors; }
        .btn-danger { @apply px-6 py-2 bg-red-900/50 hover:bg-red-900 text-white font-bold rounded border border-red-900 transition-colors; }
      `}</style>

      {/* Damage Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
            background: 'radial-gradient(circle, transparent 60%, rgba(150, 0, 0, 0.5) 100%)',
            opacity: (100 - player.health) / 100
        }}
      />

      {/* Crosshair */}
      <div 
        className="crosshair shadow-[0_0_4px_white] transition-colors duration-75"
        style={{ backgroundColor: isHeadshot ? 'red' : 'white' }}
      />

      {/* Hitmarker Overlay */}
      {showHitMarker && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none z-50">
             <svg viewBox="0 0 100 100" fill="none" stroke={isHeadshot ? "red" : "white"} strokeWidth="8" strokeLinecap="round">
                 <line x1="20" y1="20" x2="40" y2="40" />
                 <line x1="80" y1="20" x2="60" y2="40" />
                 <line x1="20" y1="80" x2="40" y2="60" />
                 <line x1="80" y1="80" x2="60" y2="60" />
             </svg>
         </div>
      )}

      {/* Round Counter */}
      <div className="absolute bottom-8 left-8 text-red-700">
         <div className="text-6xl font-black drop-shadow-[0_0_5px_rgba(255,0,0,0.8)] border-b-4 border-red-800 inline-block pr-12">
           {round}
         </div>
         {roundMessage && (
            <div className="text-white text-xl mt-2 animate-pulse tracking-widest font-serif italic">
               {roundMessage}
            </div>
         )}
      </div>

      {/* Points */}
      <div className="absolute bottom-32 right-8 text-yellow-400 font-mono text-4xl font-bold drop-shadow-md text-right">
        ${player.points}
      </div>

      {/* HEALTH BAR */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-64 h-6 bg-gray-900 border-2 border-gray-700 rounded-full overflow-hidden relative">
              <div 
                className="h-full transition-all duration-300 ease-out"
                style={{ 
                    width: `${hpPercent}%`,
                    backgroundColor: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#eab308' : '#ef4444' 
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                  {Math.round(player.health)} / {player.maxHealth}
              </span>
          </div>
      </div>

      {/* Weapon Info & Reload Bar */}
      <div className="absolute bottom-8 right-8 text-white text-right flex flex-col items-end">
         <h2 className="text-2xl font-bold text-gray-300 uppercase tracking-widest mb-1">{weaponInfo.name}</h2>
         <div className="flex items-end justify-end gap-2">
            <span className={`text-6xl font-bold ${isReloading ? 'text-red-500' : 'text-white'}`}>
                {isReloading ? 0 : currentAmmo.mag}
            </span>
            <span className="text-3xl text-gray-400 mb-1">/ {currentAmmo.reserve}</span>
         </div>
         {isReloading && (
             <div className="w-32 h-2 bg-gray-700 mt-2 rounded-full overflow-hidden">
                 <div className="h-full bg-white transition-all duration-75 ease-linear" style={{ width: `${reloadProgress}%` }} />
             </div>
         )}
      </div>
      
      {/* Interaction Prompt */}
      {interactionPrompt && (
          <div className="absolute top-2/3 left-1/2 -translate-x-1/2 text-lg text-white font-bold drop-shadow-md bg-black/50 px-4 py-2 rounded">
             {interactionPrompt}
          </div>
      )}
    </div>
  );
};

export default HUD;