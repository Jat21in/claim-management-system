import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ClaimsListComponent } from './claims-list.component';

describe('ClaimsListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ClaimsListComponent,
        HttpClientTestingModule
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ClaimsListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
