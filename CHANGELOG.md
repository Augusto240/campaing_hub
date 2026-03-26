# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-15

### Added
- 🎉 Initial release of Campaign Hub
- ✅ User authentication with JWT and refresh tokens
- ✅ Campaign CRUD operations with role-based access
- ✅ Character management with automated XP calculations
- ✅ Session tracking with XP distribution
- ✅ Loot management and assignment system
- ✅ Real-time notifications
- ✅ Analytics dashboard with charts
- ✅ PDF report generation for sessions
- ✅ CSV export for campaign data
- ✅ Role-based permission system (RBAC)
- ✅ Multi-system support (D&D 5E, T20, CoC, etc.)
- ✅ Docker containerization
- ✅ Comprehensive test coverage
- ✅ Professional documentation

### Features

#### Backend
- RESTful API with Express and TypeScript
- Prisma ORM for database management
- JWT authentication with refresh token rotation
- Role-based middleware for authorization
- Automated XP calculation with D&D 5E tables
- PDF generation with PDFKit
- CSV export with json2csv
- File upload support with Multer
- Comprehensive error handling
- Activity logging

#### Frontend
- Angular 17 with standalone components
- Reactive state management with RxJS
- Token-based authentication with interceptors
- Route guards for protected pages
- Responsive design with SCSS
- Real-time notification badges
- Interactive dashboard with charts
- Campaign and character management UIs

#### Database
- PostgreSQL with Prisma schema
- Normalized relational design
- UUID primary keys
- Cascading deletes
- Indexed foreign keys
- Enum types for roles and events

### Technical
- TypeScript throughout the stack
- Docker multi-stage builds
- Nginx reverse proxy
- Environment-based configuration
- Jest testing framework
- ESLint code quality

---

## [Unreleased]

### Added
- Wiki hierarquica de campanha com suporte a pagina pai/filho
- Importacao canonica do legado 2023 por campanha (Augustus, Satoru, galeria e rolador 4d6)
- Endpoint de arvore da wiki para navegacao estilo caderno
- Suporte a links internos `@Pagina` com resolucao de backlinks
- Nova tela da wiki de campanha com arvore lateral, criacao de subpagina e painel de referencias
- Testes de integracao para fluxo de wiki (hierarquia, ciclo, idempotencia e permissao GM)
- Mesa Online (VTT Beta) por campanha com mapa por URL, grade configuravel e tokens arrastaveis
- Sincronizacao realtime da mesa via Socket.IO com eventos de request/update/state

### Changed
- Modelo Prisma `wiki_pages` expandido com `parent_page_id` e `legacy_source`
- Documentacao principal atualizada com rotas e fluxo da wiki viva
- Home da campanha agora destaca acesso rapido para `Mesa Online (VTT Beta)`

### Planned Features
- WebSocket support for real-time collaboration
- Email notifications
- Campaign templates
- Advanced character sheets
- Combat tracker
- Dice roller integration
- Mobile app

---

## Version History

- **1.0.0** - Initial release with core features
