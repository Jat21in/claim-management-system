import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

interface Arc {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('globeCanvas') globeCanvas!: ElementRef<HTMLCanvasElement>;

  contactForm!: FormGroup;
  submitted = false;
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  private destroy$ = new Subject<void>();
  private animationId = 0;
  private rotation = 0;

  // ── Globe data ─────────────────────────────────────────────────────────────

  private readonly arcs: Arc[] = [
    {
      order: 1, startLat: 28.6139,  startLng: 77.209,   endLat: 3.139,   endLng: 101.6869, arcAlt: 0.2, color: '#06b6d4',
    },
    {
      order: 1, startLat: 51.5072,  startLng: -0.1276,  endLat: 40.7128, endLng: -74.006,  arcAlt: 0.3, color: '#3b82f6',
    },
    {
      order: 2, startLat: 1.3521,   startLng: 103.8198, endLat: 35.6762, endLng: 139.6503, arcAlt: 0.2, color: '#06b6d4',
    },
    {
      order: 2, startLat: 51.5072,  startLng: -0.1276,  endLat: 3.139,   endLng: 101.6869, arcAlt: 0.3, color: '#6366f1',
    },
    {
      order: 3, startLat: -33.8688, startLng: 151.2093, endLat: 22.3193, endLng: 114.1694, arcAlt: 0.3, color: '#3b82f6',
    },
    {
      order: 3, startLat: 21.3099,  startLng: -157.8581,endLat: 40.7128, endLng: -74.006,  arcAlt: 0.3, color: '#06b6d4',
    },
    {
      order: 4, startLat: -6.2088,  startLng: 106.8456, endLat: 51.5072, endLng: -0.1276,  arcAlt: 0.3, color: '#6366f1',
    },
    {
      order: 4, startLat: 51.5072,  startLng: -0.1276,  endLat: 48.8566, endLng: 2.3522,   arcAlt: 0.1, color: '#3b82f6',
    },
    {
      order: 5, startLat: 14.5995,  startLng: 120.9842, endLat: 51.5072, endLng: -0.1276,  arcAlt: 0.3, color: '#06b6d4',
    },
    {
      order: 5, startLat: 34.0522,  startLng: -118.2437,endLat: 48.8566, endLng: 2.3522,   arcAlt: 0.2, color: '#6366f1',
    },
    {
      order: 6, startLat: 49.2827,  startLng: -123.1207,endLat: 52.3676, endLng: 4.9041,   arcAlt: 0.2, color: '#3b82f6',
    },
    {
      order: 6, startLat: 22.3193,  startLng: 114.1694, endLat: -22.9068,endLng: -43.1729, arcAlt: 0.7, color: '#06b6d4',
    },
    {
      order: 7, startLat: 52.52,    startLng: 13.405,   endLat: 34.0522, endLng: -118.2437,arcAlt: 0.2, color: '#6366f1',
    },
    {
      order: 8, startLat: -8.833221,startLng: 13.264837,endLat:-33.936138,endLng:18.436529, arcAlt: 0.2, color: '#3b82f6',
    },
  ];

