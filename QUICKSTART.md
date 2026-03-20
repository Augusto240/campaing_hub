# Campaign Hub - Quick Start Guide

## 🚀 Quick Start with Docker (Easiest)

1. **Prerequisites**: Install Docker and Docker Compose

2. **Clone and run**:
```bash
cd campaign-hub
docker-compose up --build
```

3. **Access the app**:
   - Frontend: http://localhost
   - Backend API: http://localhost/api

4. **First time setup**: The database will be automatically migrated!

---

## 📝 Manual Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## 🎮 Usage

1. **Register** a new account
2. **Create** your first campaign
3. **Invite** players or add them manually
4. **Create** characters for the campaign
5. **Record** sessions and award XP
6. **Track** everything in the dashboard!

---

## 🔑 Default Test Users

After running migrations, you can create test users:

```bash
cd backend
npm run seed  # If seed script is available
```

Or register through the UI at `/auth/register`

---

## 📚 More Information

See the main [README.md](README.md) for:
- Complete API documentation
- Architecture details
- Advanced features
- Deployment guides
- Contributing guidelines

---

## ❓ Common Issues

### Port already in use
```bash
# Change ports in docker-compose.yml or .env files
```

### Database connection failed
```bash
# Make sure PostgreSQL is running
# Check DATABASE_URL in .env
```

### Frontend can't reach backend
```bash
# Check CORS_ORIGIN in backend .env
# Verify API_URL in frontend environment.ts
```

---

## 🆘 Need Help?

- Open an [issue](https://github.com/yourusername/campaign-hub/issues)
- Check [documentation](README.md)
- Contact: your-email@example.com
