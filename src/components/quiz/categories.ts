import {
  Palette,
  Volleyball,
  LayoutGrid,
  FlaskConical,
  Popcorn,
  Landmark,
  Globe,
} from "lucide-react";
import type { QuizCategory } from "@/types/quiz";

export const QUIZ_CATEGORIES: QuizCategory[] = [
  { id: "arts-literature", label: "Arts & Literature", icon: Palette, hue: 290 },
  { id: "sports", label: "Sports", icon: Volleyball, hue: 200 },
  { id: "general-knowledge", label: "General Knowledge", icon: LayoutGrid, hue: 145 },
  { id: "science-nature", label: "Science & Nature", icon: FlaskConical, hue: 265 },
  { id: "entertainment", label: "Entertainment", icon: Popcorn, hue: 25 },
  { id: "history", label: "History", icon: Landmark, hue: 350 },
  { id: "geography", label: "Geography", icon: Globe, hue: 160 },
];
