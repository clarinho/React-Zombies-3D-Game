import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3 } from 'three';
import { useGameStore, WEAPONS } from '../../store';
import { WeaponType } from '../../types';

interface WallBuyProps {
  position: [number, number, number];
  rotation: [number, number, number];
  weaponType: WeaponType;
}

const WallBuy: React.FC<WallBuyProps> = ({ position, rotation, weaponType }) => {
  const { player, buyWeapon, buyAmmo, setHoveredWallBuy } = useGameStore();
  const [hovered, setHovered] = useState(false);
  const weaponData = WEAPONS[weaponType];
  const groupRef = useRef<any>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    
    const dist = player.position.distanceTo(new Vector3(...position));
    const isClose = dist < 3;
    
    if (isClose !== hovered) {
        setHovered(isClose);
        if (isClose) {
            setHoveredWallBuy({ weapon: weaponType, cost: weaponData.price });
        } else {
            // Only clear if WE are the one who set it (simple check: if not close, clear)
            // Potential race condition if multiple close, but rare in this layout
            setHoveredWallBuy(null);
        }
    }
  });

  // Handle Input
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' && hovered) {
         if (useGameStore.getState().currentWeapon === weaponType) {
             buyAmmo(weaponType, weaponData.price / 2); 
         } else {
             buyWeapon(weaponType);
         }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hovered, weaponType, weaponData]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Chalk Outline Box - Flush with wall */}
      {/* WallBuy depth is 0.05. Position is set so back is flush. */}
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[1.5, 0.8, 0.05]} />
        <meshStandardMaterial color="#222" transparent opacity={0.8} />
      </mesh>
      
      {/* Weapon Outline - Slightly protruding */}
      <mesh position={[0, 0, 0.06]}>
         <boxGeometry args={[1, 0.2, 0.05]} />
         <meshStandardMaterial color={weaponData.color} emissive={weaponData.color} emissiveIntensity={0.5} />
      </mesh>

      {/* Info Text */}
      <Text
        position={[0, 0.6, 0.06]}
        fontSize={0.2}
        color={hovered ? "yellow" : "white"}
        anchorX="center"
        anchorY="middle"
      >
        {weaponData.name} - ${weaponData.price}
      </Text>
      
      {/* Remove 3D prompt text, moved to HUD */}
    </group>
  );
};

export default WallBuy;