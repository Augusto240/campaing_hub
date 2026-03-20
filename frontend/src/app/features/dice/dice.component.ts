import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dice',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dice-page">
      <div class="dice-hero">
        <a routerLink="/" class="back-home">← Início</a>
        <h1>🎲 Rolagem de Dados</h1>
        <p>Role qualquer dado de RPG ou gere atributos com o método clássico</p>
      </div>

      <div class="dice-container">
        <!-- Quick Roll Section -->
        <section class="quick-section">
          <h2>Rolagem Rápida</h2>
          <p class="section-desc">Clique em um dado para rolar</p>

          <div class="dice-grid">
            <button *ngFor="let d of diceTypes" class="dice-btn" (click)="quickRoll(d)" [class.rolled]="d.lastResult > 0">
              <div class="dice-icon">{{ d.icon }}</div>
              <div class="dice-name">{{ d.label }}</div>
              <div class="dice-range">1–{{ d.sides }}</div>
              <div class="dice-result-display" *ngIf="d.lastResult > 0" [class.nat20]="d.sides === 20 && d.lastResult === 20" [class.nat1]="d.sides === 20 && d.lastResult === 1">
                {{ d.lastResult }}
              </div>
            </button>
          </div>
        </section>

        <!-- Multi-Roll Section -->
        <section class="multi-section">
          <h2>Rolagem Múltipla</h2>
          <div class="multi-controls">
            <div class="control-group">
              <label>Quantidade</label>
              <div class="stepper">
                <button (click)="multiCount = multiCount > 1 ? multiCount - 1 : 1">−</button>
                <span>{{ multiCount }}</span>
                <button (click)="multiCount = multiCount < 20 ? multiCount + 1 : 20">+</button>
              </div>
            </div>
            <div class="control-group">
              <label>Dado</label>
              <div class="dice-selector">
                <button *ngFor="let d of diceTypes" class="mini-dice" [class.active]="multiDie === d.sides" (click)="multiDie = d.sides">
                  {{ d.label }}
                </button>
              </div>
            </div>
            <button class="btn btn-primary" (click)="rollMultiple()">Rolar {{ multiCount }}d{{ multiDie }}</button>
          </div>
          <div class="multi-results" *ngIf="multiResults.length > 0">
            <div class="multi-dice-row">
              <span *ngFor="let r of multiResults" class="multi-die-result"
                [class.nat20]="multiDie === 20 && r === 20"
                [class.nat1]="multiDie === 20 && r === 1">{{ r }}</span>
            </div>
            <div class="multi-summary">
              <div class="summary-item">
                <span class="summary-label">Total</span>
                <span class="summary-val">{{ multiTotal }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Mínimo</span>
                <span class="summary-val">{{ multiMin }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Máximo</span>
                <span class="summary-val">{{ multiMax }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Média</span>
                <span class="summary-val">{{ multiAvg }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 4d6 Drop Lowest -->
        <section class="attr-section">
          <h2>⚡ Gerador de Atributos — 4d6 Drop Lowest</h2>
          <p class="section-desc">O método clássico de D&D: rola 4d6, descarta o menor dado, soma os 3 restantes. Repete 6 vezes para os 6 atributos.</p>

          <button class="btn btn-primary btn-lg" (click)="generateAttributes()">
            🎲 Gerar Atributos
          </button>

          <div class="attr-results" *ngIf="attributes.length > 0">
            <div class="attr-grid">
              <div *ngFor="let a of attributes; let i = index" class="attr-card">
                <div class="attr-name">{{ attrNames[i] }}</div>
                <div class="attr-value" [class.high]="a.total >= 15" [class.low]="a.total <= 8">
                  {{ a.total }}
                </div>
                <div class="attr-rolls">
                  <span *ngFor="let r of a.rolls; let j = index" class="attr-die" [class.dropped]="j === a.droppedIndex">
                    {{ r }}
                  </span>
                </div>
                <div class="attr-modifier">
                  Mod: {{ getModifier(a.total) >= 0 ? '+' : '' }}{{ getModifier(a.total) }}
                </div>
              </div>
            </div>
            <div class="attr-summary">
              <span>Total de pontos: <strong>{{ attrTotalPoints }}</strong></span>
              <span>Média: <strong>{{ attrAverage }}</strong></span>
              <span class="attr-quality" [ngClass]="getQualityClass()">{{ getQualityLabel() }}</span>
            </div>
          </div>
        </section>

        <!-- History -->
        <section class="history-section" *ngIf="history.length > 0">
          <h2>📜 Histórico</h2>
          <div class="history-list">
            <div *ngFor="let h of history; let i = index" class="history-item" style="animation: slideUp 0.2s ease;">
              <span class="history-roll">{{ h.label }}</span>
              <span class="history-result">→ {{ h.result }}</span>
              <span class="history-time">{{ h.time }}</span>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" (click)="history = []">Limpar Histórico</button>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .dice-page { min-height: 100vh; background: var(--bg-primary); }
    .dice-hero {
      text-align: center; padding: 3rem 2rem 2rem; position: relative;
      background: linear-gradient(to bottom, var(--bg-secondary), var(--bg-primary));
      border-bottom: 1px solid var(--border-color);
    }
    .back-home { position: absolute; top: 1.5rem; left: 2rem; color: var(--text-secondary); font-size: 0.85rem; text-decoration: none; }
    .back-home:hover { color: var(--accent-primary); }
    .dice-hero h1 { font-family: var(--font-display); font-size: 2rem; margin-bottom: 0.5rem; }
    .dice-hero p { color: var(--text-secondary); }
    .dice-container { max-width: 900px; margin: 0 auto; padding: 2rem; }

    section { margin-bottom: 3rem; }
    section h2 { font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 0.5rem; color: var(--accent-primary); }
    .section-desc { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem; }

    /* Quick Roll */
    .dice-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; }
    .dice-btn {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); padding: 1.25rem; text-align: center;
      cursor: pointer; transition: all var(--transition-normal); position: relative;
      overflow: hidden; font-family: var(--font-body); color: var(--text-primary);
    }
    .dice-btn:hover { border-color: var(--accent-primary); transform: translateY(-2px); box-shadow: var(--shadow-glow); }
    .dice-btn:active { transform: scale(0.95); }
    .dice-icon { font-size: 2rem; margin-bottom: 0.375rem; }
    .dice-name { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--accent-primary); }
    .dice-range { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.5rem; }
    .dice-result-display {
      font-family: var(--font-display); font-size: 1.75rem; font-weight: 700;
      color: var(--accent-primary); animation: slideUp 0.3s ease;
    }
    .dice-result-display.nat20 { color: var(--success); text-shadow: 0 0 10px rgba(16,185,129,0.5); }
    .dice-result-display.nat1 { color: var(--danger); }

    /* Multi Roll */
    .multi-controls { display: flex; align-items: flex-end; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .control-group label { display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.375rem; letter-spacing: 0.05em; }
    .stepper { display: flex; align-items: center; gap: 0; }
    .stepper button {
      width: 36px; height: 36px; border: 1px solid var(--border-color);
      background: var(--bg-card); color: var(--text-primary); cursor: pointer;
      font-size: 1rem; transition: all var(--transition-fast); font-family: var(--font-body);
    }
    .stepper button:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
    .stepper button:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
    .stepper button:hover { background: var(--accent-primary); color: #0f0f1a; }
    .stepper span { width: 44px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--bg-input); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); font-weight: 600; }
    .dice-selector { display: flex; gap: 0.25rem; }
    .mini-dice {
      padding: 0.375rem 0.625rem; border-radius: var(--radius-sm); font-size: 0.75rem;
      font-weight: 600; background: var(--bg-card); border: 1px solid var(--border-color);
      cursor: pointer; color: var(--text-secondary); transition: all var(--transition-fast);
      font-family: var(--font-body);
    }
    .mini-dice.active { background: var(--accent-primary); color: #0f0f1a; border-color: var(--accent-primary); }

    .multi-results { margin-top: 1rem; padding: 1.25rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); }
    .multi-dice-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .multi-die-result {
      width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
      background: var(--bg-secondary); border: 1px solid var(--border-color);
      border-radius: var(--radius-sm); font-weight: 700; font-family: var(--font-display);
      animation: slideUp 0.3s ease;
    }
    .multi-die-result.nat20 { border-color: var(--success); color: var(--success); background: rgba(16,185,129,0.1); }
    .multi-die-result.nat1 { border-color: var(--danger); color: var(--danger); background: rgba(239,68,68,0.1); }
    .multi-summary { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .summary-item { display: flex; flex-direction: column; }
    .summary-label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-val { font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); font-family: var(--font-display); }

    /* Attributes */
    .attr-results { margin-top: 1.5rem; }
    .attr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .attr-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 1rem; text-align: center;
      animation: slideUp 0.3s ease;
    }
    .attr-name { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
    .attr-value { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--accent-primary); }
    .attr-value.high { color: var(--success); }
    .attr-value.low { color: var(--danger); }
    .attr-rolls { display: flex; justify-content: center; gap: 0.25rem; margin: 0.5rem 0; }
    .attr-die {
      width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
      background: var(--bg-secondary); border-radius: 4px; font-size: 0.75rem; font-weight: 600;
    }
    .attr-die.dropped { opacity: 0.3; text-decoration: line-through; }
    .attr-modifier { font-size: 0.8rem; color: var(--text-secondary); font-weight: 500; }

    .attr-summary {
      display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;
      padding: 1rem; background: var(--bg-card); border-radius: var(--radius-sm);
      font-size: 0.85rem; color: var(--text-secondary);
    }
    .attr-summary strong { color: var(--accent-primary); }
    .attr-quality {
      padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .attr-quality.legendary { background: rgba(201,168,76,0.15); color: var(--accent-primary); }
    .attr-quality.great { background: rgba(16,185,129,0.15); color: var(--success); }
    .attr-quality.good { background: rgba(6,182,212,0.15); color: var(--info); }
    .attr-quality.average { background: rgba(245,158,11,0.15); color: var(--warning); }
    .attr-quality.poor { background: rgba(239,68,68,0.15); color: var(--danger); }

    /* History */
    .history-list { margin-bottom: 1rem; max-height: 300px; overflow-y: auto; }
    .history-item {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem;
      border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.85rem;
    }
    .history-roll { color: var(--text-secondary); min-width: 80px; }
    .history-result { color: var(--accent-primary); font-weight: 700; font-family: var(--font-display); flex: 1; }
    .history-time { color: var(--text-muted); font-size: 0.7rem; }

    @media (max-width: 768px) {
      .dice-grid { grid-template-columns: repeat(3, 1fr); }
      .multi-controls { flex-direction: column; align-items: stretch; }
      .attr-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DiceComponent {
  diceTypes = [
    { sides: 4, icon: '🔺', label: 'd4', lastResult: 0 },
    { sides: 6, icon: '🎲', label: 'd6', lastResult: 0 },
    { sides: 8, icon: '💠', label: 'd8', lastResult: 0 },
    { sides: 10, icon: '🔟', label: 'd10', lastResult: 0 },
    { sides: 12, icon: '🔷', label: 'd12', lastResult: 0 },
    { sides: 20, icon: '⭐', label: 'd20', lastResult: 0 },
    { sides: 100, icon: '💯', label: 'd100', lastResult: 0 },
  ];

  multiCount = 2;
  multiDie = 6;
  multiResults: number[] = [];
  multiTotal = 0;
  multiMin = 0;
  multiMax = 0;
  multiAvg = '';

  attributes: { rolls: number[]; droppedIndex: number; total: number }[] = [];
  attrNames = ['Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma'];
  attrTotalPoints = 0;
  attrAverage = '';

  history: { label: string; result: string; time: string }[] = [];

  private roll(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
  }

  private now(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  quickRoll(d: any): void {
    d.lastResult = this.roll(d.sides);
    this.history.unshift({ label: `1${d.label}`, result: `${d.lastResult}`, time: this.now() });
    if (this.history.length > 50) this.history.pop();
  }

  rollMultiple(): void {
    this.multiResults = Array.from({ length: this.multiCount }, () => this.roll(this.multiDie));
    this.multiTotal = this.multiResults.reduce((a, b) => a + b, 0);
    this.multiMin = Math.min(...this.multiResults);
    this.multiMax = Math.max(...this.multiResults);
    this.multiAvg = (this.multiTotal / this.multiResults.length).toFixed(1);
    this.history.unshift({
      label: `${this.multiCount}d${this.multiDie}`,
      result: `[${this.multiResults.join(', ')}] = ${this.multiTotal}`,
      time: this.now()
    });
    if (this.history.length > 50) this.history.pop();
  }

  generateAttributes(): void {
    this.attributes = [];
    for (let i = 0; i < 6; i++) {
      const rolls = Array.from({ length: 4 }, () => this.roll(6));
      const minVal = Math.min(...rolls);
      const droppedIndex = rolls.indexOf(minVal);
      const total = rolls.reduce((a, b) => a + b, 0) - minVal;
      this.attributes.push({ rolls, droppedIndex, total });
    }
    this.attrTotalPoints = this.attributes.reduce((a, b) => a + b.total, 0);
    this.attrAverage = (this.attrTotalPoints / 6).toFixed(1);
    this.history.unshift({
      label: '4d6 drop low ×6',
      result: this.attributes.map(a => a.total).join(', '),
      time: this.now()
    });
    if (this.history.length > 50) this.history.pop();
  }

  getModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  getQualityClass(): string {
    if (this.attrTotalPoints >= 80) return 'legendary';
    if (this.attrTotalPoints >= 72) return 'great';
    if (this.attrTotalPoints >= 65) return 'good';
    if (this.attrTotalPoints >= 55) return 'average';
    return 'poor';
  }

  getQualityLabel(): string {
    if (this.attrTotalPoints >= 80) return 'Lendário';
    if (this.attrTotalPoints >= 72) return 'Excelente';
    if (this.attrTotalPoints >= 65) return 'Bom';
    if (this.attrTotalPoints >= 55) return 'Mediano';
    return 'Fraco';
  }
}
