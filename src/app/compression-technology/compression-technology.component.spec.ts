import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompressionTechnologyComponent } from './compression-technology.component';

describe('CompressionTechnologyComponent', () => {
  let component: CompressionTechnologyComponent;
  let fixture: ComponentFixture<CompressionTechnologyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompressionTechnologyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompressionTechnologyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
