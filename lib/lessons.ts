export type Question = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type Lesson = {
  id: string;
  number: number;
  title: string;
  topic: "fractions" | "geometry" | "decimals" | "percentages" | "ratios";
  free: boolean;
  summary: string;
  content: string;
  /** 3D model under public/models/ — drag to rotate, AR on supported phones */
  modelSrc?: string;
  iosModelSrc?: string;
  /** Attribution shown under the 3D viewer (author + license) */
  modelCredit?: string;
  /** Hint for the on-screen 3D diagram */
  shapeHint?: "cube" | "sphere" | "cylinder" | "cone" | "compass" | "pyramid" | "cuboid" | "hemisphere";
  question: Question;
};

/**
 * Place matching .glb files in public/models/
 * e.g. public/models/cube.glb → modelSrc: "/models/cube.glb"
 * Edit modelCredit on each lesson to the real author + license from your download page.
 */
export const LESSONS: Lesson[] = [
  {
    id: "3d-cube",
    number: 1,
    title: "Meet the Cube",
    topic: "geometry",
    free: true,
    summary: "Explore a cube in 3D — faces, edges and corners.",
    content:
      "A cube is a solid shape with 6 square faces, 12 edges and 8 corners (vertices). " +
      "Every face is the same size. Dice, boxes and ice cubes are everyday cubes. " +
      "Rotate the 3D model to count the faces yourself — you should always see at most 3 faces at once from one view.",
    modelSrc: "/models/cube.glb",
    modelCredit: "3d lattice (https://skfb.ly/IUz7) by dansmath is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/). ",
    shapeHint: "cube",
    question: {
      id: "q1",
      prompt: "How many faces does a cube have?",
      options: ["4", "6", "8", "12"],
      correctIndex: 1,
      explanation: "A cube has 6 square faces — like the six sides of a die.",
    },
  },
  {
    id: "3d-sphere",
    number: 2,
    title: "Spheres and Balls",
    topic: "geometry",
    free: true,
    summary: "A sphere is perfectly round in every direction.",
    content:
      "A sphere is a 3D shape where every point on the surface is the same distance from the centre. " +
      "Footballs, globes and bubbles are nearly spheres. A sphere has no faces, edges or corners — only a curved surface. " +
      "Spin the model to see that it looks circular from every angle.",
    modelSrc: "/models/sphere.glb",
    modelCredit: "Riemann Sphere (https://skfb.ly/oA6xR) by Rosedale is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).",
    shapeHint: "sphere",
    question: {
      id: "q2",
      prompt: "How many flat faces does a sphere have?",
      options: ["0", "1", "2", "6"],
      correctIndex: 0,
      explanation: "A sphere has no flat faces — only one continuous curved surface.",
    },
  },
  {
    id: "3d-cuboid",
    number: 3,
    title: "Cuboids (Rectangular Boxes)",
    topic: "geometry",
    free: true,
    summary: "A box shape with 6 rectangular faces.",
    content:
      "A cuboid (rectangular prism) has 6 faces that are rectangles, 12 edges and 8 vertices. " +
      "Unlike a cube, the faces are not all the same size — length, width and height can differ. " +
      "Books, rooms and many cartons are cuboids. Rotate the model and compare the three different face sizes.",
    modelSrc: "/models/cuboid.glb",
    modelCredit: "Cube Outline (https://skfb.ly/6BXO7) by robinhuse is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).",
    shapeHint: "cuboid",
    question: {
      id: "q3",
      prompt: "How many edges does a cuboid have?",
      options: ["6", "8", "12", "16"],
      correctIndex: 2,
      explanation: "Like a cube, a cuboid has 12 edges.",
    },
  },
  {
    id: "3d-cylinder",
    number: 4,
    title: "Cylinders",
    topic: "geometry",
    free: true,
    summary: "Two circular ends and a curved side — like a can.",
    content:
      "A cylinder has 2 flat circular faces and 1 curved surface. It has 2 curved edges (the rims) and no corners. " +
      "Tins, pipes and batteries are cylinders. Turn the 3D model to see the circles on top and bottom and the curved wall between them.",
    modelSrc: "/models/cylinder.glb",
    modelCredit: "Cylinder Transparent Artistic Reference (https://skfb.ly/onOWN) by dgscott922 is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).",
    shapeHint: "cylinder",
    question: {
      id: "q4",
      prompt: "How many flat faces does a cylinder have?",
      options: ["0", "1", "2", "3"],
      correctIndex: 2,
      explanation: "A cylinder has 2 flat circular faces (top and bottom).",
    },
  },
  {
    id: "3d-cone",
    number: 5,
    title: "Cones",
    topic: "geometry",
    free: true,
    summary: "A circular base that tapers to a point.",
    content:
      "A cone has 1 flat circular face, 1 curved surface, 1 curved edge and 1 vertex (the apex). " +
      "Ice-cream cones, party hats and traffic cones are real-life examples. " +
      "Rotate the model and find the sharp tip and the round base.",
    modelSrc: "/models/cone.glb",
    modelCredit: "Cone Transparent Artistic Reference (https://skfb.ly/onOXw) by dgscott922 is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).",
    shapeHint: "cone",
    question: {
      id: "q5",
      prompt: "How many vertices (corners) does a cone have?",
      options: ["0", "1", "2", "3"],
      correctIndex: 1,
      explanation: "A cone has one vertex — the apex at the tip.",
    },
  },
  {
    id: "3d-pyramid",
    number: 6,
    title: "Pyramids",
    topic: "geometry",
    free: true,
    summary: "A base with triangular faces meeting at a point.",
    content:
      "A square-based pyramid has 5 faces (1 square + 4 triangles), 8 edges and 5 vertices. " +
      "The famous pyramids of Egypt are this kind of shape. " +
      "Use the 3D model to count the triangular sides rising to the top point.",
    modelSrc: "/models/pyramid.glb",
    modelCredit: "copper meditation pyramid (https://skfb.ly/oDQFX) by shirlanne is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).",
    shapeHint: "pyramid",
    question: {
      id: "q6",
      prompt: "A square-based pyramid has how many faces in total?",
      options: ["3", "4", "5", "6"],
      correctIndex: 2,
      explanation: "1 square base + 4 triangular faces = 5 faces.",
    },
  },
  {
    id: "3d-compass",
    number: 7,
    title: "Compass and Directions",
    topic: "geometry",
    free: true,
    summary: "Use a compass rose to name North, East, South and West.",
    content:
      "A compass helps us find direction. The four main (cardinal) points are North (N), East (E), South (S) and West (W). " +
      "Turning a quarter-turn clockwise from North faces East. A full turn is 360°. " +
      "Spin the 3D compass model and practise reading the directions.",
    modelSrc: "/models/compass.glb",
    modelCredit: "Compass_Rose (https://skfb.ly/oDooW) by Kateryna is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).",
    shapeHint: "compass",
    question: {
      id: "q7",
      prompt: "If you face North and turn a quarter-turn clockwise, which way do you face?",
      options: ["South", "West", "East", "North"],
      correctIndex: 2,
      explanation: "A quarter-turn clockwise from North is East.",
    },
  },
  {
    id: "3d-hemisphere",
    number: 8,
    title: "Hemispheres",
    topic: "geometry",
    free: true,
    summary: "Half of a sphere — like a dome or bowl.",
    content:
      "A hemisphere is half a sphere. It has 1 flat circular face and 1 curved surface. " +
      "Domes, bowls and the Northern or Southern Hemisphere of Earth are examples. " +
      "Inspect the model: one side is flat, the other is rounded.",
    modelSrc: "/models/hemisphere.glb",
    modelCredit: "Hemisphere (https://skfb.ly/67xNy) by artwork guide is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).",
    shapeHint: "hemisphere",
    question: {
      id: "q8",
      prompt: "How many flat faces does a hemisphere have?",
      options: ["0", "1", "2", "3"],
      correctIndex: 1,
      explanation: "A hemisphere has one flat circular face where the sphere was cut.",
    },
  },
  {
    id: "3d-edges-vertices",
    number: 9,
    title: "Edges and Vertices",
    topic: "geometry",
    free: true,
    summary: "Count edges and corners on solid shapes.",
    content:
      "An edge is where two faces meet. A vertex (corner) is where edges meet. " +
      "Cube: 12 edges, 8 vertices. Square pyramid: 8 edges, 5 vertices. Sphere: 0 edges, 0 vertices. " +
      "Rotate each model and count carefully — edges are the straight lines, vertices are the points.",
    modelSrc: "/models/vertices.glb",
    modelCredit: "Hesse Model for divisors of 30 (https://skfb.ly/6WBRE) by Griffin is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).",
    shapeHint: "cube",
    question: {
      id: "q9",
      prompt: "How many vertices does a cube have?",
      options: ["4", "6", "8", "12"],
      correctIndex: 2,
      explanation: "A cube has 8 corners (vertices).",
    },
  },
  {
    id: "3d-volume-cube",
    number: 10,
    title: "Volume of a Cube",
    topic: "geometry",
    free: true,
    summary: "Measure the space inside a cube.",
    content:
      "Volume is the space inside a 3D shape. For a cube with side length a: Volume = a × a × a = a³. " +
      "If each edge is 3 cm, volume = 3 × 3 × 3 = 27 cm³. " +
      "Look at the cube model and imagine filling it with 1 cm unit cubes.",
    modelSrc: "/models/volume.glb",
    modelCredit: "Stereometry (https://skfb.ly/oXsWL) by arloopa is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).",
    shapeHint: "cube",
    question: {
      id: "q10",
      prompt: "A cube has side length 2 m. What is its volume?",
      options: ["4 m³", "6 m³", "8 m³", "12 m³"],
      correctIndex: 2,
      explanation: "Volume = 2 × 2 × 2 = 8 m³.",
    },
  },
  // Paid
  {
    id: "3d-surface-area",
    number: 11,
    title: "Surface Area of a Cube",
    topic: "geometry",
    free: false,
    summary: "Find the total area of all six faces.",
    content:
      "Surface area is the total area of all outer faces. For a cube with side a: Surface area = 6 × a². " +
      "If a = 4 cm, each face is 16 cm² and total surface area is 6 × 16 = 96 cm². " +
      "Rotate the model and picture unfolding all six squares into a net.",
    modelSrc: "/models/volume.glb",
    modelCredit: "Stereometry (https://skfb.ly/oXsWL) by arloopa is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).",
    shapeHint: "cube",
    question: {
      id: "q11",
      prompt: "A cube has side 3 cm. What is its surface area?",
      options: ["9 cm²", "27 cm²", "54 cm²", "36 cm²"],
      correctIndex: 2,
      explanation: "6 × (3 × 3) = 6 × 9 = 54 cm².",
    },
  },
  {
    id: "3d-sphere-radius",
    number: 12,
    title: "Sphere: Centre and Radius",
    topic: "geometry",
    free: false,
    summary: "Every point on a sphere is the same distance from the centre.",
    content:
      "The radius of a sphere is the distance from the centre to any point on the surface. " +
      "The diameter is twice the radius and passes through the centre. " +
      "Spin the sphere model and imagine a line from the middle to the outside — that length is the radius.",
    modelSrc: "/models/sphere.glb",
    modelCredit: "Sphere 3D model — replace with author name & license",
    shapeHint: "sphere",
    question: {
      id: "q12",
      prompt: "If a sphere’s radius is 5 cm, what is its diameter?",
      options: ["5 cm", "10 cm", "15 cm", "25 cm"],
      correctIndex: 1,
      explanation: "Diameter = 2 × radius = 2 × 5 = 10 cm.",
    },
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function freeLessons(): Lesson[] {
  return LESSONS.filter((l) => l.free);
}

export function paidLessons(): Lesson[] {
  return LESSONS.filter((l) => !l.free);
}
