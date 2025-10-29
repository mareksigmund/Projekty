import { TestBed } from '@angular/core/testing';

import { NoteStoreService } from './note-store.service';

describe('NoteStoreService', () => {
  let service: NoteStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoteStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
