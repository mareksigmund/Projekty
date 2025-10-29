import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Route, RouterModule } from '@angular/router';
import { Note } from '../note';
import { NoteStoreService } from '../../../core/note-store.service';
import { Router } from '@angular/router';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-note-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './note-preview.component.html',
  styleUrl: './note-preview.component.css',
})
export class NotePreviewComponent implements OnInit {
  note: Note | null = null;
  isLoading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private noteStore: NoteStoreService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.noteStore.notes$
      .pipe(
        switchMap((notes) => {
          const found = notes.find((n) => n.id === id);
          return found ? of(found) : of(null);
        })
      )
      .subscribe((n) => {
        this.note = n;
        this.isLoading = false;
        if (!n) this.error = 'Nie znaleziono notatki.';
      });
  }

  goToQuiz(type: 'ai' | 'db' | 'mixed') {
    if (this.note) {
      const base =
        '/quiz/run' +
        (type === 'db' ? '-db' : type === 'mixed' ? '-mixed' : '');
      this.router.navigate([`${base}/${this.note.id}`]);
    }
  }

  goBack() {
    this.router.navigate(['/notes']);
  }
}
