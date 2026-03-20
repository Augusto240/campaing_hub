import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-bg">
          <div class="particles">
            <span *ngFor="let p of particles" class="particle" [style.left.%]="p.x" [style.animationDelay.s]="p.delay" [style.animationDuration.s]="p.dur"></span>
          </div>
          <div class="hero-overlay"></div>
        </div>
        <div class="hero-content">
          <div class="hero-badge">⚔️ Plataforma de RPG</div>
          <h1>Campaign<span class="accent">Hub</span></h1>
          <p class="hero-tagline">Gerencie suas campanhas, personagens e sessões de RPG em um único lugar.</p>
          <p class="hero-sub">De D&D 5e a Tormenta 20, Call of Cthulhu e Pathfinder — tudo unificado.</p>
          <div class="hero-actions">
            <a routerLink="/auth/register" class="btn btn-primary btn-lg">Começar Agora</a>
            <a routerLink="/auth/login" class="btn btn-outline btn-lg">Já tenho conta</a>
          </div>
          <div class="hero-scroll-hint" (click)="scrollTo('features')">
            <span>Explorar</span>
            <div class="scroll-arrow">↓</div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features" id="features">
        <div class="section-container">
          <div class="section-header">
            <h2>O que você pode fazer</h2>
            <p>Tudo que um mestre ou jogador de RPG precisa</p>
          </div>
          <div class="features-grid">
            <div class="feature-card" *ngFor="let f of features">
              <div class="feature-icon">{{ f.icon }}</div>
              <h3>{{ f.title }}</h3>
              <p>{{ f.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Systems Section -->
      <section class="systems">
        <div class="section-container">
          <div class="section-header">
            <h2>Sistemas Suportados</h2>
            <p>Cada sistema com sua própria identidade visual</p>
          </div>
          <div class="systems-grid">
            <div *ngFor="let sys of systems" class="system-card" [attr.data-system]="sys.key">
              <div class="system-icon">{{ sys.icon }}</div>
              <h3>{{ sys.name }}</h3>
              <p>{{ sys.desc }}</p>
              <div class="system-accent-line"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Dice Section -->
      <section class="dice-section">
        <div class="section-container">
          <div class="dice-inner">
            <div class="dice-text">
              <h2>🎲 Rolagem de Dados</h2>
              <p>Role d4, d6, d8, d10, d12, d20 e d100 diretamente no navegador. Perfeito para sessões online ou para gerar atributos com o método 4d6 drop lowest.</p>
              <a routerLink="/dice" class="btn btn-primary">Experimentar</a>
            </div>
            <div class="dice-demo">
              <div class="demo-dice" *ngFor="let d of diceTypes" (click)="rollDice(d)">
                <span class="dice-face">{{ d.icon }}</span>
                <span class="dice-label">{{ d.label }}</span>
                <span class="dice-result" *ngIf="d.result">{{ d.result }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- About Section -->
      <section class="about">
        <div class="section-container">
          <div class="about-inner">
            <div class="about-text">
              <h2>Sobre o Projeto</h2>
              <p>Este projeto nasceu em <strong>2023</strong> como um simples site HTML/CSS de um estudante do primeiro período de Sistemas para Internet no IFRN Campus Parnamirim, apaixonado por RPG.</p>
              <p>De páginas estáticas sobre campanhas e personagens, evoluiu para uma <strong>aplicação full-stack completa</strong> com Angular 17, Node.js, Express, Prisma, PostgreSQL e Docker.</p>
              <p>Um sonho de anos que finalmente se tornou realidade — a mega aplicação web de RPG.</p>
              <div class="about-tech">
                <span *ngFor="let t of techStack" class="tech-tag">{{ t }}</span>
              </div>
            </div>
            <div class="about-timeline">
              <div class="timeline-item" *ngFor="let ev of timeline">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <span class="timeline-date">{{ ev.date }}</span>
                  <span class="timeline-text">{{ ev.text }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Showcase Section - Original Characters -->
      <section class="showcase">
        <div class="section-container">
          <div class="section-header">
            <h2>Personagens Lendários</h2>
            <p>Os personagens que inspiraram tudo isso</p>
          </div>
          <div class="showcase-grid">
            <div class="showcase-card augustus">
              <div class="showcase-badge">D&D 5e</div>
              <div class="showcase-avatar">A</div>
              <h3>Augustus Frostborne</h3>
              <p class="showcase-quote">"Every wizard has a past..."</p>
              <div class="showcase-stats">
                <div class="sstat"><span class="sstat-label">Raça</span><span class="sstat-val">Humano</span></div>
                <div class="sstat"><span class="sstat-label">Classe</span><span class="sstat-val">Mago</span></div>
                <div class="sstat"><span class="sstat-label">Nível</span><span class="sstat-val">1</span></div>
              </div>
              <p class="showcase-bio">Nascido em uma vila que temia a magia, Augustus encontrou um colar misterioso e um grimório antigo na floresta quando criança. Praticou magia em segredo até o dia em que salvou sua vila de um incêndio — e foi expulso por isso. Agora vaga por terras desconhecidas, oferecendo curas e conhecimento por preços justos.</p>
              <div class="showcase-details">
                <span>🧊 Raio de Gelo</span>
                <span>🔥 Raio de Fogo</span>
                <span>✨ Ilusão Menor</span>
                <span>📖 Antecedente: Sábio</span>
                <span>🗣️ Comum e Élfico</span>
              </div>
            </div>
            <div class="showcase-card satoru">
              <div class="showcase-badge">Homebrew</div>
              <div class="showcase-avatar">S</div>
              <h3>Satoru Naitokira</h3>
              <p class="showcase-quote">"Lembranças, como lâminas, são mais afiadas quando compartilhadas."</p>
              <div class="showcase-stats">
                <div class="sstat"><span class="sstat-label">Ambientação</span><span class="sstat-val">Japonesa</span></div>
                <div class="sstat"><span class="sstat-label">Estilo</span><span class="sstat-val">Noturno</span></div>
                <div class="sstat"><span class="sstat-label">Mistério</span><span class="sstat-val">???</span></div>
              </div>
              <p class="showcase-bio">Um personagem envolto em mistério, com raízes na cultura japonesa. Satoru carrega consigo memórias afiadas e uma presença que oscila entre as sombras das ruas noturnas de uma metrópole.</p>
              <div class="showcase-details">
                <span>🌙 Noturno</span>
                <span>⚔️ Lâminas</span>
                <span>🏮 Cenário Urbano</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta">
        <div class="section-container">
          <div class="cta-inner">
            <h2>Pronto para começar sua aventura?</h2>
            <p>Crie sua conta gratuitamente e comece a gerenciar suas campanhas de RPG agora.</p>
            <a routerLink="/auth/register" class="btn btn-primary btn-lg">Criar Conta Grátis</a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="section-container">
          <div class="footer-content">
            <div class="footer-brand">
              <span class="footer-logo">⚔️ CampaignHub</span>
              <p>A mega aplicação web de RPG.</p>
            </div>
            <div class="footer-links">
              <a routerLink="/wiki">Wiki RPG</a>
              <a routerLink="/dice">Dados</a>
              <a routerLink="/auth/login">Login</a>
              <a routerLink="/auth/register">Registrar</a>
            </div>
            <div class="footer-credit">
              <p>Feito com ❤️ por <strong>Augusto Oliveira</strong></p>
              <p>IFRN Campus Parnamirim — 2023 → 2026</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .home { background: var(--bg-primary); }

    /* Hero */
    .hero {
      position: relative; min-height: 100vh; display: flex; align-items: center;
      justify-content: center; overflow: hidden;
    }
    .hero-bg { position: absolute; inset: 0; }
    .hero-overlay {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at center, rgba(15,15,26,0.6) 0%, rgba(15,15,26,0.95) 70%);
    }
    .particles { position: absolute; inset: 0; overflow: hidden; }
    .particle {
      position: absolute; bottom: -10px; width: 3px; height: 3px;
      background: var(--accent-primary); border-radius: 50%; opacity: 0;
      animation: floatUp 8s ease-in infinite;
    }
    @keyframes floatUp {
      0% { opacity: 0; transform: translateY(0); }
      10% { opacity: 0.8; }
      90% { opacity: 0.2; }
      100% { opacity: 0; transform: translateY(-100vh); }
    }
    .hero-content {
      position: relative; z-index: 2; text-align: center;
      max-width: 700px; padding: 2rem;
    }
    .hero-badge {
      display: inline-block; padding: 0.375rem 1rem; border-radius: 9999px;
      background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25);
      color: var(--accent-primary); font-size: 0.8rem; font-weight: 600;
      letter-spacing: 0.05em; margin-bottom: 1.5rem;
    }
    .hero-content h1 {
      font-family: var(--font-display); font-size: clamp(2.5rem, 6vw, 4.5rem);
      line-height: 1.1; margin-bottom: 1.25rem; color: var(--text-primary);
    }
    .accent { color: var(--accent-primary); }
    .hero-tagline { font-size: 1.15rem; color: var(--text-secondary); margin-bottom: 0.5rem; line-height: 1.6; }
    .hero-sub { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 2rem; }
    .hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .hero-scroll-hint {
      margin-top: 3rem; display: flex; flex-direction: column; align-items: center;
      gap: 0.25rem; cursor: pointer; color: var(--text-muted); font-size: 0.75rem;
      animation: pulse 2s ease infinite;
    }
    .scroll-arrow { font-size: 1rem; animation: bounce 1.5s ease infinite; }
    @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }

    /* Sections common */
    section { padding: 5rem 0; }
    .section-container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
    .section-header { text-align: center; margin-bottom: 3rem; }
    .section-header h2 { font-family: var(--font-display); font-size: 2rem; margin-bottom: 0.5rem; }
    .section-header p { color: var(--text-secondary); font-size: 1rem; }

    /* Features */
    .features { background: var(--bg-surface); }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }
    .feature-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); padding: 2rem 1.5rem;
      transition: all var(--transition-normal); text-align: center;
    }
    .feature-card:hover { border-color: var(--border-glow); transform: translateY(-4px); box-shadow: var(--shadow-glow); }
    .feature-icon { font-size: 2.5rem; margin-bottom: 1rem; }
    .feature-card h3 { font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--accent-primary); }
    .feature-card p { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.6; }

    /* Systems */
    .systems-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }
    .system-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); padding: 2rem 1.5rem;
      text-align: center; transition: all var(--transition-normal); position: relative; overflow: hidden;
    }
    .system-card:hover { transform: translateY(-4px); border-color: var(--accent-primary); }
    .system-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .system-card h3 { font-family: var(--font-display); font-size: 1rem; margin-bottom: 0.375rem; color: var(--accent-primary); }
    .system-card p { font-size: 0.8rem; color: var(--text-secondary); }
    .system-accent-line {
      position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
      opacity: 0; transition: opacity var(--transition-normal);
    }
    .system-card:hover .system-accent-line { opacity: 1; }

    /* Dice */
    .dice-section { background: var(--bg-surface); }
    .dice-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
    .dice-text h2 { font-family: var(--font-display); font-size: 1.75rem; margin-bottom: 1rem; }
    .dice-text p { color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.7; }
    .dice-demo { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .demo-dice {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 1.25rem 0.75rem;
      text-align: center; cursor: pointer; transition: all var(--transition-normal);
      display: flex; flex-direction: column; align-items: center; gap: 0.375rem;
    }
    .demo-dice:hover { border-color: var(--accent-primary); transform: scale(1.05); box-shadow: var(--shadow-glow); }
    .demo-dice:active { transform: scale(0.95); }
    .dice-face { font-size: 1.5rem; }
    .dice-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    .dice-result {
      font-family: var(--font-display); font-size: 1.25rem; color: var(--accent-primary);
      font-weight: 700; animation: slideUp 0.3s ease;
    }

    /* About */
    .about-inner { display: grid; grid-template-columns: 1.5fr 1fr; gap: 3rem; align-items: start; }
    .about-text h2 { font-family: var(--font-display); font-size: 1.75rem; margin-bottom: 1rem; }
    .about-text p { color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.7; font-size: 0.95rem; }
    .about-text strong { color: var(--accent-primary); }
    .about-tech { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.5rem; }
    .tech-tag {
      padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600;
      background: rgba(201,168,76,0.1); color: var(--accent-primary);
      border: 1px solid rgba(201,168,76,0.2);
    }
    .about-timeline { position: relative; padding-left: 1.5rem; border-left: 2px solid var(--border-color); }
    .timeline-item { position: relative; margin-bottom: 1.5rem; padding-left: 1rem; }
    .timeline-dot {
      position: absolute; left: -1.85rem; top: 0.25rem; width: 12px; height: 12px;
      border-radius: 50%; background: var(--accent-primary); border: 2px solid var(--bg-primary);
    }
    .timeline-content { display: flex; flex-direction: column; gap: 0.125rem; }
    .timeline-date { font-size: 0.75rem; color: var(--accent-primary); font-weight: 700; font-family: var(--font-display); }
    .timeline-text { font-size: 0.85rem; color: var(--text-secondary); }

    /* Showcase */
    .showcase { background: var(--bg-surface); }
    .showcase-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 2rem; }
    .showcase-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); padding: 2rem; position: relative;
      transition: all var(--transition-normal);
    }
    .showcase-card:hover { border-color: var(--border-glow); box-shadow: var(--shadow-glow); }
    .showcase-card.augustus { --card-accent: #c9a84c; }
    .showcase-card.satoru { --card-accent: #e11d48; }
    .showcase-badge {
      position: absolute; top: 1rem; right: 1rem; padding: 0.2rem 0.65rem;
      border-radius: 9999px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
      background: rgba(201,168,76,0.15); color: var(--accent-primary);
      border: 1px solid rgba(201,168,76,0.25);
    }
    .satoru .showcase-badge { background: rgba(225,29,72,0.15); color: #e11d48; border-color: rgba(225,29,72,0.25); }
    .showcase-avatar {
      width: 56px; height: 56px; border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--card-accent), var(--accent-secondary));
      color: #0f0f1a; display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 700; font-family: var(--font-display); margin-bottom: 1rem;
    }
    .showcase-card h3 { font-size: 1.25rem; margin-bottom: 0.25rem; }
    .showcase-quote {
      font-style: italic; color: var(--text-muted); font-size: 0.85rem;
      margin-bottom: 1rem; font-family: var(--font-fantasy);
    }
    .showcase-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
    .sstat {
      background: rgba(255,255,255,0.03); padding: 0.5rem; border-radius: var(--radius-sm); text-align: center;
    }
    .sstat-label { display: block; font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .sstat-val { display: block; font-size: 0.85rem; font-weight: 600; color: var(--card-accent); margin-top: 0.125rem; }
    .showcase-bio { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 1rem; }
    .showcase-details { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .showcase-details span {
      padding: 0.2rem 0.6rem; border-radius: var(--radius-sm); font-size: 0.7rem;
      background: rgba(255,255,255,0.04); color: var(--text-secondary);
      border: 1px solid rgba(255,255,255,0.06);
    }

    /* CTA */
    .cta { background: var(--bg-primary); }
    .cta-inner {
      text-align: center; padding: 3rem; border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(201,168,76,0.08), rgba(139,92,246,0.08));
      border: 1px solid var(--border-color);
    }
    .cta-inner h2 { font-family: var(--font-display); font-size: 1.75rem; margin-bottom: 0.75rem; }
    .cta-inner p { color: var(--text-secondary); margin-bottom: 1.5rem; }

    /* Footer */
    .footer { padding: 3rem 0; border-top: 1px solid var(--border-color); background: var(--bg-surface); }
    .footer-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; }
    .footer-logo { font-family: var(--font-display); font-size: 1.1rem; color: var(--accent-primary); font-weight: 700; }
    .footer-brand p { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }
    .footer-links { display: flex; gap: 1.5rem; }
    .footer-links a { font-size: 0.85rem; color: var(--text-secondary); }
    .footer-links a:hover { color: var(--accent-primary); }
    .footer-credit { text-align: right; }
    .footer-credit p { font-size: 0.8rem; color: var(--text-muted); }
    .footer-credit strong { color: var(--accent-primary); }

    @media (max-width: 768px) {
      .dice-inner { grid-template-columns: 1fr; }
      .about-inner { grid-template-columns: 1fr; }
      .showcase-grid { grid-template-columns: 1fr; }
      .footer-content { flex-direction: column; text-align: center; }
      .footer-credit { text-align: center; }
      .footer-links { flex-wrap: wrap; justify-content: center; }
    }
  `]
})
export class HomeComponent {
  particles = Array.from({ length: 30 }, (_, i) => ({
    x: Math.random() * 100,
    delay: Math.random() * 8,
    dur: 6 + Math.random() * 6
  }));

  features = [
    { icon: '🗺️', title: 'Campanhas', desc: 'Crie e gerencie campanhas de RPG com múltiplos sistemas. Organize tudo em um só lugar.' },
    { icon: '⚔️', title: 'Personagens', desc: 'Cadastre personagens com classe, nível e XP. Acompanhe a evolução ao longo das sessões.' },
    { icon: '📅', title: 'Sessões', desc: 'Registre cada sessão com resumo, data e XP distribuído automaticamente aos personagens.' },
    { icon: '💎', title: 'Loot', desc: 'Controle itens e tesouros encontrados. Atribua loot a personagens específicos.' },
    { icon: '🎲', title: 'Dados', desc: 'Role d4 a d100 direto no navegador. Geração de atributos com 4d6 drop lowest.' },
    { icon: '🔔', title: 'Notificações', desc: 'Receba alertas sobre eventos das suas campanhas. Nunca perca uma sessão.' },
  ];

  systems = [
    { key: 'DND5E', icon: '🐉', name: 'D&D 5e', desc: 'O RPG mais popular do mundo' },
    { key: 'T20', icon: '⚡', name: 'Tormenta 20', desc: 'O maior RPG brasileiro' },
    { key: 'CoC', icon: '🐙', name: 'Call of Cthulhu', desc: 'Horror cósmico lovecraftiano' },
    { key: 'Pathfinder', icon: '🏰', name: 'Pathfinder', desc: 'Aventuras épicas e detalhadas' },
    { key: 'Other', icon: '🎭', name: 'Outros', desc: 'Qualquer sistema que você jogue' },
  ];

  diceTypes = [
    { sides: 4, icon: '🔺', label: 'd4', result: 0 },
    { sides: 6, icon: '🎲', label: 'd6', result: 0 },
    { sides: 8, icon: '💠', label: 'd8', result: 0 },
    { sides: 10, icon: '🔟', label: 'd10', result: 0 },
    { sides: 20, icon: '⭐', label: 'd20', result: 0 },
    { sides: 100, icon: '💯', label: 'd100', result: 0 },
  ];

  techStack = ['Angular 17', 'TypeScript', 'Node.js', 'Express', 'Prisma', 'PostgreSQL', 'Docker', 'Nginx', 'JWT', 'SCSS'];

  timeline = [
    { date: 'Jul 2023', text: 'Primeiro site de RPG em HTML/CSS puro — IFRN 1º período' },
    { date: '2023', text: 'Criação de Augustus Frostborne e Satoru Naitokira' },
    { date: 'Mar 2025', text: 'Decisão de reconstruir o projeto com Angular' },
    { date: 'Fev 2026', text: 'Campaign Hub — Full-stack com todas as funcionalidades' },
  ];

  rollDice(d: any): void {
    d.result = Math.floor(Math.random() * d.sides) + 1;
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
