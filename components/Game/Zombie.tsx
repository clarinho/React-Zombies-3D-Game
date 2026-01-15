import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import { Vector3, Group, MathUtils, Euler } from 'three';
import { useGameStore } from '../../store';
import { ZombieVariant, GameState } from '../../types';

interface ZombieProps {
  id: string;
  initialPosition: Vector3;
  speed: number;
}

const Zombie: React.FC<ZombieProps> = ({ id, initialPosition, speed }) => {
  const groupRef = useRef<Group>(null);
  const { zombieAttack, addBloodSplatter } = useGameStore();
  
  const flashTime = useRef(0);
  
  const zombieData = useGameStore(state => state.zombies.find(z => z.id === id));
  
  const health = zombieData?.health || 0;
  const maxHealth = zombieData?.maxHealth || 100;
  const variant: ZombieVariant = zombieData?.variant || 'standard';
  const lastHitType = zombieData?.lastHitType || 'none';

  const prevHealth = useRef(health);
  
  // Detect damage event
  if (health < prevHealth.current) {
      flashTime.current = Date.now();
      prevHealth.current = health;
      
      // Trigger Global Blood Splatter
      if (groupRef.current) {
          const count = lastHitType === 'head' ? 12 : 6;
          const originY = lastHitType === 'head' ? 2.3 : 1.5;
          const worldPos = groupRef.current.position.clone();
          worldPos.y += originY;
          
          addBloodSplatter(worldPos.toArray(), count);
      }
  }

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (useGameStore.getState().gameState !== GameState.PLAYING) return;
    
    // Zombie Movement
    const playerPos = useGameStore.getState().player.position;
    const zombiePos = groupRef.current.position;

    const direction = new Vector3().subVectors(playerPos, zombiePos);
    direction.y = 0; 
    const distance = direction.length();
    
    groupRef.current.lookAt(playerPos.x, zombiePos.y, playerPos.z);

    if (distance > 1.2) { 
        direction.normalize().multiplyScalar(speed * delta);
        groupRef.current.position.add(direction);
    } else {
        zombieAttack(id);
    }
  });

  const isJustHit = Date.now() - flashTime.current < 150;
  const shouldFlashRed = isJustHit && lastHitType === 'head';

  const healthPercent = Math.max(0, health / maxHealth);

  // Variant Visuals
  let color = "#4a5e35"; // Green standard
  if (variant === 'fast') color = "#6e3535"; 
  if (variant === 'tank') color = "#333"; 

  const effectiveColor = shouldFlashRed ? "#ff0000" : color;
  
  // Scale based on variant
  let scale = 1;
  if (variant === 'fast') scale = 0.9;
  if (variant === 'tank') scale = 1.3;

  return (
    <group ref={groupRef} position={initialPosition} userData={{ zombieId: id }} scale={[scale, scale, scale]}>
      {/* Health Bar - Moved Up and Ignored by Raycast */}
      <Billboard position={[0, 3.2, 0]}>
         <mesh position={[0, 0, 0]} userData={{ ignoreRaycast: true }}>
             <planeGeometry args={[1, 0.1]} />
             <meshBasicMaterial color="black" />
         </mesh>
         <mesh position={[(healthPercent - 1) * 0.5, 0, 0.01]} userData={{ ignoreRaycast: true }}>
             <planeGeometry args={[healthPercent, 0.08]} />
             <meshBasicMaterial color={healthPercent > 0.5 ? "green" : "red"} />
         </mesh>
      </Billboard>

      {/* Body - Reduced height so head sticks out */}
      <mesh position={[0, 1.2, 0]} userData={{ zombieId: id, bodyPart: 'body' }}>
        <capsuleGeometry args={[0.3, 1.4, 4, 8]} />
        <meshStandardMaterial color={effectiveColor} roughness={0.8} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[0.3, 2, 0.4]} rotation={[1.5, 0, -0.2]} userData={{ zombieId: id }}>
         <boxGeometry args={[0.15, 0.8, 0.15]} />
         <meshStandardMaterial color={color} />
      </mesh>
       <mesh position={[-0.3, 2, 0.4]} rotation={[1.5, 0, 0.2]} userData={{ zombieId: id }}>
         <boxGeometry args={[0.15, 0.8, 0.15]} />
         <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Head - Slightly larger, positioned so it's not inside body */}
      <group position={[0, 2.3, 0]}>
         <mesh userData={{ zombieId: id, bodyPart: 'head' }}>
             <sphereGeometry args={[0.35]} />
             <meshStandardMaterial color={effectiveColor} roughness={0.8} />
         </mesh>
         
         <mesh position={[0.15, 0, 0.25]} userData={{ zombieId: id, bodyPart: 'head' }}>
            <sphereGeometry args={[0.05]} />
            <meshStandardMaterial color="yellow" emissive="orange" emissiveIntensity={2} />
         </mesh>
         <mesh position={[-0.15, 0, 0.25]} userData={{ zombieId: id, bodyPart: 'head' }}>
            <sphereGeometry args={[0.05]} />
            <meshStandardMaterial color="yellow" emissive="orange" emissiveIntensity={2} />
         </mesh>

         {variant === 'tank' && (
             <mesh position={[0, 0.2, 0]} userData={{ zombieId: id, bodyPart: 'head' }}>
                 <cylinderGeometry args={[0.32, 0.35, 0.3]} />
                 <meshStandardMaterial color="#111" metalness={0.8} />
             </mesh>
         )}
      </group>
    </group>
  );
};

export default Zombie;