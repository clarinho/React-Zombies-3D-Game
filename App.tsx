import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import HUD from './components/HUD';
import Player from './components/Game/Player';
import GameManager from './components/Game/GameManager';
import Level from './components/World/Level';
import CameraController from './components/Game/CameraController';
import DamageIndicators from './components/Game/DamageIndicators';
import BloodSystem from './components/Game/BloodSystem';
import { useGameStore } from './store';
import { GameState } from './types';

function App() {
  const gameState = useGameStore(state => state.gameState);

  return (
    <div className="w-full h-full relative bg-black">
      <Canvas
        shadows
        camera={{ fov: 90, near: 0.1, far: 1000 }}
        gl={{ alpha: false }}
        dpr={[1, 2]}
      >
        <CameraController />
        <Sky sunPosition={[100, 20, 100]} turbidity={10} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
        
        {/* Render game world objects always */}
        <Level />
        <DamageIndicators />
        <BloodSystem />
        
        {/* Render Player during play and pause (so we see the weapon in background of pause menu) */}
        {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
            <Player />
        )}

        {/* Logic only runs when playing, but keep mounted during pause to preserve state */}
        {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
            <GameManager />
        )}
      </Canvas>
      
      <HUD />
    </div>
  );
}

export default App;