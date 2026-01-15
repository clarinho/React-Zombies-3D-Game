import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGameStore } from '../../store';
import { PerspectiveCamera } from 'three';

const CameraController: React.FC = () => {
    const { camera } = useThree();
    const fov = useGameStore(state => state.settings.fov);

    useEffect(() => {
        if (camera instanceof PerspectiveCamera) {
            camera.fov = fov;
            camera.updateProjectionMatrix();
        }
    }, [fov, camera]);

    return null;
};

export default CameraController;
