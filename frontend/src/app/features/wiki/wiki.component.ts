import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppIconComponent, AppIconName } from '../../shared/components/icon.component';

@Component({
  selector: 'app-wiki',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
  template: `
    <div class="wiki-page">
      <div class="wiki-hero">
        <a routerLink="/" class="back-home">
          <app-icon name="chevron-left" [size]="16"></app-icon>
          Início
        </a>
        <div class="hero-mark">
          <app-icon name="book" [size]="24"></app-icon>
          Wiki de RPG
        </div>
        <h1>Conheça os sistemas que sustentam a campanha</h1>
        <p>Referência rápida para mestre e jogadores, com leitura clara e identidade dark fantasy.</p>
      </div>

      <div class="wiki-container">
        <div class="sys-tabs">
          <button
            *ngFor="let system of systemKeys"
            class="sys-tab"
            [class.active]="activeSystem === system"
            (click)="activeSystem = system"
            [attr.data-system]="system"
          >
            <app-icon [name]="getIcon(system)" [size]="15"></app-icon>
            {{ getName(system) }}
          </button>
        </div>

        <div class="sys-content" [attr.data-system]="activeSystem">
          <div *ngIf="activeSystem === 'DND5E'" class="sys-detail">
            <div class="sys-banner dnd">
              <app-icon name="dice" class="sys-big-icon" [size]="44"></app-icon>
              <div>
                <h2>Dungeons & Dragons 5ª edição</h2>
                <p class="sys-subtitle">O RPG de fantasia mais popular do mundo.</p>
              </div>
            </div>

            <div class="sys-body">
              <div class="info-section">
                <h3>O que é</h3>
                <p>
                  Dungeons & Dragons é um RPG de mesa de fantasia medieval criado por Gary Gygax e Dave Arneson.
                  A quinta edição, lançada em 2014, consolidou um estilo mais acessível sem perder profundidade tática.
                </p>
                <p>
                  Aqui os personagens exploram ruínas, enfrentam monstros, fazem pactos arriscados e moldam histórias
                  em cenários como Forgotten Realms, Eberron e Greyhawk.
                </p>
              </div>

              <div class="info-grid">
                <div class="info-card">
                  <h4>Classes</h4>
                  <div class="tag-list">
                    <span *ngFor="let className of dndClasses" class="tag">{{ className }}</span>
                  </div>
                </div>

                <div class="info-card">
                  <h4>Raças</h4>
                  <div class="tag-list">
                    <span *ngFor="let race of dndRaces" class="tag">{{ race }}</span>
                  </div>
                </div>

                <div class="info-card full">
                  <h4>Mecânicas principais</h4>
                  <ul>
                    <li><strong>d20:</strong> quase toda decisão importante gira em torno do dado de 20 lados.</li>
                    <li><strong>Bônus de proficiência:</strong> cresce com o nível e amarra a progressão do personagem.</li>
                    <li><strong>Vantagem e desvantagem:</strong> role 2d20 e use o melhor ou o pior resultado.</li>
                    <li><strong>Testes de resistência:</strong> força, destreza, constituição, inteligência, sabedoria e carisma.</li>
                    <li><strong>Descansos:</strong> organizam a recuperação de magia, vida e recursos táticos.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeSystem === 'T20'" class="sys-detail">
            <div class="sys-banner t20">
              <app-icon name="spark" class="sys-big-icon" [size]="44"></app-icon>
              <div>
                <h2>Tormenta 20</h2>
                <p class="sys-subtitle">Fantasia brasileira com identidade própria e alto poder heroico.</p>
              </div>
            </div>

            <div class="sys-body">
              <div class="info-section">
                <h3>O que é</h3>
                <p>
                  Tormenta 20 é um RPG brasileiro ambientado em Arton. O cenário combina fantasia épica, humor ácido,
                  guerra divina e a ameaça da Tormenta, uma corrupção planar que devora tudo o que toca.
                </p>
                <p>
                  O sistema valoriza personalização, poderes marcantes e um ritmo de mesa mais heróico e explosivo.
                </p>
              </div>

              <div class="info-grid">
                <div class="info-card">
                  <h4>Classes</h4>
                  <div class="tag-list">
                    <span *ngFor="let className of t20Classes" class="tag">{{ className }}</span>
                  </div>
                </div>

                <div class="info-card">
                  <h4>Raças</h4>
                  <div class="tag-list">
                    <span *ngFor="let race of t20Races" class="tag">{{ race }}</span>
                  </div>
                </div>

                <div class="info-card full">
                  <h4>Mecânicas principais</h4>
                  <ul>
                    <li><strong>d20 + modificador:</strong> a base das ações mais relevantes.</li>
                    <li><strong>Poderes:</strong> marcam a identidade de cada personagem em quase todo nível.</li>
                    <li><strong>Pontos de mana:</strong> sustentam técnicas, magias e explosões de poder.</li>
                    <li><strong>Divindades:</strong> cada devoção muda tema, recursos e postura narrativa.</li>
                    <li><strong>Tormenta:</strong> ameaça central que influencia monstros, lore e escalada de cena.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeSystem === 'CoC'" class="sys-detail">
            <div class="sys-banner coc">
              <app-icon name="book" class="sys-big-icon" [size]="44"></app-icon>
              <div>
                <h2>Call of Cthulhu</h2>
                <p class="sys-subtitle">Investigação, decadência e horror cósmico lovecraftiano.</p>
              </div>
            </div>

            <div class="sys-body">
              <div class="info-section">
                <h3>O que é</h3>
                <p>
                  Call of Cthulhu é um RPG focado em investigação, mistério e o colapso da sanidade diante do
                  desconhecido. Em vez de heróis épicos, a mesa acompanha pessoas comuns tentando sobreviver ao Mythos.
                </p>
                <p>
                  O combate é perigoso, o conhecimento cobra um preço alto e a verdade costuma deixar cicatrizes.
                </p>
              </div>

              <div class="info-grid">
                <div class="info-card">
                  <h4>Ocupações</h4>
                  <div class="tag-list">
                    <span *ngFor="let occupation of cocOccupations" class="tag">{{ occupation }}</span>
                  </div>
                </div>

                <div class="info-card">
                  <h4>Entidades</h4>
                  <div class="tag-list">
                    <span *ngFor="let entity of cocEntities" class="tag">{{ entity }}</span>
                  </div>
                </div>

                <div class="info-card full">
                  <h4>Mecânicas principais</h4>
                  <ul>
                    <li><strong>d100:</strong> o sucesso vem ao rolar abaixo do valor da perícia.</li>
                    <li><strong>Sanidade:</strong> recurso central que mede a erosão psicológica da investigação.</li>
                    <li><strong>Sorte:</strong> alívio curto para decisões arriscadas e cenas tensas.</li>
                    <li><strong>Investigação:</strong> descobrir a verdade vale mais que vencer uma luta.</li>
                    <li><strong>Fragilidade:</strong> personagens podem morrer ou enlouquecer rapidamente.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeSystem === 'Pathfinder'" class="sys-detail">
            <div class="sys-banner pathfinder">
              <app-icon name="shield" class="sys-big-icon" [size]="44"></app-icon>
              <div>
                <h2>Pathfinder</h2>
                <p class="sys-subtitle">Fantasia tática com profundidade de build e decisões por turno.</p>
              </div>
            </div>

            <div class="sys-body">
              <div class="info-section">
                <h3>O que é</h3>
                <p>
                  Pathfinder nasceu como evolução do D&D 3.5 e, na segunda edição, adotou um combate mais limpo com
                  economia de três ações, alto grau de customização e forte identidade tática.
                </p>
                <p>
                  É a escolha ideal para mesas que gostam de decisões mecânicas detalhadas e personagens altamente
                  especializados.
                </p>
              </div>

              <div class="info-grid">
                <div class="info-card">
                  <h4>Classes</h4>
                  <div class="tag-list">
                    <span *ngFor="let className of pfClasses" class="tag">{{ className }}</span>
                  </div>
                </div>

                <div class="info-card">
                  <h4>Ancestralidades</h4>
                  <div class="tag-list">
                    <span *ngFor="let race of pfRaces" class="tag">{{ race }}</span>
                  </div>
                </div>

                <div class="info-card full">
                  <h4>Mecânicas principais</h4>
                  <ul>
                    <li><strong>3 ações por turno:</strong> todo round se organiza por custos claros e flexíveis.</li>
                    <li><strong>Graus de sucesso:</strong> falha crítica, falha, sucesso e sucesso crítico.</li>
                    <li><strong>Proficiência com nível:</strong> o avanço do personagem aparece em quase toda rolagem.</li>
                    <li><strong>Feats:</strong> talentos modulares moldam cada build com bastante precisão.</li>
                    <li><strong>Exploração e downtime:</strong> o jogo se estende para além do combate.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .wiki-page {
        min-height: 100vh;
        background: var(--bg-primary);
      }

      .wiki-hero {
        position: relative;
        text-align: center;
        padding: 3rem 2rem 2.2rem;
        background:
          radial-gradient(circle at top, rgba(201, 168, 76, 0.1), transparent 36%),
          linear-gradient(to bottom, var(--bg-secondary), var(--bg-primary));
        border-bottom: 1px solid var(--border-color);
      }

      .back-home {
        position: absolute;
        top: 1.5rem;
        left: 2rem;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        color: var(--text-secondary);
        text-decoration: none;
      }

      .back-home:hover {
        color: var(--accent-primary);
      }

      .hero-mark {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.8rem;
        color: var(--accent-primary);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-size: 0.78rem;
      }

      .wiki-hero h1 {
        margin: 0 0 0.55rem;
        font-size: clamp(2rem, 4vw, 3rem);
      }

      .wiki-hero p {
        max-width: 46rem;
        margin: 0 auto;
        color: var(--text-secondary);
      }

      .wiki-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
      }

      .sys-tabs {
        display: flex;
        gap: 0.4rem;
        margin-bottom: 2rem;
        overflow-x: auto;
        border-bottom: 1px solid var(--border-color);
      }

      .sys-tab {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.8rem 1.2rem;
        border: none;
        border-bottom: 2px solid transparent;
        background: none;
        color: var(--text-secondary);
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        transition: color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
      }

      .sys-tab:hover {
        color: var(--text-primary);
      }

      .sys-tab.active {
        color: var(--accent-primary);
        border-bottom-color: var(--accent-primary);
      }

      .sys-detail {
        animation: slideUp 0.3s ease;
      }

      .sys-banner {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        padding: 2rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        margin-bottom: 2rem;
      }

      .sys-banner.dnd {
        background: linear-gradient(135deg, rgba(201, 168, 76, 0.09), rgba(220, 38, 38, 0.05));
      }

      .sys-banner.t20 {
        background: linear-gradient(135deg, rgba(225, 29, 72, 0.1), rgba(120, 53, 15, 0.06));
      }

      .sys-banner.coc {
        background: linear-gradient(135deg, rgba(5, 150, 105, 0.08), rgba(88, 28, 135, 0.06));
      }

      .sys-banner.pathfinder {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(217, 119, 6, 0.06));
      }

      .sys-big-icon {
        color: var(--accent-primary);
      }

      .sys-banner h2 {
        margin: 0 0 0.35rem;
        color: var(--accent-primary);
      }

      .sys-subtitle {
        color: var(--text-secondary);
      }

      .info-section {
        margin-bottom: 2rem;
      }

      .info-section h3 {
        margin-bottom: 0.75rem;
        color: var(--accent-primary);
        font-size: 1.1rem;
      }

      .info-section p {
        color: var(--text-secondary);
        line-height: 1.7;
        margin-bottom: 0.75rem;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .info-card {
        padding: 1.25rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
        background: var(--bg-card);
      }

      .info-card.full {
        grid-column: 1 / -1;
      }

      .info-card h4 {
        margin: 0 0 0.75rem;
        color: var(--accent-primary);
        font-size: 0.95rem;
      }

      .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.38rem;
      }

      .tag {
        padding: 0.22rem 0.62rem;
        border-radius: 999px;
        font-size: 0.75rem;
        background: rgba(201, 168, 76, 0.08);
        border: 1px solid rgba(201, 168, 76, 0.16);
        color: var(--text-secondary);
      }

      .info-card ul {
        margin: 0;
        padding-left: 1rem;
        color: var(--text-secondary);
      }

      .info-card li {
        margin-bottom: 0.55rem;
        line-height: 1.55;
      }

      .info-card strong {
        color: var(--text-primary);
      }

      @media (max-width: 768px) {
        .back-home {
          position: static;
          margin-bottom: 1rem;
        }

        .wiki-hero {
          padding-top: 2rem;
        }

        .sys-banner {
          flex-direction: column;
          text-align: center;
        }

        .info-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class WikiComponent {
  activeSystem = 'DND5E';
  systemKeys = ['DND5E', 'T20', 'CoC', 'Pathfinder'];

  dndClasses = ['Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Guerreiro', 'Monge', 'Paladino', 'Patrulheiro', 'Ladino', 'Feiticeiro', 'Bruxo', 'Mago'];
  dndRaces = ['Humano', 'Elfo', 'Anão', 'Halfling', 'Gnomo', 'Meio-elfo', 'Meio-orc', 'Tiefling', 'Draconato'];

  t20Classes = ['Arcanista', 'Bárbaro', 'Bardo', 'Bucaneiro', 'Caçador', 'Cavaleiro', 'Clérigo', 'Druida', 'Guerreiro', 'Inventor', 'Ladino', 'Lutador', 'Nobre', 'Paladino'];
  t20Races = ['Humano', 'Anão', 'Dahllan', 'Elfo', 'Goblin', 'Lefou', 'Minotauro', 'Qareen', 'Golem', 'Hynne', 'Kliren', 'Medusa', 'Osteon', 'Sereia', 'Sílfide', 'Suraggel', 'Trog'];

  cocOccupations = ['Detetive', 'Professor', 'Jornalista', 'Médico', 'Antiquário', 'Artista', 'Criminoso', 'Diletante', 'Engenheiro', 'Bibliotecário', 'Policial', 'Soldado'];
  cocEntities = ['Cthulhu', 'Nyarlathotep', 'Azathoth', 'Shub-Niggurath', 'Yog-Sothoth', 'Hastur', 'Dagon', 'Mi-Go', 'Shoggoth', 'Deep Ones'];

  pfClasses = ['Alquimista', 'Bárbaro', 'Bardo', 'Campeão', 'Clérigo', 'Druida', 'Guerreiro', 'Inventor', 'Investigador', 'Mago', 'Monge', 'Oráculo', 'Patrulheiro', 'Ladino', 'Bruxo', 'Feiticeiro', 'Convocador', 'Pistoleiro'];
  pfRaces = ['Humano', 'Elfo', 'Anão', 'Gnomo', 'Halfling', 'Goblin', 'Hobgoblin', 'Leshy', 'Orc', 'Catfolk', 'Kobold', 'Tengu', 'Aasimar', 'Tiefling'];

  getIcon(key: string): AppIconName {
    const icons: Record<string, AppIconName> = {
      DND5E: 'dice',
      T20: 'spark',
      CoC: 'book',
      Pathfinder: 'shield',
    };

    return icons[key] || 'map';
  }

  getName(key: string): string {
    const names: Record<string, string> = {
      DND5E: 'D&D 5e',
      T20: 'Tormenta 20',
      CoC: 'Call of Cthulhu',
      Pathfinder: 'Pathfinder',
    };

    return names[key] || key;
  }
}
