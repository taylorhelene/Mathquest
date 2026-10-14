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
  /** Optional 3D model path (local /models/... or public CDN .glb) for AR */
  modelSrc?: string;
  iosModelSrc?: string;
  question: Question;
};

/** Shared public sample models (modelviewer.dev) so AR works without local files */
const SAMPLE_GLB =
  "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
const SAMPLE_SPHERE =
  "https://modelviewer.dev/shared-assets/models/reflective-sphere.gltf";

export const LESSONS: Lesson[] = [
  {
    id: "fractions-halves",
    number: 1,
    title: "Halves of a Whole",
    topic: "fractions",
    free: true,
    summary: "Understand what one-half means using everyday objects.",
    content:
      "A whole can be split into two equal parts. Each equal part is called one-half, written as 1/2. " +
      "If you share a pizza equally with a friend, each of you gets 1/2 of the pizza. " +
      "The bottom number (denominator) tells how many equal parts the whole is divided into. " +
      "The top number (numerator) tells how many of those parts you have.",
    modelSrc: SAMPLE_SPHERE,
    question: {
      id: "q1",
      prompt:
        "A chocolate bar is broken into 2 equal pieces. What fraction is one piece?",
      options: ["1/4", "1/2", "2/2", "1/3"],
      correctIndex: 1,
      explanation:
        "Two equal pieces means each piece is one-half of the whole bar: 1/2.",
    },
  },
  {
    id: "fractions-quarters",
    number: 2,
    title: "Quarters and Fourths",
    topic: "fractions",
    free: true,
    summary: "Divide a whole into four equal parts and name them.",
    content:
      "When a whole is divided into four equal parts, each part is one-quarter (or one-fourth), written 1/4. " +
      "Two quarters make one-half: 2/4 = 1/2. Three quarters is 3/4. " +
      "Look around: a sandwich cut into four triangles, a clock face into four quarters of an hour.",
    modelSrc: SAMPLE_SPHERE,
    question: {
      id: "q2",
      prompt: "Which fraction is the same as one-half?",
      options: ["1/4", "2/4", "3/4", "4/4"],
      correctIndex: 1,
      explanation:
        "2/4 means two out of four equal parts, which is the same as half of the whole.",
    },
  },
  {
    id: "fractions-compare",
    number: 3,
    title: "Comparing Simple Fractions",
    topic: "fractions",
    free: true,
    summary:
      "Decide which fraction is larger when denominators match or are simple.",
    content:
      "When two fractions have the same denominator, the one with the larger numerator is bigger. " +
      "So 3/5 is greater than 2/5. When denominators differ, try to picture the parts or find a common whole. " +
      "1/2 is larger than 1/3 because halves are bigger pieces than thirds of the same whole.",
    modelSrc: SAMPLE_SPHERE,
    question: {
      id: "q3",
      prompt: "Which is larger: 1/2 or 1/4?",
      options: ["1/4", "They are equal", "1/2", "Cannot tell"],
      correctIndex: 2,
      explanation:
        "Halves are larger pieces than quarters of the same whole, so 1/2 > 1/4.",
    },
  },
  {
    id: "geometry-shapes",
    number: 4,
    title: "Basic 2D Shapes",
    topic: "geometry",
    free: true,
    summary: "Name triangles, rectangles, squares and circles by their properties.",
    content:
      "A triangle has 3 sides. A rectangle has 4 sides with opposite sides equal and four right angles. " +
      "A square is a special rectangle where all sides are equal. A circle is a perfectly round shape with every point the same distance from the centre.",
    modelSrc: SAMPLE_GLB,
    question: {
      id: "q4",
      prompt: "How many sides does a triangle have?",
      options: ["2", "3", "4", "5"],
      correctIndex: 1,
      explanation: "By definition a triangle has exactly three sides.",
    },
  },
  {
    id: "geometry-perimeter",
    number: 5,
    title: "Perimeter of Rectangles",
    topic: "geometry",
    free: true,
    summary: "Find the distance around a rectangle.",
    content:
      "Perimeter is the total length around a shape. For a rectangle, add the lengths of all four sides: " +
      "Perimeter = 2 × (length + width). Example: a garden 5 m long and 3 m wide has perimeter 2 × (5 + 3) = 16 m.",
    modelSrc: SAMPLE_GLB,
    question: {
      id: "q5",
      prompt: "A rectangle is 6 cm long and 4 cm wide. What is its perimeter?",
      options: ["10 cm", "20 cm", "24 cm", "12 cm"],
      correctIndex: 1,
      explanation: "2 × (6 + 4) = 2 × 10 = 20 cm.",
    },
  },
  {
    id: "geometry-area",
    number: 6,
    title: "Area of Rectangles",
    topic: "geometry",
    free: true,
    summary: "Measure the space inside a rectangle.",
    content:
      "Area measures the space inside a shape. For a rectangle: Area = length × width. " +
      "Units are square units (cm², m²). A floor 4 m by 3 m has area 12 m².",
    modelSrc: SAMPLE_GLB,
    question: {
      id: "q6",
      prompt: "What is the area of a rectangle 5 m long and 3 m wide?",
      options: ["8 m²", "15 m²", "16 m²", "10 m²"],
      correctIndex: 1,
      explanation: "Area = length × width = 5 × 3 = 15 m².",
    },
  },
  {
    id: "decimals-tenths",
    number: 7,
    title: "Tenths and Hundredths",
    topic: "decimals",
    free: true,
    summary: "Read and write numbers with one or two decimal places.",
    content:
      "The first digit after the decimal point is tenths (1/10). The second is hundredths (1/100). " +
      "0.3 means three tenths. 0.25 means two tenths and five hundredths, or 25 hundredths. " +
      "Money uses two decimal places: KES 12.50 means 12 shillings and 50 cents.",
    modelSrc: SAMPLE_SPHERE,
    question: {
      id: "q7",
      prompt: "What does 0.7 mean?",
      options: ["7 wholes", "7 tenths", "7 hundredths", "7 thousandths"],
      correctIndex: 1,
      explanation: "The first place after the decimal is tenths, so 0.7 = 7/10.",
    },
  },
  {
    id: "percentages-basics",
    number: 8,
    title: "What is a Percentage?",
    topic: "percentages",
    free: true,
    summary: "Understand percent as parts out of 100.",
    content:
      "Percent means “out of 100”. 50% is 50 out of 100, which equals 1/2. " +
      "25% = 1/4. 10% of 80 is 8. To find a percentage of a number, multiply by the percent and divide by 100.",
    modelSrc: SAMPLE_SPHERE,
    question: {
      id: "q8",
      prompt: "What is 50% of 40?",
      options: ["10", "20", "25", "30"],
      correctIndex: 1,
      explanation: "50% is half, so half of 40 is 20.",
    },
  },
  {
    id: "ratios-simplify",
    number: 9,
    title: "Simple Ratios",
    topic: "ratios",
    free: true,
    summary: "Compare quantities using ratios.",
    content:
      "A ratio compares two quantities. If there are 2 red counters and 3 blue, the ratio of red to blue is 2:3. " +
      "Ratios can be simplified like fractions: 4:6 simplifies to 2:3 by dividing both parts by 2.",
    modelSrc: SAMPLE_GLB,
    question: {
      id: "q9",
      prompt: "Simplify the ratio 4:6.",
      options: ["4:6", "2:3", "1:2", "3:2"],
      correctIndex: 1,
      explanation:
        "Divide both numbers by 2: 4÷2 = 2 and 6÷2 = 3, so 2:3.",
    },
  },
  {
    id: "fractions-add-same",
    number: 10,
    title: "Adding Fractions (Same Denominator)",
    topic: "fractions",
    free: true,
    summary: "Add fractions that share the same bottom number.",
    content:
      "When denominators are the same, add the numerators and keep the denominator. " +
      "1/5 + 2/5 = 3/5. Always check if the answer can be simplified. " +
      "3/6 + 1/6 = 4/6 = 2/3.",
    modelSrc: SAMPLE_SPHERE,
    question: {
      id: "q10",
      prompt: "What is 2/7 + 3/7?",
      options: ["5/14", "5/7", "6/7", "1/7"],
      correctIndex: 1,
      explanation:
        "Same denominator: add numerators 2 + 3 = 5, keep 7 → 5/7.",
    },
  },
  {
    id: "geometry-angles",
    number: 11,
    title: "Types of Angles",
    topic: "geometry",
    free: false,
    summary: "Identify acute, right, obtuse and straight angles.",
    content:
      "An acute angle is less than 90°. A right angle is exactly 90°. " +
      "An obtuse angle is greater than 90° but less than 180°. A straight angle is 180°.",
    modelSrc: SAMPLE_GLB,
    question: {
      id: "q11",
      prompt: "An angle of 90° is called a…",
      options: ["Acute angle", "Right angle", "Obtuse angle", "Straight angle"],
      correctIndex: 1,
      explanation: "Exactly 90° is a right angle.",
    },
  },
  {
    id: "percentages-increase",
    number: 12,
    title: "Percentage Increase",
    topic: "percentages",
    free: false,
    summary: "Calculate how much a value grows by a given percent.",
    content:
      "To increase a number by a percentage: new value = original × (1 + percent/100). " +
      "A price of KES 200 increased by 10% becomes 200 × 1.10 = KES 220.",
    modelSrc: SAMPLE_SPHERE,
    question: {
      id: "q12",
      prompt: "Increase 50 by 20%. What is the new value?",
      options: ["60", "70", "10", "40"],
      correctIndex: 0,
      explanation: "50 × 1.20 = 60.",
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
