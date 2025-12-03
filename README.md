# Collector Care Giveaway

A modern e-commerce platform for collector trading cards with built-in giveaway functionality. Built with Next.js 16, Prisma, Tailwind CSS, and NextAuth.js.

## 🚀 Features

- **Card Store**: Browse and purchase rare collector cards (Magic: The Gathering, Pokémon, Yu-Gi-Oh!, Sports Cards, and more)
- **Giveaways**: Enter free giveaways to win rare cards
- **Magic Link Authentication**: Passwordless sign-in via email using Resend/Nodemailer
- **Responsive Design**: Beautiful dark theme UI optimized for all devices
- **Admin Dashboard**: (Coming soon) Manage inventory and giveaways

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM (v5.x)
- **Authentication**: NextAuth.js with Email Provider (Magic Links)
- **Email**: Resend API + Nodemailer fallback
- **Styling**: Tailwind CSS 4
- **Fonts**: Outfit + JetBrains Mono

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Resend API key (or SMTP credentials)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/collector-care-giveaway.git
   cd collector-care-giveaway
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/collectorcardgiveaway"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   RESEND_API_KEY="re_xxxxxxxxxxxx"
   EMAIL_FROM="noreply@collectorcaredgiveaway.com"
   ```

4. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. (Optional) Seed sample data:
   ```bash
   npx prisma db seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth API routes
│   │   ├── cards/               # Cards API
│   │   └── giveaways/           # Giveaways API
│   ├── auth/
│   │   ├── signin/              # Sign in page
│   │   ├── verify-request/      # Email verification page
│   │   └── error/               # Auth error page
│   ├── categories/              # Categories page
│   ├── giveaways/               # Giveaways page
│   ├── store/                   # Store page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/
│   ├── providers/
│   │   └── SessionProvider.tsx  # NextAuth session provider
│   ├── CardGrid.tsx             # Card grid component
│   ├── CategoryCard.tsx         # Category card component
│   ├── Footer.tsx               # Footer component
│   ├── Header.tsx               # Header/navigation
│   └── Hero.tsx                 # Hero section
├── lib/
│   ├── auth.ts                  # NextAuth configuration
│   ├── email.ts                 # Email utilities (Resend/Nodemailer)
│   └── prisma.ts                # Prisma client
└── types/
    └── next-auth.d.ts           # NextAuth type extensions
```

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Your site URL (e.g., http://localhost:3000) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth (generate with `openssl rand -base64 32`) |
| `RESEND_API_KEY` | Resend API key for emails |
| `SMTP_HOST` | SMTP server host (fallback) |
| `SMTP_PORT` | SMTP server port (fallback) |
| `SMTP_USER` | SMTP username (fallback) |
| `SMTP_PASSWORD` | SMTP password (fallback) |
| `EMAIL_FROM` | Sender email address |

## 📝 Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name your-migration-name

# Open Prisma Studio
npx prisma studio
```

## 🎨 Customization

- **Colors**: Edit CSS variables in `src/app/globals.css`
- **Fonts**: Change fonts in `src/app/layout.tsx`
- **Categories**: Update category data in page components

## 📄 License

MIT License - feel free to use this project for your own collector card store!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
