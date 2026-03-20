import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-wiki',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="wiki-page">
      <!-- Header -->
      <div class="wiki-hero">
        <a routerLink="/" class="back-home">← Início</a>
        <h1>📜 Wiki de RPG</h1>
        <p>Conheça os principais sistemas de RPG de mesa</p>
      </div>

      <div class="wiki-container">
        <!-- System Tabs -->
        <div class="sys-tabs">
          <button *ngFor="let s of systemKeys" class="sys-tab"
            [class.active]="activeSystem === s"
            (click)="activeSystem = s"
            [attr.data-system]="s">
            {{ getIcon(s) }} {{ getName(s) }}
          </button>
        </div>

        <!-- System Content -->
        <div class="sys-content" [attr.data-system]="activeSystem">
          <!-- D&D 5e -->
          <div *ngIf="activeSystem === 'DND5E'" class="sys-detail" style="animation: slideUp 0.3s ease;">
            <div class="sys-banner dnd">
              <span class="sys-big-icon">🐉</span>
              <div>
                <h2>Dungeons & Dragons 5ª Edição</h2>
                <p class="sys-subtitle">O RPG de mesa mais popular do mundo</p>
              </div>
            </div>
            <div class="sys-body">
              <div class="info-section">
                <h3>O que é?</h3>
                <p>Dungeons & Dragons (D&D) é um jogo de RPG de mesa de fantasia medieval criado por Gary Gygax e Dave Arneson, publicado pela primeira vez em 1974. A 5ª edição, lançada em 2014 pela Wizards of the Coast, é a mais acessível e popular de todas.</p>
                <p>Os jogadores criam personagens heróicos que exploram masmorras, enfrentam monstros e vivem aventuras épicas em mundos como Forgotten Realms, Eberron e Greyhawk.</p>
              </div>
              <div class="info-grid">
                <div class="info-card">
                  <h4>⚔️ Classes</h4>
                  <div class="tag-list">
                    <span *ngFor="let c of dndClasses" class="tag">{{ c }}</span>
                  </div>
                </div>
                <div class="info-card">
                  <h4>🧬 Raças</h4>
                  <div class="tag-list">
                    <span *ngFor="let r of dndRaces" class="tag">{{ r }}</span>
                  </div>
                </div>
                <div class="info-card full">
                  <h4>🎯 Mecânicas Principais</h4>
                  <ul>
                    <li><strong>D20:</strong> Dado de 20 lados é a base de quase todas as rolagens</li>
                    <li><strong>Bônus de Proficiência:</strong> Cresce com o nível do personagem</li>
                    <li><strong>Vantagem/Desvantagem:</strong> Role 2d20 e use o maior ou menor resultado</li>
                    <li><strong>Testes de Resistência:</strong> 6 atributos (Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma)</li>
                    <li><strong>Descanso Curto/Longo:</strong> Sistema de recuperação de recursos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Tormenta 20 -->
          <div *ngIf="activeSystem === 'T20'" class="sys-detail" style="animation: slideUp 0.3s ease;">
            <div class="sys-banner t20">
              <span class="sys-big-icon">⚡</span>
              <div>
                <h2>Tormenta 20</h2>
                <p class="sys-subtitle">O maior RPG brasileiro de fantasia</p>
              </div>
            </div>
            <div class="sys-body">
              <div class="info-section">
                <h3>O que é?</h3>
                <p>Tormenta 20 é um RPG de mesa brasileiro criado pela editora Jambô, ambientado no mundo de Arton. É a evolução do Tormenta RPG, publicado originalmente em 2003, e se tornou o maior RPG nacional.</p>
                <p>O cenário é marcado pela Tormenta — uma tempestade planar que invade o mundo e corrompe tudo que toca, trazendo criaturas aberrantes chamadas Lefeu.</p>
              </div>
              <div class="info-grid">
                <div class="info-card">
                  <h4>⚔️ Classes</h4>
                  <div class="tag-list">
                    <span *ngFor="let c of t20Classes" class="tag">{{ c }}</span>
                  </div>
                </div>
                <div class="info-card">
                  <h4>🧬 Raças</h4>
                  <div class="tag-list">
                    <span *ngFor="let r of t20Races" class="tag">{{ r }}</span>
                  </div>
                </div>
                <div class="info-card full">
                  <h4>🎯 Mecânicas Principais</h4>
                  <ul>
                    <li><strong>D20 + Modificador:</strong> Base similar ao D&D mas com sistema próprio de progressão</li>
                    <li><strong>Poderes:</strong> Habilidades adquiridas a cada nível</li>
                    <li><strong>Mana (PM):</strong> Pontos de Mana para habilidades especiais</li>
                    <li><strong>Divindades de Arton:</strong> 20 deuses com mecânicas únicas para devotos</li>
                    <li><strong>A Tormenta:</strong> Corrupção planar que afeta mecânicas do jogo</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Call of Cthulhu -->
          <div *ngIf="activeSystem === 'CoC'" class="sys-detail" style="animation: slideUp 0.3s ease;">
            <div class="sys-banner coc">
              <span class="sys-big-icon">🐙</span>
              <div>
                <h2>Call of Cthulhu</h2>
                <p class="sys-subtitle">Horror cósmico lovecraftiano</p>
              </div>
            </div>
            <div class="sys-body">
              <div class="info-section">
                <h3>O que é?</h3>
                <p>Call of Cthulhu é um RPG de horror baseado nas obras de H.P. Lovecraft. Publicado pela Chaosium desde 1981, é um dos RPGs mais antigos e respeitados, focado em investigação, mistério e o terror do desconhecido.</p>
                <p>Diferente de D&D, os personagens são pessoas comuns — detetives, jornalistas, professores — que investigam horrores além da compreensão humana. A morte e a loucura são desfechos comuns.</p>
              </div>
              <div class="info-grid">
                <div class="info-card">
                  <h4>🕵️ Ocupações</h4>
                  <div class="tag-list">
                    <span *ngFor="let c of cocOccupations" class="tag">{{ c }}</span>
                  </div>
                </div>
                <div class="info-card">
                  <h4>🐙 Entidades</h4>
                  <div class="tag-list">
                    <span *ngFor="let e of cocEntities" class="tag">{{ e }}</span>
                  </div>
                </div>
                <div class="info-card full">
                  <h4>🎯 Mecânicas Principais</h4>
                  <ul>
                    <li><strong>D100 (Percentual):</strong> Role abaixo do valor da sua perícia para ter sucesso</li>
                    <li><strong>Sanidade:</strong> Pontos de Sanidade que diminuem ao testemunhar horrores</li>
                    <li><strong>Sorte:</strong> Recurso finito que pode salvar sua vida</li>
                    <li><strong>Investigação:</strong> O foco é descobrir a verdade, não combater</li>
                    <li><strong>Fragilidade:</strong> Personagens morrem fácil — combate é último recurso</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Pathfinder -->
          <div *ngIf="activeSystem === 'Pathfinder'" class="sys-detail" style="animation: slideUp 0.3s ease;">
            <div class="sys-banner pathfinder">
              <span class="sys-big-icon">🏰</span>
              <div>
                <h2>Pathfinder</h2>
                <p class="sys-subtitle">Aventuras épicas com profunda customização</p>
              </div>
            </div>
            <div class="sys-body">
              <div class="info-section">
                <h3>O que é?</h3>
                <p>Pathfinder é um RPG de fantasia publicado pela Paizo, nascido como uma evolução do D&D 3.5. A 2ª edição (2019) trouxe um sistema mais moderno com o sistema de 3 ações por turno.</p>
                <p>Conhecido pela profundidade de customização de personagens e pelo cenário riquíssimo de Golarion, Pathfinder é a escolha de quem quer mais opções mecânicas e táticas.</p>
              </div>
              <div class="info-grid">
                <div class="info-card">
                  <h4>⚔️ Classes</h4>
                  <div class="tag-list">
                    <span *ngFor="let c of pfClasses" class="tag">{{ c }}</span>
                  </div>
                </div>
                <div class="info-card">
                  <h4>🧬 Ancestralidades</h4>
                  <div class="tag-list">
                    <span *ngFor="let r of pfRaces" class="tag">{{ r }}</span>
                  </div>
                </div>
                <div class="info-card full">
                  <h4>🎯 Mecânicas Principais</h4>
                  <ul>
                    <li><strong>3 Ações por Turno:</strong> Sistema flexível, cada habilidade custa 1-3 ações</li>
                    <li><strong>Graus de Sucesso:</strong> Sucesso Crítico, Sucesso, Falha, Falha Crítica</li>
                    <li><strong>Proficiência com Nível:</strong> O nível do personagem soma nas rolagens</li>
                    <li><strong>Feats Modulares:</strong> Centenas de talentos de classe, ancestralidade e habilidade</li>
                    <li><strong>Exploração/Downtime:</strong> Modos de jogo além do combate</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wiki-page { min-height: 100vh; background: var(--bg-primary); }
    .wiki-hero {
      text-align: center; padding: 3rem 2rem 2rem; position: relative;
      background: linear-gradient(to bottom, var(--bg-secondary), var(--bg-primary));
      border-bottom: 1px solid var(--border-color);
    }
    .back-home {
      position: absolute; top: 1.5rem; left: 2rem; color: var(--text-secondary);
      font-size: 0.85rem; text-decoration: none;
    }
    .back-home:hover { color: var(--accent-primary); }
    .wiki-hero h1 { font-family: var(--font-display); font-size: 2rem; margin-bottom: 0.5rem; }
    .wiki-hero p { color: var(--text-secondary); }
    .wiki-container { max-width: 1000px; margin: 0 auto; padding: 2rem; }

    .sys-tabs {
      display: flex; gap: 0.375rem; margin-bottom: 2rem; overflow-x: auto;
      border-bottom: 1px solid var(--border-color); padding-bottom: 0;
    }
    .sys-tab {
      background: none; border: none; padding: 0.75rem 1.25rem; font-size: 0.85rem;
      font-weight: 600; color: var(--text-secondary); cursor: pointer;
      border-bottom: 2px solid transparent; transition: all var(--transition-fast);
      white-space: nowrap; font-family: var(--font-body);
    }
    .sys-tab:hover { color: var(--text-primary); }
    .sys-tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }

    .sys-banner {
      display: flex; align-items: center; gap: 1.5rem; padding: 2rem;
      border-radius: var(--radius-lg); margin-bottom: 2rem;
      border: 1px solid var(--border-color);
    }
    .sys-banner.dnd { background: linear-gradient(135deg, rgba(201,168,76,0.08), rgba(220,38,38,0.05)); }
    .sys-banner.t20 { background: linear-gradient(135deg, rgba(225,29,72,0.08), rgba(148,163,184,0.05)); }
    .sys-banner.coc { background: linear-gradient(135deg, rgba(5,150,105,0.08), rgba(124,58,237,0.05)); }
    .sys-banner.pathfinder { background: linear-gradient(135deg, rgba(37,99,235,0.08), rgba(217,119,6,0.05)); }
    .sys-big-icon { font-size: 3rem; }
    .sys-banner h2 { font-family: var(--font-display); font-size: 1.5rem; color: var(--accent-primary); }
    .sys-subtitle { color: var(--text-secondary); font-size: 0.9rem; }

    .info-section { margin-bottom: 2rem; }
    .info-section h3 { font-family: var(--font-display); font-size: 1.1rem; color: var(--accent-primary); margin-bottom: 0.75rem; }
    .info-section p { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.7; margin-bottom: 0.75rem; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .info-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 1.25rem;
    }
    .info-card.full { grid-column: 1 / -1; }
    .info-card h4 { font-family: var(--font-display); font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--accent-primary); }
    .tag-list { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .tag {
      padding: 0.2rem 0.6rem; font-size: 0.7rem; border-radius: var(--radius-sm);
      background: rgba(201,168,76,0.08); color: var(--text-secondary);
      border: 1px solid rgba(201,168,76,0.12);
    }
    .info-card ul { list-style: none; padding: 0; }
    .info-card li {
      padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;
    }
    .info-card li:last-child { border-bottom: none; }
    .info-card li strong { color: var(--accent-primary); }

    @media (max-width: 768px) {
      .info-grid { grid-template-columns: 1fr; }
      .sys-banner { flex-direction: column; text-align: center; }
    }
  `]
})
export class WikiComponent {
  activeSystem = 'DND5E';
  systemKeys = ['DND5E', 'T20', 'CoC', 'Pathfinder'];

  dndClasses = ['Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Guerreiro', 'Monge', 'Paladino', 'Patrulheiro', 'Ladino', 'Feiticeiro', 'Bruxo', 'Mago'];
  dndRaces = ['Humano', 'Elfo', 'Anão', 'Halfling', 'Gnomo', 'Meio-Elfo', 'Meio-Orc', 'Tiefling', 'Draconato'];

  t20Classes = ['Arcanista', 'Bárbaro', 'Bardo', 'Bucaneiro', 'Caçador', 'Cavaleiro', 'Clérigo', 'Druida', 'Guerreiro', 'Inventor', 'Ladino', 'Lutador', 'Nobre', 'Paladino'];
  t20Races = ['Humano', 'Anão', 'Dahllan', 'Elfo', 'Goblin', 'Lefou', 'Minotauro', 'Qareen', 'Golem', 'Hynne', 'Kliren', 'Medusa', 'Osteon', 'Sereia', 'Sílfide', 'Suraggel', 'Trog'];

  cocOccupations = ['Detetive', 'Professor', 'Jornalista', 'Médico', 'Antiquário', 'Artista', 'Criminoso', 'Diletante', 'Engenheiro', 'Bibliotecário', 'Policial', 'Soldado'];
  cocEntities = ['Cthulhu', 'Nyarlathotep', 'Azathoth', 'Shub-Niggurath', 'Yog-Sothoth', 'Hastur', 'Dagon', 'Mi-Go', 'Shoggoth', 'Deep Ones'];

  pfClasses = ['Alquimista', 'Bárbaro', 'Bardo', 'Campeão', 'Clérigo', 'Druida', 'Guerreiro', 'Inventor', 'Investigador', 'Mago', 'Monge', 'Oráculo', 'Patrulheiro', 'Ladino', 'Bruxo', 'Feiticeiro', 'Convocador', 'Pistoleiro'];
  pfRaces = ['Humano', 'Elfo', 'Anão', 'Gnomo', 'Halfling', 'Goblin', 'Hobgoblin', 'Leshy', 'Orc', 'Catfolk', 'Kobold', 'Tengu', 'Aasimar', 'Tiefling'];

  getIcon(key: string): string {
    const m: Record<string, string> = { DND5E: '🐉', T20: '⚡', CoC: '🐙', Pathfinder: '🏰' };
    return m[key] || '🎭';
  }

  getName(key: string): string {
    const m: Record<string, string> = { DND5E: 'D&D 5e', T20: 'Tormenta 20', CoC: 'Call of Cthulhu', Pathfinder: 'Pathfinder' };
    return m[key] || key;
  }
}
