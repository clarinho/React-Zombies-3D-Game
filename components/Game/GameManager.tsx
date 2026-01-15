import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store';
import { Vector3 } from 'three';
import Zombie from './Zombie';
import { generateRoundIntro, generateGameOverMessage } from '../../services/geminiService';
import { ZombieVariant } from '../../types';

// Updated Spawn Points for the new Room Layout
const SPAWN_POINTS = [
    new Vector3(0, 0, -14),  // Main Room North Back Wall
    new Vector3(0, 0, 14),   // Main Room South Back Wall
    new Vector3(-25, 0, 0),  // West Room Far Wall
    new Vector3(25, 0, 0),   // East Room Far Wall
    new Vector3(-15, 0, 10), // Corner West
    new Vector3(15, 0, -10)  // Corner East
];

const GameManager: React.FC = () => {
  const { 
    round, 
    zombies, 
    spawnZombie, 
    setRoundMessage, 
    nextRound, 
    gameState, 
    setGameState,
    player
  } = useGameStore();
  
  const zombiesToSpawnRef = useRef(0);
  const nextSpawnTimeRef = useRef(0);
  const roundActiveRef = useRef(false);

  // Round Logic
  useEffect(() => {
     // If Game Over or Menu, don't run logic
     if (gameState === 'GAME_OVER' || gameState === 'MENU') return;

     if (round === 0) {
         nextRound();
         return;
     }

     // Only start round logic if we haven't already processed this round (implicit by zombiesToSpawnRef being refilled)
     // But strictly, we just want this to run when `round` changes.
     
     const startRound = async () => {
         roundActiveRef.current = true;
         zombiesToSpawnRef.current = 5 + Math.floor(round * 2);
         
         const msg = await generateRoundIntro(round);
         setRoundMessage(msg);
         
         setTimeout(() => setRoundMessage(""), 5000);
     };

     startRound();
     
  }, [round]); // Removed gameState dependency to prevent wave reset on pause

  // Game Over Logic
  useEffect(() => {
      if (gameState === 'GAME_OVER') {
          document.exitPointerLock();
          generateGameOverMessage(round);
      }
  }, [gameState, round]);

  // Spawning Loop
  useFrame(({ clock }) => {
     if (gameState !== 'PLAYING') return;
     const time = clock.getElapsedTime();

     // Spawn
     if (zombiesToSpawnRef.current > 0 && time > nextSpawnTimeRef.current) {
         if (zombies.filter(z => z.active).length < 24) { // Entity limit
             const spawnPoint = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
             const id = `zombie_${round}_${zombiesToSpawnRef.current}`;
             
             let speed = 1 + (round * 0.1); 
             let health = 100 + (round * 50);
             let variant: ZombieVariant = 'standard';
             
             // Variant Logic
             const rand = Math.random();
             if (round > 2 && rand < 0.2) {
                 variant = 'fast';
                 speed *= 1.5;
                 health *= 0.6;
             } else if (round > 5 && rand > 0.9) {
                 variant = 'tank';
                 speed *= 0.7;
                 health *= 2.5;
             }
             
             spawnZombie(id, spawnPoint, speed, health, variant);
             zombiesToSpawnRef.current--;
             nextSpawnTimeRef.current = time + (Math.random() * 2 + 1); 
         }
     }

     // Check Round End
     if (zombiesToSpawnRef.current === 0 && zombies.every(z => !z.active) && roundActiveRef.current) {
         roundActiveRef.current = false;
         // Delay next round
         setTimeout(() => {
             nextRound();
         }, 5000);
     }
  });
  
  // Auto-heal
  const lastHealTime = useRef(0);
  useFrame(({ clock }) => {
      if (gameState !== 'PLAYING') return;
      if (clock.getElapsedTime() - lastHealTime.current > 1) {
          useGameStore.getState().healPlayer();
          lastHealTime.current = clock.getElapsedTime();
      }
  });

  return (
    <group>
        {zombies.map(z => z.active && (
            <Zombie key={z.id} id={z.id} initialPosition={z.position} speed={z.speed} />
        ))}
    </group>
  );
};

export default GameManager;