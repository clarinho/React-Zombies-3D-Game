import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3, DynamicDrawUsage, Euler } from 'three';
import { useGameStore } from '../../store';

const MAX_PARTICLES = 500;

interface Particle {
    active: boolean;
    position: Vector3;
    velocity: Vector3;
    rotation: Euler;
    rotSpeed: Vector3;
    scale: number;
    life: number;
    color: string;
}

const BloodSystem: React.FC = () => {
    const meshRef = useRef<InstancedMesh>(null);
    const { bloodQueue, clearBloodQueue } = useGameStore();
    const dummy = useMemo(() => new Object3D(), []);
    
    // Store physics state in a ref to avoid React renders on every frame
    const particles = useRef<Particle[]>([]);
    
    // Initialize pool
    useEffect(() => {
        for(let i=0; i<MAX_PARTICLES; i++) {
            particles.current.push({
                active: false,
                position: new Vector3(),
                velocity: new Vector3(),
                rotation: new Euler(),
                rotSpeed: new Vector3(),
                scale: 1,
                life: 0,
                color: '#8a0303'
            });
        }
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        // 1. Consume Queue
        const queue = useGameStore.getState().bloodQueue;
        if (queue.length > 0) {
            queue.forEach(event => {
                let spawned = 0;
                // Find inactive particles
                for(let i=0; i<particles.current.length; i++) {
                    if (spawned >= event.count) break;
                    if (!particles.current[i].active) {
                        const p = particles.current[i];
                        p.active = true;
                        p.position.set(
                            event.position[0] + (Math.random()-0.5)*0.5,
                            event.position[1] + (Math.random()-0.5)*0.5,
                            event.position[2] + (Math.random()-0.5)*0.5
                        );
                        // Explosive velocity
                        p.velocity.set(
                            (Math.random()-0.5) * 4,
                            Math.random() * 4 + 2, 
                            (Math.random()-0.5) * 4
                        );
                        p.rotation.set(Math.random(), Math.random(), Math.random());
                        p.rotSpeed.set(
                            (Math.random()-0.5)*10, 
                            (Math.random()-0.5)*10, 
                            (Math.random()-0.5)*10
                        );
                        p.scale = Math.random() * 0.12 + 0.08;
                        p.life = 2 + Math.random() * 2;
                        p.color = event.color;
                        spawned++;
                    }
                }
            });
            clearBloodQueue();
        }

        // 2. Update Physics & Rendering
        let activeCount = 0;
        
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles.current[i];
            if (!p.active) {
                // Move inactive instances out of view
                dummy.position.set(0, -100, 0);
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
                continue;
            }

            activeCount++;

            // Physics
            p.velocity.y -= 25 * delta; // Gravity
            p.position.addScaledVector(p.velocity, delta);

            // Ground Collision
            if (p.position.y <= p.scale / 2) {
                p.position.y = p.scale / 2;
                
                // Bounce
                if (Math.abs(p.velocity.y) > 0.5) {
                    p.velocity.y = -p.velocity.y * 0.4;
                } else {
                    p.velocity.y = 0;
                }

                // Friction
                p.velocity.x *= 0.8;
                p.velocity.z *= 0.8;
                
                // Dampen rotation
                p.rotSpeed.multiplyScalar(0.9);
            }

            // Rotation
            p.rotation.x += p.rotSpeed.x * delta;
            p.rotation.y += p.rotSpeed.y * delta;
            p.rotation.z += p.rotSpeed.z * delta;

            // Life
            p.life -= delta;
            if (p.life <= 0) {
                p.active = false;
            }

            // Update Instance Matrix
            dummy.position.copy(p.position);
            dummy.rotation.copy(p.rotation);
            dummy.scale.setScalar(p.scale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh 
            ref={meshRef} 
            args={[undefined, undefined, MAX_PARTICLES]} 
            userData={{ ignoreRaycast: true }}
            frustumCulled={false}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#8a0303" roughness={0.2} />
        </instancedMesh>
    );
};

export default BloodSystem;