<div align="center">

<img src="docs/assets/novatek-banner.svg" alt="NOVATEK" width="100%" />

# NOVATEK Store

**Arabic-first e-commerce platform for laptops, gaming products, digital services and custom PC requests.**

<p>
  <a href="https://bkkari-tech.vercel.app">Live Store</a> ·
  <a href="https://github.com/Barhoom915/Bkkari-Tech">GitHub Repository</a>
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-149eca?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ecf8e?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vercel-Deployment-000000?logo=vercel" alt="Vercel" />
</p>

</div>

---

## 🟧 What is NOVATEK?

**NOVATEK** is a production-oriented, Arabic RTL e-commerce storefront built with **Next.js, React, TypeScript and Supabase**.

It is designed around a real shopping workflow rather than a static showcase: customers can browse products, search the catalog, manage an account, save favorites, leave reviews, use a wallet, place orders and request custom PC builds.

The project is optimized for **mobile-first shopping** while keeping the desktop experience intact.

## ✨ Highlights

| Area | What NOVATEK provides |
|---|---|
| 🛍️ Storefront | Product rails, categories, featured products and product pages |
| 💻 Laptops | Laptop catalog, stock-aware products and detailed pages |
| 🎮 Gaming | PlayStation products and gaming-oriented sections |
| 🖥️ PC Builder | Custom PC request workflow |
| 💳 Wallet | Customer balance and wallet-based checkout |
| 🧾 Checkout | Server-side Supabase RPC for order creation |
| 👤 Accounts | Authentication, account area and customer data |
| ⭐ Reviews | Account-based ratings and reviews |
| ❤️ Wishlist | Favorites / saved products |
| 🔎 Search | Animated search, history, suggestions and Arabic/English aliases |
| 🔔 Notifications | Customer notification and activity flows |
| 🧠 Assistant | Store AI assistant entry point |
| 📱 Mobile UX | Mobile navigation, responsive layouts and floating actions |
| 🎨 Branding | NOVATEK orange / black / white identity |
| ⚡ Motion | Product-opening transitions and UI micro-interactions |

## 🧰 Technology

```text
Frontend        Next.js 16 + React 19 + TypeScript
UI / Motion     CSS + Framer Motion
Backend         Supabase
Database        PostgreSQL
Authentication  Supabase Auth
Notifications   Web Push / VAPID
Deployment      Vercel
Repository      GitHub
```

## 🗂️ Repository map

```text
Bkkari-Tech/
│
├── app/                         # Next.js application
│   ├── components/              # Shared storefront components
│   ├── checkout/                # Checkout flow
│   ├── laptops/                 # Laptop catalog + product pages
│   ├── services/                # Digital services
│   ├── web-dev/                 # Web/programming requests
│   ├── wishlist/                # Favorites
│   ├── account/                 # Customer account
│   ├── admin/                   # Admin pages
│   ├── page.tsx                 # Storefront home
│   ├── layout.tsx               # Global layout
│   └── globals.css              # Global design system
│
├── public/                      # Static assets
│   ├── brand/                   # NOVATEK branding
│   ├── catalog/                 # Catalog visuals
│   └── social/                  # Real app/social icons
│
├── supabase/                    # Database + security migrations
│   ├── schema.sql               # Core schema
│   ├── features.sql             # Store features / policies
│   ├── admin.sql                # Admin database setup
│   └── *.sql                    # Versioned migrations
│
├── docs/                        # Documentation
│   ├── architecture/            # System architecture
│   ├── assets/                  # README visuals
│   ├── design/                  # Design notes
│   ├── releases/                # Version notes
│   ├── CHANGELOG.md             # Release history
│   └── RELEASE_PROCESS.md       # Release workflow
│
├── .github/                     # GitHub repository configuration
│   └── ISSUE_TEMPLATE/          # Bug + feature templates
│
├── .env.example                 # Environment variable template
├── CONTRIBUTING.md              # Contribution workflow
├── SECURITY.md                  # Security guidance
├── CODE_OF_CONDUCT.md           # Community rules
├── package.json                 # Scripts + dependencies
└── README.md                    # Project overview
```

