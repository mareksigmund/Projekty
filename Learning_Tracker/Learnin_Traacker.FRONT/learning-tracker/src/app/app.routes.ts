import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import path from 'path';
import { AuthComponent } from './features/auth/auth.component';
{
}
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { EditNoteComponent } from './features/notes/edit-note/edit-note.component';
import { LayoutComponent } from './features/layout/layout/layout.component';
import { QuizListComponent } from './features/quiz/quiz-list.component';
import { QuizRunComponent } from './features/quiz/quiz-run/quiz-run.component';
import { NotesListComponent } from './features/notes/notes-list/notes-list.component';
import { NotePreviewComponent } from './features/notes/note-preview/note-preview.component';
import { AddNoteComponent } from './features/notes/add-note/add-note.component';
import { AccountComponent } from './features/account/account.component';
import { StatsComponent } from './features/stats/stats.component';

export const routes: Routes = [
  { path: '', component: AuthComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'notes', component: NotesListComponent },
      { path: 'notes/:id', component: NotePreviewComponent },
      { path: 'edit-note/:id', component: EditNoteComponent },
      { path: 'add-note', component: AddNoteComponent },
      { path: 'quiz', component: QuizListComponent },
      { path: 'dashboard/account', component: AccountComponent },
      { path: 'dashboard/stats', component: StatsComponent },
      { path: 'quiz/run/:noteId', component: QuizRunComponent }, // AI
      { path: 'quiz/run-db/:noteId', component: QuizRunComponent }, // tylko z bazy
      { path: 'quiz/run-mixed/:noteId', component: QuizRunComponent }, // mieszany
    ],
  },
];
