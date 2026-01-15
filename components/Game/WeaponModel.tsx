import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group } from 'three';
import { useGameStore, WEAPONS } from '../../store';
import { WeaponType } from '../../types';

const WeaponModel: React.FC = () => {
  const { currentWeapon, isReloading, lastFired, lastMelee, player } = useGameStore();
  const groupRef = useRef<Group>(null);
  const knifeRef = useRef<Group>(null);
  const { camera } = useThree();
  
  const recoilRef = useRef(0);
  const swayTime = useRef(0);
  
  // Reload Animation State
  const reloadStartTime = useRef(0);
  const [localReloading, setLocalReloading] = useState(false);

  useEffect(() => {
    if (isReloading && !localReloading) {
        setLocalReloading(true);
        reloadStartTime.current = Date.now();
    } else if (!isReloading) {
        setLocalReloading(false);
    }
  }, [isReloading, localReloading]);

  // Determine Muzzle Flash Position based on weapon type
  let muzzlePos: [number, number, number] = [0, 0.1, -0.8]; // Default
  if (currentWeapon === WeaponType.PISTOL) muzzlePos = [0, 0.1, -0.3];
  if (currentWeapon === WeaponType.RIFLE) muzzlePos = [0, 0.02, -0.8];
  if (currentWeapon === WeaponType.SHOTGUN) muzzlePos = [0, 0.05, -0.8]; // Double barrel
  if (currentWeapon === WeaponType.SMG) muzzlePos = [0, 0.05, -0.5];
  if (currentWeapon === WeaponType.SNIPER) muzzlePos = [0, 0.05, -1.2];
  if (currentWeapon === WeaponType.PUMP) muzzlePos = [0, 0.05, -0.9];


  // M1911 Geometry
  const PistolModel = () => (
      <group>
          <mesh position={[0, 0.05, 0]}>
             <boxGeometry args={[0.08, 0.08, 0.4]} />
             <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.1, 0.1]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[0.07, 0.25, 0.1]} />
             <meshStandardMaterial color="#3e2723" /> 
          </mesh>
          <mesh position={[0, -0.05, -0.05]} rotation={[0, 0, 0]}>
             <torusGeometry args={[0.04, 0.01, 8, 20]} />
             <meshStandardMaterial color="#222" />
          </mesh>
      </group>
  );

  // AK-47 Geometry
  const RifleModel = () => (
      <group position={[0, -0.05, -0.2]}>
          <mesh position={[0, 0, 0]}>
             <boxGeometry args={[0.1, 0.12, 0.4]} />
             <meshStandardMaterial color="#333" metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.02, -0.5]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.02, 0.02, 0.6, 12]} />
             <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, 0.05, -0.4]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.015, 0.015, 0.4, 12]} />
             <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, -0.05, 0.35]}>
             <boxGeometry args={[0.08, 0.15, 0.3]} />
             <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0, 0, -0.35]}>
             <boxGeometry args={[0.09, 0.08, 0.3]} />
             <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0, -0.2, -0.1]} rotation={[0.4, 0, 0]}>
             <boxGeometry args={[0.08, 0.3, 0.1]} />
             <meshStandardMaterial color="#444" />
          </mesh>
           <mesh position={[0, -0.15, 0.15]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[0.07, 0.2, 0.1]} />
             <meshStandardMaterial color="#8B4513" /> 
          </mesh>
      </group>
  );

  // Olympia Shotgun Geometry
  const ShotgunModel = () => (
      <group position={[0, -0.05, -0.1]}>
          <mesh position={[-0.02, 0.05, -0.6]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.025, 0.025, 0.9, 12]} />
             <meshStandardMaterial color="#444" metalness={0.8} />
          </mesh>
          <mesh position={[0.02, 0.05, -0.6]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.025, 0.025, 0.9, 12]} />
             <meshStandardMaterial color="#444" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
             <boxGeometry args={[0.12, 0.1, 0.3]} />
             <meshStandardMaterial color="#777" metalness={0.9} />
          </mesh>
          <mesh position={[0, -0.08, 0.3]}>
             <boxGeometry args={[0.1, 0.15, 0.4]} />
             <meshStandardMaterial color="#5D4037" />
          </mesh>
          <mesh position={[0, 0.02, -0.4]}>
             <boxGeometry args={[0.1, 0.06, 0.4]} />
             <meshStandardMaterial color="#5D4037" />
          </mesh>
      </group>
  );

  // SMG (MP5)
  const SMGModel = () => (
    <group position={[0, -0.05, -0.2]}>
         {/* Body */}
        <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.08, 0.1, 0.3]} />
            <meshStandardMaterial color="#111" />
        </mesh>
        {/* Barrel */}
        <mesh position={[0, 0.05, -0.3]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 12]} />
            <meshStandardMaterial color="#111" />
        </mesh>
        {/* Mag (Curved approx) */}
        <mesh position={[0, -0.15, -0.05]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.06, 0.25, 0.08]} />
            <meshStandardMaterial color="#222" />
        </mesh>
         {/* Grip */}
         <mesh position={[0, -0.1, 0.1]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.06, 0.15, 0.08]} />
            <meshStandardMaterial color="#111" />
        </mesh>
        {/* Retractable Stock */}
         <mesh position={[0, 0.05, 0.3]}>
            <boxGeometry args={[0.04, 0.04, 0.3]} />
            <meshStandardMaterial color="#333" />
        </mesh>
    </group>
  );

  // Sniper (L96)
  const SniperModel = () => (
    <group position={[0, -0.05, -0.2]}>
         {/* Long Barrel */}
        <mesh position={[0, 0.05, -0.7]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 1.0, 12]} />
            <meshStandardMaterial color="#222" />
        </mesh>
         {/* Body */}
        <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.5]} />
            <meshStandardMaterial color="#3e4a38" />
        </mesh>
        {/* Scope */}
        <mesh position={[0, 0.12, -0.1]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.25, 12]} />
            <meshStandardMaterial color="#111" />
        </mesh>
        {/* Stock */}
        <mesh position={[0, -0.05, 0.4]}>
            <boxGeometry args={[0.08, 0.15, 0.3]} />
            <meshStandardMaterial color="#3e4a38" />
        </mesh>
         {/* Bolt */}
         <mesh position={[0.08, 0.05, 0.1]}>
             <sphereGeometry args={[0.03]} />
             <meshStandardMaterial color="#888" />
         </mesh>
    </group>
  );

  // Pump Shotgun (Remington)
  const PumpModel = () => (
    <group position={[0, -0.05, -0.2]}>
        {/* Barrel */}
        <mesh position={[0, 0.05, -0.5]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.7, 12]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        {/* Mag Tube */}
        <mesh position={[0, 0.02, -0.5]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.6, 12]} />
            <meshStandardMaterial color="#222" />
        </mesh>
        {/* Receiver */}
        <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.09, 0.1, 0.25]} />
            <meshStandardMaterial color="#222" />
        </mesh>
        {/* Pump Handle (moves?) */}
        <mesh position={[0, 0.01, -0.45]}>
            <boxGeometry args={[0.06, 0.06, 0.2]} />
            <meshStandardMaterial color="#3e2723" />
        </mesh>
        {/* Stock */}
        <mesh position={[0, -0.05, 0.3]}>
            <boxGeometry args={[0.08, 0.12, 0.35]} />
            <meshStandardMaterial color="#3e2723" />
        </mesh>
    </group>
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Recoil
    const now = Date.now();
    const timeSinceFire = now - lastFired;
    let targetRecoil = 0;
    if (timeSinceFire < 100) targetRecoil = 0.2;
    recoilRef.current += (targetRecoil - recoilRef.current) * delta * 15;

    // Melee Animation check
    const isMeleeing = now - lastMelee < 300; // 300ms animation duration

    // Sway Logic
    let swaySpeed = 2;
    let swayAmp = 0.005;

    if (player.isMoving) {
        swaySpeed = player.isSprinting ? 12 : 8;
        swayAmp = player.isSprinting ? 0.05 : 0.02;
    }

    swayTime.current += delta * swaySpeed;
    const swayX = Math.cos(swayTime.current) * swayAmp;
    const swayY = Math.abs(Math.sin(swayTime.current)) * swayAmp;

    // Sync to Camera
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);

    if (isMeleeing) {
        groupRef.current.rotateX(-0.5);
        groupRef.current.rotateZ(0.5);
        groupRef.current.translateX(0.5);
        if (knifeRef.current) knifeRef.current.visible = true;
    } else {
        if (knifeRef.current) knifeRef.current.visible = false;
        
        // Base Position with Sway
        let posX = 0.3 + swayX;
        let posY = -0.25 - swayY;
        let posZ = -0.5 + recoilRef.current;
        let rotX = 0;
        let rotY = 0;
        let rotZ = 0;

        // Dynamic Reload Animation
        if (isReloading) {
            const reloadDuration = WEAPONS[currentWeapon].reloadTime;
            const elapsed = now - reloadStartTime.current;
            const progress = Math.min(elapsed / reloadDuration, 1);
            
            // Phase 1: Lower Gun (0 - 20%)
            if (progress < 0.2) {
                const p = progress / 0.2;
                rotX = -0.5 * p;
                posY -= 0.2 * p;
            }
            // Phase 2: "Eject Mag" / Wait (20% - 50%)
            else if (progress < 0.5) {
                rotX = -0.5;
                posY -= 0.2;
                // Add a little jerk for eject
                if (progress > 0.3 && progress < 0.35) {
                    posY += 0.05;
                }
            }
            // Phase 3: Insert Mag (Jerk Up) (50% - 70%)
            else if (progress < 0.7) {
                rotX = -0.5;
                posY -= 0.2;
                // Insertion Impulse
                if (progress > 0.6 && progress < 0.65) {
                   posY += 0.1; // Slam it in
                   rotX -= 0.1;
                }
            }
            // Phase 4: Raise (70% - 100%)
            else {
                const p = (progress - 0.7) / 0.3;
                rotX = -0.5 * (1 - p);
                posY = (-0.25 - 0.2) + (0.2 * p);
            }
            
            // Cocking animation for Rifles/Shotguns/SMGs/Snipers
            if (progress > 0.85 && currentWeapon !== WeaponType.PISTOL) {
                posZ += 0.1 * Math.sin((progress - 0.85) * 20);
            }
        }

        groupRef.current.translateX(posX);
        groupRef.current.translateY(posY);
        groupRef.current.translateZ(posZ);
        groupRef.current.rotateX(rotX);
        groupRef.current.rotateY(rotY);
        groupRef.current.rotateZ(rotZ);
    }
  });

  const showMuzzleFlash = Date.now() - lastFired < 50;

  return (
    <>
    <group ref={groupRef} userData={{ ignoreRaycast: true }}>
      {/* Muzzle Flash */}
      {showMuzzleFlash && (
         <group position={muzzlePos}>
            <mesh>
               <sphereGeometry args={[0.08]} />
               <meshBasicMaterial color="yellow" />
            </mesh>
            <pointLight distance={3} intensity={5} color="#ffffaa" />
         </group>
      )}

      {currentWeapon === WeaponType.PISTOL && <PistolModel />}
      {currentWeapon === WeaponType.RIFLE && <RifleModel />}
      {currentWeapon === WeaponType.SHOTGUN && <ShotgunModel />}
      {currentWeapon === WeaponType.SMG && <SMGModel />}
      {currentWeapon === WeaponType.SNIPER && <SniperModel />}
      {currentWeapon === WeaponType.PUMP && <PumpModel />}
      
      {/* Knife Mesh */}
      <group ref={knifeRef} visible={false}>
          <mesh position={[-0.2, 0, -0.5]} rotation={[1, -0.5, 0]}>
             <boxGeometry args={[0.05, 0.4, 0.02]} />
             <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.2} />
          </mesh>
           <mesh position={[-0.2, -0.2, -0.4]} rotation={[1, -0.5, 0]}>
             <cylinderGeometry args={[0.03, 0.03, 0.15]} />
             <meshStandardMaterial color="#222" />
          </mesh>
      </group>
    </group>
    </>
  );
};

export default WeaponModel;