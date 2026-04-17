import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppIconComponent, AppIconName } from '../../shared/components/icon.component';

type FeatureCard = {
  icon: AppIconName;
  title: string;
  desc: string;
};

type SystemCard = {
  key: string;
  icon: AppIconName;
  name: string;
  desc: string;
};

type DiceCard = {
  sides: number;
  icon: AppIconName;
  label: string;
  result: number;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
  template: `
    <div class="home">
      <section class="hero">
        <div class="hero-bg">
          <div class="particles">
            <span
              *ngFor="let particle of particles"
              class="particle"
              [style.left.%]="particle.x"
              [style.animationDelay.s]="particle.delay"
              [style.animationDuration.s]="particle.dur"
            ></span>
          </div>
          <div class="hero-overlay"></div>
        </div>

        <div class="hero-content">
          <div class="hero-badge">
            <app-icon name="shield" [size]="16"></app-icon>
            Plataforma de RPG
          </div>
          <h1>Campaign <span class="accent">Hub</span></h1>
          <p class="hero-tagline">
            Campanhas, compêndio, wiki, VTT e memória narrativa em uma única ferramenta.
          </p>
          <p class="hero-sub">
            Dark fantasy autoral com legado de 2023, pronto para demo e pronto para mestrar sem quatro abas abertas.
          </p>
          <div class="hero-actions">
            <a routerLink="/auth/register" class="btn btn-primary btn-lg">Começar agora</a>
            <a routerLink="/auth/login" class="btn btn-outline btn-lg">Já tenho conta</a>
          </div>
          <button class="hero-scroll-hint" type="button" (click)="scrollTo('features')">
            <span>Explorar</span>
            <app-icon name="chevron-down" [size]="18"></app-icon>
          </button>
        </div>
      </section>

      <section class="features" id="features">
        <div class="section-container">
          <div class="section-header">
            <h2>Por que mestrar aqui</h2>
            <p>Porque a campanha lembra de tudo: mapa, sessão, compêndio, rolagens e lore.</p>
          </div>

          <div class="features-grid">
            <article class="feature-card" *ngFor="let feature of features">
              <div class="feature-icon">
                <app-icon [name]="feature.icon" [size]="26"></app-icon>
              </div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.desc }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="systems">
        <div class="section-container">
          <div class="section-header">
            <h2>Sistemas suportados</h2>
            <p>Identidade visual forte, compêndio útil e navegação limpa para cada estilo de mesa.</p>
          </div>

          <div class="systems-grid">
            <article *ngFor="let system of systems" class="system-card" [attr.data-system]="system.key">
              <div class="system-icon">
                <app-icon [name]="system.icon" [size]="30"></app-icon>
              </div>
              <h3>{{ system.name }}</h3>
              <p>{{ system.desc }}</p>
              <div class="system-accent-line"></div>
            </article>
          </div>
        </div>
      </section>

      <section class="dice-section">
        <div class="section-container">
          <div class="dice-inner">
            <div class="dice-text">
              <div class="section-kicker">
                <app-icon name="dice" [size]="16"></app-icon>
                Rolagem imediata
              </div>
              <h2>Dados, presença e memória na mesma mesa</h2>
              <p>
                Role d4 a d100 direto no navegador, registre o impacto na sessão e mantenha o histórico vivo junto da
                campanha.
              </p>
              <a routerLink="/dice" class="btn btn-primary">Experimentar dados</a>
            </div>

            <div class="dice-demo">
              <button class="demo-dice" *ngFor="let dice of diceTypes" type="button" (click)="rollDice(dice)">
                <span class="dice-face">
                  <app-icon [name]="dice.icon" [size]="22"></app-icon>
                </span>
                <span class="dice-label">{{ dice.label }}</span>
                <span class="dice-result" *ngIf="dice.result">{{ dice.result }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="about">
        <div class="section-container">
          <div class="about-inner">
            <div class="about-text">
              <h2>De projeto acadêmico a RPG OS vivo</h2>
              <p>
                O Campaign Hub nasceu em <strong>2023</strong> como um site de RPG criado no IFRN Campus Parnamirim.
                Hoje ele reúne Angular 17, Node.js, Prisma, PostgreSQL, Redis e Socket.IO em um fluxo realmente útil de mesa.
              </p>
              <p>
                A estética dark fantasy, o legado de Augustus Frostborne e Satoru Naitokira e a ideia de memória viva
                continuam no centro da experiência.
              </p>
              <div class="about-tech">
                <span *ngFor="let tech of techStack" class="tech-tag">{{ tech }}</span>
              </div>
            </div>

            <div class="about-timeline">
              <div class="timeline-item" *ngFor="let event of timeline">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <span class="timeline-date">{{ event.date }}</span>
                  <span class="timeline-text">{{ event.text }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="showcase">
        <div class="section-container">
          <div class="section-header">
            <h2>Legado 2023</h2>
            <p>Os personagens que dão identidade narrativa e afetiva ao projeto.</p>
          </div>

          <div class="showcase-grid">
            <article class="showcase-card augustus">
              <div class="showcase-badge">D&D 5e</div>
              <div class="showcase-avatar">A</div>
              <h3>Augustus Frostborne</h3>
              <p class="showcase-quote">"Todo mago carrega um passado que ainda não terminou de cobrar."</p>
              <div class="showcase-stats">
                <div class="sstat"><span class="sstat-label">Raça</span><span class="sstat-val">Humano</span></div>
                <div class="sstat"><span class="sstat-label">Classe</span><span class="sstat-val">Mago</span></div>
                <div class="sstat"><span class="sstat-label">Nível</span><span class="sstat-val">1</span></div>
              </div>
              <p class="showcase-bio">
                Expulso da própria vila depois de salvar todos com magia, Augustus transformou trauma em estudo e estudo
                em poder. É o elo entre o compêndio, o mistério arcano e a memória da campanha.
              </p>
              <div class="showcase-details">
                <span>Raio de gelo</span>
                <span>Raio de fogo</span>
                <span>Ilusão menor</span>
                <span>Antecedente: sábio</span>
                <span>Comum e élfico</span>
              </div>
            </article>

            <article class="showcase-card satoru">
              <div class="showcase-badge">Homebrew</div>
              <div class="showcase-avatar">S</div>
              <h3>Satoru Naitokira</h3>
              <p class="showcase-quote">"Lembranças, como lâminas, cortam melhor quando voltam à mão certa."</p>
              <div class="showcase-stats">
                <div class="sstat"><span class="sstat-label">Ambientação</span><span class="sstat-val">Japonesa</span></div>
                <div class="sstat"><span class="sstat-label">Estilo</span><span class="sstat-val">Noturno</span></div>
                <div class="sstat"><span class="sstat-label">Mistério</span><span class="sstat-val">Alto</span></div>
              </div>
              <p class="showcase-bio">
                Figura central do legado autoral, Satoru representa sigilo, memória e presença urbana. Seu peso ajuda a
                transformar o produto em algo com assinatura própria, não só utilitário.
              </p>
              <div class="showcase-details">
                <span>Noturno</span>
                <span>Lâminas</span>
                <span>Cenário urbano</span>
                <span>Segredos compartilhados</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="cta">
        <div class="section-container">
          <div class="cta-inner">
            <h2>Pronto para abrir a próxima campanha?</h2>
            <p>Entre, crie sua mesa e deixe a campanha lembrar do que importa.</p>
            <a routerLink="/auth/register" class="btn btn-primary btn-lg">Criar conta grátis</a>
          </div>
        </div>
      </section>

      <footer class="footer">
        <div class="section-container">
          <div class="footer-content">
            <div class="footer-brand">
              <span class="footer-logo">
                <app-icon name="sword" [size]="16"></app-icon>
                Campaign Hub
              </span>
              <p>A ferramenta de mesa viva para campanhas dark fantasy.</p>
            </div>

            <div class="footer-links">
              <a routerLink="/wiki">Wiki</a>
              <a routerLink="/dice">Dados</a>
              <a routerLink="/auth/login">Entrar</a>
              <a routerLink="/auth/register">Registrar</a>
            </div>

            <div class="footer-credit">
              <p>Feito com cuidado por <strong>Augusto Oliveira</strong></p>
              <p>IFRN Campus Parnamirim — 2023 → 2026</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      .home {
        background: var(--bg-primary);
      }

      .hero {
        position: relative;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .hero-bg {
        position: absolute;
        inset: 0;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center, rgba(15, 15, 26, 0.58) 0%, rgba(15, 15, 26, 0.95) 72%);
      }

      .particles {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }

      .particle {
        position: absolute;
        bottom: -10px;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: var(--accent-primary);
        opacity: 0;
        animation: floatUp 8s ease-in infinite;
      }

      @keyframes floatUp {
        0% {
          opacity: 0;
          transform: translateY(0);
        }
        10% {
          opacity: 0.8;
        }
        90% {
          opacity: 0.2;
        }
        100% {
          opacity: 0;
          transform: translateY(-100vh);
        }
      }

      .hero-content {
        position: relative;
        z-index: 2;
        max-width: 760px;
        padding: 2rem;
        text-align: center;
      }

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        margin-bottom: 1.5rem;
        padding: 0.38rem 1rem;
        border-radius: 999px;
        border: 1px solid rgba(201, 168, 76, 0.25);
        background: rgba(201, 168, 76, 0.1);
        color: var(--accent-primary);
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.05em;
      }

      .hero-content h1 {
        margin: 0 0 1rem;
        font-size: clamp(2.8rem, 7vw, 5rem);
        line-height: 1.05;
      }

      .accent {
        color: var(--accent-primary);
      }

      .hero-tagline {
        font-size: 1.15rem;
        color: var(--text-secondary);
        margin-bottom: 0.55rem;
        line-height: 1.6;
      }

      .hero-sub {
        font-size: 0.95rem;
        color: var(--text-muted);
        margin-bottom: 2rem;
      }

      .hero-actions {
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .hero-scroll-hint {
        margin: 3rem auto 0;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        border: none;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        animation: pulse 2s ease infinite;
      }

      section {
        padding: 5rem 0;
      }

      .section-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
      }

      .section-header {
        text-align: center;
        margin-bottom: 3rem;
      }

      .section-header h2 {
        margin-bottom: 0.45rem;
        font-size: 2rem;
      }

      .section-header p {
        color: var(--text-secondary);
      }

      .features {
        background: var(--bg-surface);
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
      }

      .feature-card,
      .system-card {
        padding: 1.8rem 1.5rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        background: var(--bg-card);
        transition: transform var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
      }

      .feature-card:hover,
      .system-card:hover {
        transform: translateY(-3px);
        border-color: rgba(201, 168, 76, 0.32);
        box-shadow: 0 18px 35px rgba(0, 0, 0, 0.22);
      }

      .feature-icon,
      .system-icon {
        width: 3.1rem;
        height: 3.1rem;
        margin-bottom: 1rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: var(--accent-primary);
        background: rgba(201, 168, 76, 0.12);
      }

      .feature-card h3,
      .system-card h3 {
        margin: 0 0 0.5rem;
        color: var(--accent-primary);
      }

      .feature-card p,
      .system-card p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .systems-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
      }

      .system-card {
        position: relative;
        overflow: hidden;
        text-align: center;
      }

      .system-icon {
        margin-left: auto;
        margin-right: auto;
      }

      .system-accent-line {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        opacity: 0;
        background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
        transition: opacity var(--transition-normal);
      }

      .system-card:hover .system-accent-line {
        opacity: 1;
      }

      .dice-section {
        background: var(--bg-surface);
      }

      .dice-inner {
        display: grid;
        grid-template-columns: 1.1fr 1fr;
        gap: 3rem;
        align-items: center;
      }

      .section-kicker {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--accent-primary);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
      }

      .dice-text h2 {
        margin: 0.8rem 0 0.8rem;
        font-size: 1.85rem;
      }

      .dice-text p {
        color: var(--text-secondary);
        line-height: 1.7;
        margin-bottom: 1.5rem;
      }

      .dice-demo {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .demo-dice {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        padding: 1.2rem 0.8rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--bg-card);
        color: var(--text-primary);
        cursor: pointer;
        transition: transform var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
      }

      .demo-dice:hover {
        transform: scale(1.03);
        border-color: rgba(201, 168, 76, 0.3);
        box-shadow: var(--shadow-arcane);
      }

      .dice-face {
        color: var(--accent-primary);
      }

      .dice-label {
        font-size: 0.76rem;
        color: var(--text-muted);
        font-weight: 700;
        text-transform: uppercase;
      }

      .dice-result {
        color: var(--accent-primary);
        font-family: var(--font-display);
        font-size: 1.25rem;
      }

      .about-inner {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 3rem;
        align-items: start;
      }

      .about-text p {
        color: var(--text-secondary);
        line-height: 1.7;
      }

      .about-tech {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1.5rem;
      }

      .tech-tag {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        border: 1px solid rgba(201, 168, 76, 0.2);
        background: rgba(201, 168, 76, 0.08);
        color: var(--accent-primary);
        font-size: 0.72rem;
        font-weight: 700;
      }

      .about-timeline {
        position: relative;
        padding-left: 1.4rem;
        border-left: 2px solid var(--border-color);
      }

      .timeline-item {
        position: relative;
        margin-bottom: 1.5rem;
        padding-left: 1rem;
      }

      .timeline-dot {
        position: absolute;
        left: -1.8rem;
        top: 0.3rem;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--accent-primary);
        border: 2px solid var(--bg-primary);
      }

      .timeline-date {
        display: block;
        color: var(--accent-primary);
        font-family: var(--font-display);
        font-size: 0.78rem;
        font-weight: 700;
      }

      .timeline-text {
        color: var(--text-secondary);
      }

      .showcase {
        background: var(--bg-surface);
      }

      .showcase-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 2rem;
      }

      .showcase-card {
        position: relative;
        padding: 2rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        background: var(--bg-card);
        transition: border-color var(--transition-normal), box-shadow var(--transition-normal), transform var(--transition-normal);
      }

      .showcase-card:hover {
        transform: translateY(-3px);
        border-color: rgba(201, 168, 76, 0.32);
        box-shadow: 0 18px 35px rgba(0, 0, 0, 0.22);
      }

      .showcase-card.augustus {
        --card-accent: #c9a84c;
      }

      .showcase-card.satoru {
        --card-accent: #e11d48;
      }

      .showcase-badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        padding: 0.22rem 0.68rem;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        background: rgba(201, 168, 76, 0.15);
        color: var(--card-accent);
        border: 1px solid rgba(201, 168, 76, 0.25);
      }

      .showcase-avatar {
        width: 58px;
        height: 58px;
        border-radius: var(--radius-md);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, var(--card-accent), var(--accent-secondary));
        color: #15120a;
        font-family: var(--font-display);
        font-size: 1.55rem;
        font-weight: 700;
      }

      .showcase-card h3 {
        margin: 0 0 0.2rem;
      }

      .showcase-quote {
        margin-bottom: 1rem;
        color: var(--text-muted);
        font-style: italic;
      }

      .showcase-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.55rem;
        margin-bottom: 1rem;
      }

      .sstat {
        padding: 0.55rem;
        border-radius: var(--radius-sm);
        background: rgba(255, 255, 255, 0.03);
        text-align: center;
      }

      .sstat-label {
        display: block;
        color: var(--text-muted);
        font-size: 0.64rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .sstat-val {
        display: block;
        margin-top: 0.15rem;
        color: var(--card-accent);
        font-weight: 700;
      }

      .showcase-bio {
        color: var(--text-secondary);
        line-height: 1.7;
      }

      .showcase-details {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }

      .showcase-details span {
        padding: 0.24rem 0.62rem;
        border-radius: var(--radius-sm);
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.04);
        color: var(--text-secondary);
        font-size: 0.76rem;
      }

      .cta-inner {
        padding: 3rem;
        border-radius: var(--radius-lg);
        text-align: center;
        border: 1px solid var(--border-color);
        background: linear-gradient(135deg, rgba(201, 168, 76, 0.08), rgba(139, 92, 246, 0.08));
      }

      .cta-inner h2 {
        margin-bottom: 0.7rem;
      }

      .cta-inner p {
        color: var(--text-secondary);
        margin-bottom: 1.4rem;
      }

      .footer {
        padding: 3rem 0;
        border-top: 1px solid var(--border-color);
        background: var(--bg-surface);
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1.5rem;
      }

      .footer-logo {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        color: var(--accent-primary);
        font-weight: 700;
      }

      .footer-brand p,
      .footer-credit p {
        margin: 0.2rem 0 0;
        color: var(--text-muted);
        font-size: 0.82rem;
      }

      .footer-links {
        display: flex;
        gap: 1.25rem;
      }

      .footer-links a {
        color: var(--text-secondary);
        text-decoration: none;
      }

      .footer-links a:hover {
        color: var(--accent-primary);
      }

      .footer-credit {
        text-align: right;
      }

      @media (max-width: 900px) {
        .dice-inner,
        .about-inner {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .showcase-grid {
          grid-template-columns: 1fr;
        }

        .footer-content {
          flex-direction: column;
          text-align: center;
        }

        .footer-credit {
          text-align: center;
        }
      }
    `,
  ],
})
export class HomeComponent {
  particles = Array.from({ length: 30 }, () => ({
    x: Math.random() * 100,
    delay: Math.random() * 8,
    dur: 6 + Math.random() * 6,
  }));

