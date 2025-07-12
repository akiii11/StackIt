export interface Questions {
  id: string; // Unique identifier for the question
  title: string; // Title of the question
  description: string; // Detailed description of the question
  tags: { id: string; name: string }[]; // Array of tag objects associated with the question
  answers: Answers[]; // Array of answers associated with the question
  authorId: string; // ID of the user who authored the question
  createdAt: Date; // Timestamp when the question was created
}

export interface Answers {
  id: string; // Unique identifier for the answer
  content: string; // Content of the answer
  questionId: string; // ID of the question this answer belongs to
  authorId: string; // ID of the user who authored the answer
  createdAt: Date; // Timestamp when the answer was created
}
