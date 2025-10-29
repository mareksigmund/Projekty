export interface QuizQuestion {
  id: number;
  question: string;
  answers: string[];
  correctAnswer: string;
  category?: string;
  sourceType?: string;
  createdAt: string;
}