  features: FeatureCard[] = [
    { icon: 'map', title: 'Campanhas', desc: 'Crie mesas, sistemas e grupos com uma estrutura que continua viva após cada sessão.' },
    { icon: 'sword', title: 'Personagens', desc: 'Acompanhe evolução, recursos e vínculos sem espalhar informações em ferramentas separadas.' },
    { icon: 'calendar', title: 'Sessões', desc: 'Registre recap, ganchos, consequências e XP com memória narrativa conectada.' },
    { icon: 'book', title: 'Wiki viva', desc: 'Lore, facções, páginas hierárquicas e backlinks úteis antes, durante e depois da mesa.' },
    { icon: 'dice', title: 'Dados', desc: 'Rolagens rápidas, histórico imediato e utilidade real sem sair da campanha.' },
    { icon: 'bell', title: 'Presença', desc: 'Eventos, chat, compêndio e mapa conversam entre si e deixam rastros na campanha.' },
  ];

  systems: SystemCard[] = [
    { key: 'DND5E', icon: 'dice', name: 'D&D 5e', desc: 'Fantasia clássica, combate rápido e muito suporte de mesa.' },
    { key: 'T20', icon: 'spark', name: 'Tormenta 20', desc: 'Fantasia brasileira com mana, poder heroico e identidade forte.' },
    { key: 'CoC', icon: 'book', name: 'Call of Cthulhu', desc: 'Investigação, horror cósmico e sanidade como custo dramático.' },
    { key: 'Pathfinder', icon: 'shield', name: 'Pathfinder', desc: 'Tática profunda, builds detalhadas e grande flexibilidade de combate.' },
  ];

