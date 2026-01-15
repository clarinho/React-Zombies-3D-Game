// Simple AABB (Axis Aligned Bounding Box) definition
// Center (x, z), Size (width, depth)
export interface WallDef {
    x: number;
    z: number;
    width: number;
    depth: number;
}

export const WALLS: WallDef[] = [
    // Main Hall
    { x: 0, z: -15, width: 20, depth: 1 }, // North Back
    { x: 0, z: 15, width: 20, depth: 1 },  // South Back
    { x: -10, z: -10, width: 1, depth: 10 }, // West North Segment
    { x: -10, z: 10, width: 1, depth: 10 },  // West South Segment
    { x: 10, z: -10, width: 1, depth: 10 },  // East North Segment
    { x: 10, z: 10, width: 1, depth: 10 },   // East South Segment

    // West Room (Generator)
    { x: -25, z: 0, width: 1, depth: 15 },    // Far West
    { x: -17.5, z: -7.5, width: 15, depth: 1 }, // West North
    { x: -17.5, z: 7.5, width: 15, depth: 1 },  // West South

    // East Room (Lab)
    { x: 25, z: 0, width: 1, depth: 15 },     // Far East
    { x: 17.5, z: -7.5, width: 15, depth: 1 },  // East North
    { x: 17.5, z: 7.5, width: 15, depth: 1 },   // East South
    
    // Pillars (Main Hall)
    { x: -5, z: -5, width: 1, depth: 1 },
    { x: 5, z: -5, width: 1, depth: 1 },
    { x: -5, z: 5, width: 1, depth: 1 },
    { x: 5, z: 5, width: 1, depth: 1 },
    
    // Props - Crates
    { x: -20, z: -5, width: 2.5, depth: 2.5 },
    
    // Props - Tables
    { x: 20, z: -5, width: 6, depth: 2 },
];
