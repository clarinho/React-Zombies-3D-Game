import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useGameStore } from '../../store';
import { Vector3, Group } from 'three';

const FloatingText: React.FC<{ 
  position: [number, number, number]; 
  damage: number; 
  isCritical: boolean;
  onComplete: () => void;
}> = ({ position, damage, isCritical, onComplete }) => {
  const ref = useRef<Group>(null);
  const startTime = useRef(Date.now());
  const initialPos = useRef(new Vector3(...position));
  
  // Random offset for visual variety
  const offset = useRef(new Vector3((Math.random()-0.5)*0.5, Math.random()*0.5, (Math.random()-0.5)*0.5));

  useFrame(() => {
    if (!ref.current) return;
    const elapsed = Date.now() - startTime.current;
    const life = 1000; // 1 second life

    if (elapsed > life) {
      onComplete();
      return;
    }

    const p = elapsed / life;
    
    // Float up logic
    ref.current.position.copy(initialPos.current);
    ref.current.position.add(offset.current);
    ref.current.position.y += p * 1.5; // Float up 1.5 units
    
    // Scale pulse for critical
    if (isCritical) {
        const scale = 1 + Math.sin(p * Math.PI) * 0.5;
        ref.current.scale.setScalar(scale);
    }

    // Fade out
    ref.current.lookAt(useGameStore.getState().player.position);
  });

  return (
    <group ref={ref} userData={{ ignoreRaycast: true }}>
        <Text
            userData={{ ignoreRaycast: true }}
            fontSize={isCritical ? 0.4 : 0.25}
            color={isCritical ? "red" : "#ff4444"}
            outlineWidth={0.02}
            outlineColor="black"
            anchorX="center"
            anchorY="middle"
        >
            {`-${Math.round(damage)}`}
        </Text>
    </group>
  );
};

const DamageIndicators: React.FC = () => {
  const damageIndicators = useGameStore(state => state.damageIndicators);
  const removeDamageIndicator = useGameStore(state => state.removeDamageIndicator);

  return (
    <>
      {damageIndicators.map(indicator => (
        <FloatingText
          key={indicator.id}
          position={indicator.position}
          damage={indicator.damage}
          isCritical={indicator.isCritical}
          onComplete={() => removeDamageIndicator(indicator.id)}
        />
      ))}
    </>
  );
};

export default DamageIndicators;