  diceTypes: DiceCard[] = [
    { sides: 4, icon: 'spark', label: 'd4', result: 0 },
    { sides: 6, icon: 'dice', label: 'd6', result: 0 },
    { sides: 8, icon: 'shield', label: 'd8', result: 0 },
    { sides: 10, icon: 'map', label: 'd10', result: 0 },
    { sides: 20, icon: 'sword', label: 'd20', result: 0 },
    { sides: 100, icon: 'book', label: 'd100', result: 0 },
  ];

  techStack = ['Angular 17', 'TypeScript', 'Node.js', 'Express', 'Prisma', 'PostgreSQL', 'Redis', 'Socket.IO', 'Docker', 'Nginx'];

  timeline = [
    { date: 'Jul 2023', text: 'Primeiro site de RPG em HTML/CSS no IFRN.' },
    { date: '2023', text: 'Nascimento de Augustus Frostborne e Satoru Naitokira.' },
    { date: 'Mar 2025', text: 'Decisão de reconstruir o projeto como aplicação real.' },
    { date: '2026', text: 'Campaign Hub evolui para RPG OS com compêndio, wiki e VTT beta.' },
  ];

  rollDice(dice: DiceCard): void {
    dice.result = Math.floor(Math.random() * dice.sides) + 1;
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
