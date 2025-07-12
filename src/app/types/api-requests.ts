export interface SignUpRequestData {
  email: string;
  username: string;
  password: string;
}

export interface QuestionPostRequestData {
  title: string; // The title of the question
  description: string; // The HTML content of the question description
  tagIds: string[]; // Array of tags associated with the question
}
export interface QuestionPutRequestData {
  id: string; // The ID of the question to update
  title?: string; // Optional updated title
  description?: string; // Optional updated description
  tag?: string[]; // Optional updated tags
}