## 🚀 Run locally

### 1. Clone

```bash
git clone https://github.com/Barhoom915/Bkkari-Tech.git
cd Bkkari-Tech
```

### 2. Install

```bash
npm install
```

### 3. Environment

```bash
cp .env.example .env.local
```

Fill the required values in `.env.local`.

> **Never commit `.env.local`, private API keys, service-role keys, VAPID private keys or payment credentials.**

### 4. Development

```bash
npm run dev
```

Then open `http://localhost:3000`.

### 5. Production check

```bash
npm run lint
npm run build
npm start
```

## 🔐 Environment variables

The repository contains a safe template in [`.env.example`](.env.example).

Typical configuration includes:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SATOFILL_API_TOKEN=...
SUPABASE_SECRET_KEY=...
```

Only values intended for browser use should use the `NEXT_PUBLIC_` prefix. Server-only secrets must remain private.

## 🗄️ Supabase

Database changes live under [`supabase/`](supabase/).

The application uses Supabase for:

- Authentication
- PostgreSQL data
- Row Level Security
- Wallet data
- Orders and checkout RPCs
- Product/catalog data
- Reviews and customer activity
- Notifications and related settings

When a release contains a database change, apply the matching SQL migration **before testing that feature**.

For checkout, the browser should not be treated as the final authority for totals or wallet deductions. Sensitive order logic belongs in the database RPC layer.

## ☁️ Deployment

```text
Developer
   │
   ▼
GitHub main
   │
   ▼
Vercel build
   │
   ▼
Next.js production build
   │
   ▼
NOVATEK Store
```

Production storefront: **https://bkkari-tech.vercel.app**

## 🎨 Design language

NOVATEK intentionally keeps the interface simple and recognizable:

- **Orange** for primary actions and brand accents
- **Black** for strong navigation and contrast
- **White** for clean content surfaces
- **Arabic RTL** as the primary interface
- **Mobile-first** responsive behavior
- Real application icons instead of emoji placeholders
- Clear hierarchy with minimal visual noise
- Motion that communicates navigation and interaction

## 🔎 Search philosophy

The search experience is designed around the way customers actually type products.

It supports Arabic and English aliases and common variations such as:

```text
لابتوب      → laptop / laptops / لاب توب / لابتوبات
بلايستيشن   → PlayStation / PS4 / PS5 / بلاي ستيشن
يد تحكم     → controller / gamepad / قبضة / كنترول
بطاقات      → cards / بطاقة / كرت / كروت
اشتراك      → subscription / subscriptions
```

The storefront also keeps local search history on the device so previous searches can be reused quickly.

## 🧪 Quality checklist

Before pushing a significant release:

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Mobile layout checked
- [ ] Desktop layout checked
- [ ] Product opening animation checked
- [ ] Search animation checked
- [ ] Search history checked
- [ ] Authentication checked
- [ ] Checkout checked
- [ ] Required Supabase migration applied
- [ ] Real icons/assets load correctly
- [ ] No secrets are present in the commit

## 📚 Documentation

- [Architecture overview](docs/architecture/OVERVIEW.md)
- [Changelog](docs/CHANGELOG.md)
- [Release process](docs/RELEASE_PROCESS.md)
- [Design notes](docs/design/REDESIGN_NOTES.md)
- [Release notes](docs/releases/)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## 🧭 Roadmap

The project is continuously improved in small, trackable releases. Current priorities include:

- More polished product transitions
- Faster storefront interactions
- Better search discovery and aliases
- Continued mobile UX refinement
- Admin-side control over more storefront presentation settings
- Stronger automated quality checks

## 👨‍💻 Maintainer

**NOVATEK / Ibrahim Bakkari**

For project issues, use GitHub Issues. Do not publish secrets, customer information or private credentials in issues.

## 📄 License

This is a private commercial storefront project. Unless a separate license is added to the repository, the source should not be assumed to be open-source or licensed for redistribution.

---

<div align="center">

**NOVATEK — Smart commerce, built for the real store.**

</div>
