export interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  firebaseUid: string;
}

export interface CreateNoteDto {
  title: string;
  content: string;
  category: string;
  firebaseUid: string;
}

export interface UpdateNoteDto {
  title: string;
  content: string;
  category: string;
}