  private readonly continentPoints: [number, number][] = [
    // North America
    [60, -100],[55, -120],[50, -90],[48, -80],[45, -75],[40, -80],
    [35, -90],[30, -95],[25, -80],[20, -87],[50, -110],[45, -93],
    [55, -95],[60, -140],[65, -150],[58, -135],[47, -122],[37, -122],
    [34, -118],[30, -98],[40, -105],[44, -110],[48, -100],[52, -80],
    [43, -79],[42, -83],[38, -77],[33, -84],[29, -90],[26, -80],
    [19, -99],[25, -100],[32, -117],[36, -115],[46, -124],[58, -110],
    [62, -130],[70, -140],[67, -162],[64, -165],[60, -160],
    // Greenland
    [72, -40],[76, -45],[78, -25],[70, -25],[68, -50],[65, -40],
    // South America
    [10, -75],[0, -60],[-5, -35],[-10, -50],[-15, -47],[-20, -43],
    [-23, -46],[-30, -55],[-35, -58],[-40, -65],[-50, -70],[-55, -68],
    [5, -52],[-5, -75],[-15, -70],[0, -78],[-3, -60],[-8, -35],
    [-1, -48],[-16, -44],[-22, -47],[-26, -48],[5, -60],[0, -65],
    // Europe
    [60, 10],[55, 10],[50, 10],[48, 15],[45, 15],[42, 12],
    [52, 0],[48, 2],[40, -3],[37, -8],[55, 25],[60, 25],
    [65, 15],[70, 25],[63, 10],[56, 22],[47, 8],[44, 26],
    [41, 29],[38, 23],[51, 4],[53, 14],[50, 30],[46, 6],
    [57, 22],[60, 30],[65, 26],[70, 28],[52, 20],[48, 24],
    // Africa
    [35, 10],[30, 20],[20, 15],[10, 15],[0, 25],[-5, 35],
    [-15, 30],[-25, 25],[-30, 28],[-35, 20],[5, 40],[15, 40],
    [20, 35],[10, 5],[5, -5],[10, -10],[15, -15],[20, 5],
    [-10, 20],[-20, 15],[0, 10],[5, 20],[10, 30],[15, 25],
    [-25, 32],[-28, 25],[-34, 18],[35, 4],[30, 10],[25, 15],
    // Asia
    [60, 60],[55, 65],[50, 80],[45, 80],[40, 65],[35, 65],
    [30, 70],[25, 70],[20, 80],[15, 80],[10, 76],[22, 88],
    [28, 77],[35, 105],[40, 115],[30, 120],[22, 114],[35, 135],
    [45, 135],[55, 105],[60, 100],[65, 90],[70, 80],[70, 60],
    [65, 40],[60, 30],[40, 35],[37, 35],[32, 35],[25, 45],
    [35, 45],[30, 55],[24, 55],[25, 67],[35, 60],[39, 116],
    [31, 121],[23, 113],[37, 127],[35, 139],[43, 132],[55, 82],
    [52, 104],[47, 102],[43, 76],[38, 68],[33, 44],[36, 59],
    [60, 50],[65, 55],[70, 65],[67, 80],[62, 70],[57, 75],
    [50, 60],[45, 65],[40, 50],[30, 48],[25, 56],[20, 58],
    // Australia
    [-25, 130],[-30, 120],[-35, 150],[-38, 145],[-42, 147],
    [-20, 140],[-15, 130],[-25, 115],[-32, 116],[-27, 153],
    [-33, 151],[-37, 144],[-31, 116],[-23, 133],[-17, 122],[-15, 145],
    // Japan / Indonesia
    [35, 136],[35, 137],[34, 134],[33, 130],[40, 141],[43, 141],
    [-6, 107],[-8, 115],[-5, 105],[0, 109],[1, 110],[-2, 120],
  ];

