import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import WallBuy from './WallBuy';
import { WeaponType } from '../../types';
import { DoubleSide } from 'three';
import { WALLS } from '../../data/levelData';
import { Stars } from '@react-three/drei';

const Level: React.FC = () => {
  const redLightRef = useRef<any>(null);
  
  useFrame(({ clock }) => {
    // Flickering Effect for Red Light
    if (redLightRef.current) {
        // Base intensity + random flicker
        const flicker = Math.random() > 0.9 ? Math.random() * 4 : 0;
        const wave = Math.sin(clock.getElapsedTime() * 2) * 2;
        redLightRef.current.intensity = 2 + wave + flicker;
    }
  });

  return (
    <group>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* --- FLOORS & CEILINGS --- */}
      {/* Floor - White as requested */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.2} metalness={0.1} />
      </mesh>
      
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#1a1a1a" side={DoubleSide} />
      </mesh>

      {/* --- WALLS --- */}
      {WALLS.map((wall, index) => {
          let color = "#666"; // Lighter grey concrete
          if (wall.x < -12) color = "#6e4b4b"; // West (Red/Rusty)
          if (wall.x > 12) color = "#4b4b6e"; // East (Blue/Tech)
          
          return (
              <mesh key={`wall-${index}`} position={[wall.x, 3, wall.z]} castShadow receiveShadow>
                  <boxGeometry args={[wall.width, 6, wall.depth]} />
                  <meshStandardMaterial color={color} roughness={0.9} />
              </mesh>
          );
      })}

      {/* --- DECORATIONS --- */}
      {/* Columns */}
      <mesh position={[-5, 3, -5]}>
         <boxGeometry args={[1.2, 6, 1.2]} />
         <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[5, 3, -5]}>
         <boxGeometry args={[1.2, 6, 1.2]} />
         <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[-5, 3, 5]}>
         <boxGeometry args={[1.2, 6, 1.2]} />
         <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[5, 3, 5]}>
         <boxGeometry args={[1.2, 6, 1.2]} />
         <meshStandardMaterial color="#444" />
      </mesh>

      {/* Crates */}
      <mesh position={[-20, 1, -5]} rotation={[0, 0.5, 0]}>
         <boxGeometry args={[2, 2, 2]} />
         <meshStandardMaterial color="#6d5047" />
      </mesh>
      <mesh position={[-21, 0.5, -3.5]} rotation={[0, 0.2, 0]}>
         <boxGeometry args={[1.5, 1, 1.5]} />
         <meshStandardMaterial color="#4e3733" />
      </mesh>

      {/* Lab Tables */}
      <mesh position={[20, 0.8, -5]}>
         <boxGeometry args={[5, 0.1, 2]} />
         <meshStandardMaterial color="#999" metalness={0.8} />
      </mesh>
      <mesh position={[20, 0.4, -5.9]}>
         <boxGeometry args={[0.2, 0.8, 0.2]} />
         <meshStandardMaterial color="#666" />
      </mesh>
      <mesh position={[20, 0.4, -4.1]}>
         <boxGeometry args={[0.2, 0.8, 0.2]} />
         <meshStandardMaterial color="#666" />
      </mesh>


      {/* --- LIGHTING --- */}
      {/* Lower Ambient for better contrast */}
      <ambientLight intensity={0.2} /> 
      <fog attach="fog" args={['#050505', 2, 35]} />

      {/* Main Hall Lights - Brighter */}
      <group position={[0, 5.5, 0]}>
          <mesh>
             <boxGeometry args={[4, 0.2, 0.5]} />
             <meshStandardMaterial emissive="#ffaa00" emissiveIntensity={8} color="#222" />
          </mesh>
          <pointLight intensity={6} distance={30} color="#ffaa00" castShadow shadow-bias={-0.0001} />
      </group>

      {/* West Room Light (Creepy Red) - Flickering */}
      <group position={[-20, 5.5, 0]}>
          <mesh>
              <cylinderGeometry args={[0.2, 0.2, 0.5]} />
              <meshStandardMaterial emissive="red" emissiveIntensity={8} color="red" />
          </mesh>
          <pointLight ref={redLightRef} intensity={5} distance={35} color="red" decay={2} />
      </group>

      {/* East Room Light (Cold Blue) */}
      <group position={[20, 5.5, 0]}>
           <mesh rotation={[0, 0, Math.PI/2]}>
              <cylinderGeometry args={[0.1, 0.1, 4]} />
              <meshStandardMaterial emissive="cyan" emissiveIntensity={8} color="cyan" />
          </mesh>
          <pointLight intensity={5} distance={35} color="cyan" />
      </group>


      {/* --- WALL BUYS --- */}
      
      <WallBuy position={[0, 1.5, -14.475]} rotation={[0, 0, 0]} weaponType={WeaponType.RIFLE} />
      <WallBuy position={[0, 1.5, 14.475]} rotation={[0, Math.PI, 0]} weaponType={WeaponType.PUMP} />
      <WallBuy position={[24.475, 1.5, 0]} rotation={[0, -Math.PI/2, 0]} weaponType={WeaponType.SHOTGUN} />
      <WallBuy position={[-24.475, 1.5, 0]} rotation={[0, Math.PI/2, 0]} weaponType={WeaponType.PISTOL} />
      <WallBuy position={[-9.475, 1.5, 5]} rotation={[0, Math.PI/2, 0]} weaponType={WeaponType.SMG} />
      <WallBuy position={[9.475, 1.5, -5]} rotation={[0, -Math.PI/2, 0]} weaponType={WeaponType.SNIPER} />

    </group>
  );
};

export default Level;