import { Particle } from '../types/game';

export class ParticleSystem {
  public particles: Particle[] = [];

  public spawnSparks(x: number, y: number, count: number = 16, color: string = '#fbbf24') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 320;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life: 1,
        maxLife: 0.3 + Math.random() * 0.4,
        color,
        size: 1.5 + Math.random() * 3,
        gravity: 600,
        friction: 0.94,
        type: 'spark',
      });
    }
  }

  public spawnDust(x: number, y: number, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 120;
      const vy = -15 - Math.random() * 40;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y,
        vx,
        vy,
        life: 1,
        maxLife: 0.4 + Math.random() * 0.3,
        color: 'rgba(148, 163, 184, 0.4)',
        size: 3 + Math.random() * 5,
        gravity: -20,
        friction: 0.9,
        type: 'dust',
      });
    }
  }

  public spawnConfetti(x: number, y: number, count: number = 30) {
    const palette = ['#f43f5e', '#38bdf8', '#fbbf24', '#4ade80', '#c084fc', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = 180 + Math.random() * 350;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.8 + Math.random() * 0.6,
        color: palette[Math.floor(Math.random() * palette.length)],
        size: 3 + Math.random() * 4,
        gravity: 420,
        friction: 0.96,
        type: 'confetti',
      });
    }
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt / p.maxLife;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      if (p.friction) {
        p.vx *= p.friction;
        p.vy *= p.friction;
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      const alpha = Math.max(0, Math.min(1, p.life));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'dust') {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 1.2, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'confetti') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 1.5);
      } else {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
    ctx.restore();
  }
}
