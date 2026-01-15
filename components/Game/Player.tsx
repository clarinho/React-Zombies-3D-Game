import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { Vector3, Raycaster, Vector2, Intersection } from 'three';
import { useGameStore, WEAPONS } from '../../store';
import { GameState } from '../../types';
import WeaponModel from './WeaponModel';
import { WALLS } from '../../data/levelData';

const WALK_SPEED = 8;
const SPRINT_SPEED = 14;
const GRAVITY = 30;
const JUMP_FORCE = 10;
const PLAYER_RADIUS = 0.5;
const MELEE_RANGE = 2.5;
const MELEE_DAMAGE = 150; 

const Player: React.FC = () => {
  const { camera, scene } = useThree();
  const { 
    updatePlayerPosition, 
    setPlayerMovementState,
    shootWeapon, 
    meleeAttack,
    reloadWeapon, 
    finishReload, 
    currentWeapon, 
    isReloading, 
    damageZombie,
    triggerHitMarker,
    addDamageIndicator,
    setGameState,
    gameState,
    lastFired,
    settings
  } = useGameStore();

  const controlsRef = useRef<any>(null);
  
  // Inputs
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  const isSprinting = useRef(false);
  
  // Physics State
  const velocity = useRef(new Vector3());
  const canJump = useRef(false);
  
  // Shake State
  const shakeIntensity = useRef(0);

  // Initialize Player State on Mount (Respawn/Start)
  useEffect(() => {
     camera.position.set(0, 1.7, 0);
     camera.rotation.set(0, 0, 0);
     velocity.current.set(0, 0, 0);
     updatePlayerPosition(new Vector3(0, 1.7, 0));
     
     const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
     const beep = (freq: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        gain.gain.value = 0.1;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
        osc.stop(audioCtx.currentTime + 0.1);
     };
     
     (window as any).playHitSound = () => beep(800);
     (window as any).playHeadshotSound = () => beep(1200);

     return () => audioCtx.close();
  }, []);

  // Sync sensitivity
  useEffect(() => {
    if(controlsRef.current) {
        controlsRef.current.pointerSpeed = settings.sensitivity;
    }
  }, [settings.sensitivity, gameState]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const k = settings.keys;

      if (gameState !== GameState.PLAYING && event.code !== k.pause) return;

      if (event.code === k.forward) moveForward.current = true;
      if (event.code === k.left) moveLeft.current = true;
      if (event.code === k.backward) moveBackward.current = true;
      if (event.code === k.right) moveRight.current = true;
      if (event.code === k.sprint) isSprinting.current = true;
      if (event.code === k.jump && canJump.current) {
          velocity.current.y = JUMP_FORCE;
          canJump.current = false;
      }
      if (event.code === k.reload) reloadWeapon();
      
      if (event.code === k.melee) {
          if (meleeAttack()) {
              handleMeleeHit();
          }
      }

      if (event.code === k.pause) { 
           if (gameState === GameState.PLAYING) {
               setGameState(GameState.PAUSED);
               document.exitPointerLock();
           } else if (gameState === GameState.PAUSED) {
               setGameState(GameState.PLAYING);
           }
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const k = settings.keys;
      if (event.code === k.forward) moveForward.current = false;
      if (event.code === k.left) moveLeft.current = false;
      if (event.code === k.backward) moveBackward.current = false;
      if (event.code === k.right) moveRight.current = false;
      if (event.code === k.sprint) isSprinting.current = false;
    };
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [reloadWeapon, gameState, setGameState, settings.keys, meleeAttack]);

  // Handle Reload Timer
  useEffect(() => {
    if (isReloading) {
        const weapon = WEAPONS[currentWeapon];
        const timeout = setTimeout(() => {
            finishReload();
        }, weapon.reloadTime);
        return () => clearTimeout(timeout);
    }
  }, [isReloading, currentWeapon, finishReload]);

  // Shooting Input
  useEffect(() => {
      const handleMouseDown = (e: MouseEvent) => {
          if (gameState !== GameState.PLAYING) return;
          if (document.pointerLockElement !== controlsRef.current?.domElement) return;
          
          if (e.button === 0) { // Left click
             const shot = shootWeapon();
             if (shot) {
                 handleShootingHit();
             }
          }
      };
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [shootWeapon, currentWeapon, gameState]);

  // Helper to check if object or parents should be ignored
  const isIgnored = (obj: any) => {
      let current = obj;
      while (current) {
          if (current.userData && current.userData.ignoreRaycast) return true;
          current = current.parent;
      }
      return false;
  };

  const handleMeleeHit = () => {
     const raycaster = new Raycaster();
     raycaster.setFromCamera(new Vector2(0, 0), camera);
     
     const intersects = raycaster.intersectObjects(scene.children, true);
     for (let i = 0; i < intersects.length; i++) {
          const hit = intersects[i];
          if (hit.distance > MELEE_RANGE) break;

          if (isIgnored(hit.object)) continue;

          let obj: any = hit.object;
          let zombieId = null;
          // Traverse up to find if we hit a zombie
          while (obj) {
              if (obj.userData && obj.userData.zombieId) {
                  zombieId = obj.userData.zombieId;
                  break;
              }
              obj = obj.parent;
          }

          if (zombieId) {
              damageZombie(zombieId, MELEE_DAMAGE, 'body');
              
              // Positioning damage text
              const forward = new Vector3();
              camera.getWorldDirection(forward);
              const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
              const sideOffset = (Math.random() > 0.5 ? 1 : -1) * 0.4;
              
              const textPos = hit.point.clone()
                  .add(right.multiplyScalar(sideOffset))
                  .add(new Vector3(0, 0.5, 0))
                  .add(forward.multiplyScalar(-0.5));

              addDamageIndicator(textPos.toArray(), MELEE_DAMAGE, false);
              triggerHitMarker(false);
              (window as any).playHitSound?.();
              break; 
          }
     }
  };

  const handleShootingHit = () => {
      const raycaster = new Raycaster();
      raycaster.setFromCamera(new Vector2(0, 0), camera);
      const weapon = WEAPONS[currentWeapon];
      
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      for (let i = 0; i < intersects.length; i++) {
          const hit = intersects[i];
          if (hit.distance > weapon.range) break;

          // Robust ignore check: checks object and all parents
          if (isIgnored(hit.object)) continue;

          let obj: any = hit.object;
          
          let zombieId = null;
          let isHead = false;
          let foundEntity = false;

          // Check hit object first
          if (obj.userData && obj.userData.zombieId) {
             zombieId = obj.userData.zombieId;
             if (obj.userData.bodyPart === 'head') isHead = true;
             foundEntity = true;
          }

          // Traverse up
          if (!foundEntity) {
              let p = obj.parent;
              while (p) {
                  if (p.userData && p.userData.zombieId) {
                      zombieId = p.userData.zombieId;
                      foundEntity = true;
                      break;
                  }
                  p = p.parent;
              }
          }

          if (zombieId) {
              // 1.2x Headshot Multiplier
              const multiplier = isHead ? 1.2 : 1.0;
              const dmg = weapon.damage * multiplier;
              
              damageZombie(zombieId, dmg, isHead ? 'head' : 'body');
              
              // Calculate Position "next to" zombie
              const forward = new Vector3();
              camera.getWorldDirection(forward);
              forward.y = 0;
              forward.normalize();
              
              const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
              
              // Random side offset (Left or Right)
              const sideOffset = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.3);
              
              const textPos = hit.point.clone()
                  .add(right.multiplyScalar(sideOffset)) // Move to side
                  .add(new Vector3(0, 0.2, 0)) // Move up slightly
                  .add(forward.multiplyScalar(-0.8)); // Move towards camera to prevent clipping inside mesh

              addDamageIndicator(textPos.toArray(), dmg, isHead);
              triggerHitMarker(isHead);
              if (isHead) {
                  (window as any).playHeadshotSound?.();
              }
              else {
                  (window as any).playHitSound?.();
              }
              break; 
          }
          
          // Stop bullet on walls (non-zombies)
          if (!zombieId && hit.object.type === 'Mesh') {
             break; 
          }
      }
  };

  const checkCollision = (position: Vector3) => {
    for (const wall of WALLS) {
        const wMinX = wall.x - wall.width / 2;
        const wMaxX = wall.x + wall.width / 2;
        const wMinZ = wall.z - wall.depth / 2;
        const wMaxZ = wall.z + wall.depth / 2;

        const pMinX = position.x - PLAYER_RADIUS;
        const pMaxX = position.x + PLAYER_RADIUS;
        const pMinZ = position.z - PLAYER_RADIUS;
        const pMaxZ = position.z + PLAYER_RADIUS;

        if (pMaxX > wMinX && pMinX < wMaxX && pMaxZ > wMinZ && pMinZ < wMaxZ) {
            return true;
        }
    }
    return false;
  };

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;

    // --- SCREEN SHAKE ---
    if (shakeIntensity.current > 0) {
        const shake = shakeIntensity.current;
        const yaw = (Math.random() - 0.5) * shake;
        const pitch = (Math.random() - 0.5) * shake;
        camera.rotation.y += yaw;
        camera.rotation.x += pitch;
        shakeIntensity.current -= delta * 0.2; // Decay
        if (shakeIntensity.current < 0) shakeIntensity.current = 0;
    }

    // --- MOVEMENT LOGIC ---
    const forward = new Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; 
    forward.normalize();

    const right = new Vector3();
    right.crossVectors(forward, new Vector3(0, 1, 0)).normalize();

    const moveDir = new Vector3();
    if (moveForward.current) moveDir.add(forward);
    if (moveBackward.current) moveDir.sub(forward);
    if (moveRight.current) moveDir.add(right);
    if (moveLeft.current) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
    }

    const currentSpeed = isSprinting.current ? SPRINT_SPEED : WALK_SPEED;
    const moveVector = moveDir.multiplyScalar(currentSpeed * delta);
    
    velocity.current.y -= GRAVITY * delta;
    
    const oldPosition = camera.position.clone();
    const newPosition = oldPosition.clone();
    
    newPosition.x += moveVector.x;
    newPosition.z += moveVector.z;
    
    if (checkCollision(newPosition)) {
        const posXOnly = oldPosition.clone();
        posXOnly.x += moveVector.x;
        if (!checkCollision(posXOnly)) {
            newPosition.z = oldPosition.z; 
        } else {
            const posZOnly = oldPosition.clone();
            posZOnly.z += moveVector.z;
            if (!checkCollision(posZOnly)) {
                newPosition.x = oldPosition.x; 
            } else {
                newPosition.x = oldPosition.x;
                newPosition.z = oldPosition.z;
            }
        }
    }

    newPosition.y += velocity.current.y * delta;

    if (newPosition.y < 1.7) {
        newPosition.y = 1.7;
        velocity.current.y = 0;
        canJump.current = true;
    }

    camera.position.copy(newPosition);
    updatePlayerPosition(newPosition);

    const isMoving = moveDir.lengthSq() > 0;
    setPlayerMovementState(isMoving, isSprinting.current && isMoving);
  });

  return (
    <>
      {gameState === GameState.PLAYING && (
          <PointerLockControls ref={controlsRef} />
      )}
      <WeaponModel />
    </>
  );
};

export default Player;