  constructor(private fb: FormBuilder, private ngZone: NgZone) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.initializeForm();
  }

  ngAfterViewInit(): void {
    // Run outside Angular zone so requestAnimationFrame doesn't trigger CD
    this.ngZone.runOutsideAngular(() => {
      this.setupCanvas();
      this.startGlobe();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    cancelAnimationFrame(this.animationId);
  }

  // ── Canvas setup ───────────────────────────────────────────────────────────

  private setupCanvas(): void {
    const canvas = this.globeCanvas.nativeElement;
    const container = canvas.parentElement!;
    // Square canvas that fills the container, capped at 360px for retina clarity
    const size = Math.min(container.clientWidth, container.clientHeight, 360);
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
  }

  // ── Globe rendering ────────────────────────────────────────────────────────

  /** Project a lat/lng point onto the 2-D canvas given current rotation. */
  private project(
    lat: number,
    lng: number,
    rotation: number,
    radius: number,
    cx: number,
    cy: number,
  ) {
    const phi   = (90 - lat) * (Math.PI / 180);
    const theta = (lng + rotation) * (Math.PI / 180);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return { sx: cx + x, sy: cy - y, z };
  }

  /** Spherical linear interpolation along a great circle → array of [lat, lng]. */
  private greatCircle(
    lat1: number, lng1: number,
    lat2: number, lng2: number,
    steps: number,
  ): [number, number][] {
    const r = Math.PI / 180;
    const d = 180 / Math.PI;
    const φ1 = lat1 * r, λ1 = lng1 * r;
    const φ2 = lat2 * r, λ2 = lng2 * r;
    const [ax, ay, az] = [Math.cos(φ1)*Math.cos(λ1), Math.cos(φ1)*Math.sin(λ1), Math.sin(φ1)];
    const [bx, by, bz] = [Math.cos(φ2)*Math.cos(λ2), Math.cos(φ2)*Math.sin(λ2), Math.sin(φ2)];
    const dot = Math.min(1, Math.max(-1, ax*bx + ay*by + az*bz));
    const omega = Math.acos(dot);
    const sinO  = Math.sin(omega);
    return Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      let xi, yi, zi;
      if (Math.abs(sinO) < 1e-6) { xi = ax; yi = ay; zi = az; }
      else {
        const s1 = Math.sin((1 - t) * omega) / sinO;
        const s2 = Math.sin(t * omega) / sinO;
        xi = s1*ax + s2*bx; yi = s1*ay + s2*by; zi = s1*az + s2*bz;
      }
      return [
        Math.atan2(zi, Math.sqrt(xi*xi + yi*yi)) * d,
        Math.atan2(yi, xi) * d,
      ] as [number, number];
    });
  }

  private startGlobe(): void {
    const canvas = this.globeCanvas.nativeElement;
    const ctx    = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.38;          // globe radius

    // Pre-compute great-circle paths (elevated by arcAlt) for each arc
    const arcPaths = this.arcs.map(arc => ({
      arc,
      pts: this.greatCircle(
        arc.startLat, arc.startLng,
        arc.endLat,   arc.endLng,
        64,
      ),
    }));

    const PERIOD   = 3200;   // ms per arc animation cycle
    const OFFSET   = 500;    // ms stagger per order group
    const ROT_SPEED = 0.12;  // degrees per frame

    const draw = (ts: number) => {
      ctx.clearRect(0, 0, W, H);

      // ── Atmosphere glow ──────────────────────────────────────────────────
      const atm = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.22);
      atm.addColorStop(0,   'rgba(56,189,248,0.14)');
      atm.addColorStop(0.5, 'rgba(99,102,241,0.07)');
      atm.addColorStop(1,   'rgba(56,189,248,0)');
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
      ctx.fillStyle = atm; ctx.fill();

      // ── Globe sphere ─────────────────────────────────────────────────────
      const sphere = ctx.createRadialGradient(
        cx - R * 0.28, cy - R * 0.28, R * 0.05,
        cx, cy, R,
      );
      sphere.addColorStop(0,   '#0e2868');
      sphere.addColorStop(0.5, '#071540');
      sphere.addColorStop(1,   '#020918');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = sphere; ctx.fill();

      // ── Clip everything to the sphere ────────────────────────────────────
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Latitude grid lines
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lng = -180; lng <= 180; lng += 2) {
          const p = this.project(lat, lng, this.rotation, R, cx, cy);
          if (p.z > 0) {
            started ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy);
            started = true;
          } else { started = false; }
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }

      // Longitude grid lines
      for (let lng = -180; lng < 180; lng += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 2) {
          const p = this.project(lat, lng, this.rotation, R, cx, cy);
          if (p.z > 0) {
            started ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy);
            started = true;
          } else { started = false; }
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }

      // Continent dots
      for (const [lat, lng] of this.continentPoints) {
        const p = this.project(lat, lng, this.rotation, R, cx, cy);
        if (p.z > 0) {
          const bright = 0.35 + 0.55 * (p.z / R);
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${(bright * 0.75).toFixed(2)})`;
          ctx.fill();
        }
      }

      // Animated arcs
      for (const { arc, pts } of arcPaths) {
        const t    = ((ts + arc.order * OFFSET) % PERIOD) / PERIOD;
        // First 60 %: arc grows; last 30 %: fades; 10 % gap
        if (t > 0.9) continue;
        const fill  = Math.min(1, t / 0.6);
        const alpha = t > 0.6 ? 1 - (t - 0.6) / 0.3 : 1;
        const count = Math.max(2, Math.floor(fill * pts.length));
        const arcR  = R * (1 + arc.arcAlt * 0.45);   // elevated radius

        ctx.beginPath();
        let started = false;
        for (let i = 0; i < count; i++) {
          const [lat, lng] = pts[i];
          const p = this.project(lat, lng, this.rotation, arcR, cx, cy);
          if (p.z > -R * 0.05) {
            started ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy);
            started = true;
          } else { started = false; }
        }
        const hex2   = Math.round(alpha * 0.85 * 255).toString(16).padStart(2, '0');
        ctx.strokeStyle = arc.color + hex2;
        ctx.lineWidth   = 1.6;
        ctx.shadowColor = arc.color;
        ctx.shadowBlur  = 5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Glowing head
        const [hLat, hLng] = pts[count - 1];
        const head = this.project(hLat, hLng, this.rotation, arcR, cx, cy);
        if (head.z > 0) {
          ctx.beginPath();
          ctx.arc(head.sx, head.sy, 2.8, 0, Math.PI * 2);
          ctx.fillStyle   = arc.color;
          ctx.shadowColor = arc.color;
          ctx.shadowBlur  = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore(); // end clip

      // ── Rim highlight ────────────────────────────────────────────────────
      const rim = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
      rim.addColorStop(0,   'rgba(56,189,248,0)');
      rim.addColorStop(0.82,'rgba(56,189,248,0)');
      rim.addColorStop(1,   'rgba(56,189,248,0.18)');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56,189,248,0.28)';
      ctx.lineWidth   = 1.2;
      ctx.stroke();
      ctx.fillStyle = rim; ctx.fill();

      this.rotation += ROT_SPEED;
      this.animationId = requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  private initializeForm(): void {
    this.contactForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email:    ['', [Validators.required, Validators.email]],
      company:  ['', [Validators.required, Validators.minLength(2)]],
      message:  ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  get fullName() { return this.contactForm.get('fullName'); }
  get email()    { return this.contactForm.get('email'); }
  get company()  { return this.contactForm.get('company'); }
  get message()  { return this.contactForm.get('message'); }

  onSubmit(): void {
    this.submitted = true;
    if (this.contactForm.invalid) return;

    this.isSubmitting = true;
    this.submitError  = false;
    this.submitSuccess = false;

    setTimeout(() => {
      try {
        console.log('Form submitted:', this.contactForm.value);
        this.submitSuccess = true;
        this.isSubmitting  = false;
        setTimeout(() => {
          this.contactForm.reset();
          this.submitted     = false;
          this.submitSuccess = false;
        }, 3000);
      } catch {
        this.submitError  = true;
        this.isSubmitting = false;
      }
    }, 1500);
  }

  resetForm(): void {
    this.contactForm.reset();
    this.submitted     = false;
    this.submitSuccess = false;
    this.submitError   = false;
  }

  hasError(fieldName: string): boolean {
    const f = this.contactForm.get(fieldName);
    return !!(f && f.invalid && (f.dirty || f.touched || this.submitted));
  }

  getErrorMessage(fieldName: string): string {
    const ctrl = this.contactForm.get(fieldName);
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required'])  return `${this.label(fieldName)} is required`;
    if (ctrl.errors['minlength']) return `${this.label(fieldName)} must be at least ${ctrl.errors['minlength'].requiredLength} characters`;
    if (ctrl.errors['email'])     return 'Please enter a valid email address';
    return 'Invalid input';
  }

  private label(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  }
}