# **AgoraRecomendo.com** 🌟

### _The Ultimate Bilingual Product Recommendation Platform_

> **Transform your affiliate marketing into a premium, SEO-optimized content empire.** Built with Next.js 14, TipTap rich editor, and intelligent locale-aware content management. Support EN-US and PT-BR audiences simultaneously with zero friction.

---

## 🎯 **Why AgoraRecomendo?**

### **For Affiliate Marketers & Content Creators**

- **💰 Maximize Revenue**: Manage multiple affiliate links per product (Amazon US, Amazon BR, etc.) with automatic locale detection
- **🌍 Go Global Instantly**: Bilingual content management (EN-US + PT-BR) with one-click locale toggle controlling everything—reviews, categories, links, and slugs
- **📈 SEO Powerhouse**: Static page generation, semantic HTML, locale-aware URLs (`/produto/smart-watch` vs `/produto/br-relogio-inteligente`), and clean meta tags
- **⚡ Lightning-Fast Publishing**: Import Amazon reviews in bulk (HTML scraping + Rainforest API), auto-generate articles with AI, and publish in minutes

### **For Developers & Agencies**

- **🏗️ Production-Ready Architecture**: Next.js 14 App Router, Prisma ORM, NextAuth, TypeScript, Tailwind CSS—industry-standard stack
- **🔒 Secure by Default**: Google OAuth with email whitelist, server-side sanitization, environment-based access control
- **🎨 Premium Design System**: Apple-inspired UI with Framer Motion animations, dark mode, responsive layouts, and beautiful TipTap editor
- **🔧 Extensible & Maintainable**: Clean separation of concerns, type-safe APIs, database migrations, and comprehensive error handling

---

## ✨ **Key Features**

### **Content Management**
- **Rich Text Editor**: TipTap-powered with color, fonts, highlights, images, links, task lists, and AI-powered article generation
- **Multi-Locale Products**: Separate titles, summaries, and articles for EN-US and PT-BR
- **Smart Slug Generation**: Automatic locale-aware URLs with `br-` prefix for Portuguese content
- **Category Translations**: Display category names in user's language (namePtBr field for PT-BR)

### **Review System**
- **Locale-Aware Filtering**: Show only reviews matching current language toggle
- **Bulk Import**: Scrape Amazon reviews with one click (supports HTML scraping + Rainforest API)
- **Manual Management**: Add, edit, delete reviews with avatar support and star ratings
- **Backward Compatible**: Reviews without locale field display universally

### **Affiliate Link Intelligence**
- **Multi-Store Support**: Add multiple affiliate links per product (Amazon.com, Amazon.com.br, etc.)
- **Automatic Selection**: System picks the correct link based on user's locale toggle
- **Flexible Matching**: Normalizes locale variants (pt-BR, pt-br, pt, br → PT-BR; en-US, en-us, en, us → EN-US)

### **Admin Panel**
- **Protected Access**: NextAuth with Google OAuth + email whitelist (ADMIN_EMAILS)
- **Product Dashboard**: Create, edit, delete products with live preview
- **Category Manager**: Organize products with bilingual category names
- **Review Manager**: Import, add, edit, and delete reviews per locale
- **Settings Panel**: Configure site-wide options

### **SEO & Performance**
- **Static Generation**: 24 static pages with incremental static regeneration
- **Image Optimization**: Next.js Image with remote patterns for Amazon, Google, placeholders
- **Meta Tags**: Automatic OG tags, Twitter cards, and structured data
- **Sitemap & Robots**: Pre-configured for search engine crawling

---

## 🏗️ **Technical Architecture**

### **Frontend**
- **Framework**: Next.js 14.2.33 (App Router, React 18.3.1, TypeScript 5.5.4)
- **Styling**: Tailwind CSS 3.4.6 + @tailwindcss/typography, custom design system
- **Animations**: Framer Motion 12.23.24
- **Editor**: TipTap 3.9.1 (color, font-family, highlight, image, link, placeholder, task-list, underline)
- **State**: React Context (LanguageProvider, ThemeProvider, ToastProvider)
- **UI Components**: Custom button, separator, and editor components with shadcn/ui inspiration

### **Backend**
- **Runtime**: Node.js 18+ (serverless-ready)
- **Database**: PostgreSQL via Prisma ORM 5.22.0 (Supabase recommended)
- **Authentication**: NextAuth 4.24.12 with Google OAuth provider
- **APIs**: RESTful endpoints for products, categories, reviews, scraping, translation, upload
- **Sanitization**: sanitize-html 2.17.0 for XSS protection
- **Image Upload**: Local storage to `public/uploads/` with automatic directory creation

### **Third-Party Integrations**
- **Rainforest API**: Optional Amazon product data fetching by ASIN/URL
- **Google OAuth**: User authentication with email whitelist
- **Amazon Scraping**: Fallback HTML scraping with dual selector support

### **Database Schema**
```prisma
model Product {
  id              String   @id @default(cuid())
  title           String
  titlePtBr       String?
  summary         String?
  summaryPtBr     String?
  article         String?  @db.Text
  articlePtBr     String?  @db.Text
  slug            String?  @unique
  imageUrl        String?
  category        Category @relation(fields: [categoryId], references: [id])
  categoryId      String
  reviews         Review[]
  links           AffiliateLink[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Review {
  id          String   @id @default(cuid())
  author      String
  rating      Int
  comment     String   @db.Text
  locale      String   @default("en-US")
  avatarUrl   String?
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
}

model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  namePtBr  String?
  products  Product[]
}

model AffiliateLink {
  id        String  @id @default(cuid())
  url       String
  locale    String
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

---

## 📦 **Installation Guide**

### **Prerequisites**

✅ **Node.js 18+** and npm  
✅ **PostgreSQL database** (Supabase recommended for free tier + connection pooling)  
✅ **Google Cloud Project** for OAuth credentials  
✅ _(Optional)_ **Rainforest API Key** for automated Amazon data fetching

---

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/bkdsb/agorarecomendo.git
cd agorarecomendo/agorarecomendo
```

---

### **Step 2: Install Dependencies**

```bash
npm install
```

This installs all required packages including Next.js, Prisma, NextAuth, TipTap, Tailwind CSS, and supporting libraries.

---

### **Step 3: Configure Environment Variables**

#### **3.1. Copy the Example File**

```bash
cp .env.example .env
```

#### **3.2. Set Up Database (Supabase)**

1. Go to [Supabase](https://supabase.com/) and create a free account
2. Create a new project (choose a region close to your users)
3. Navigate to **Project Settings** > **Database**
4. Copy the **Connection String** (use the **Transaction** or **Session** mode for local dev, **Connection Pooling** for production)
5. Paste into `.env`:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

**Alternative**: Use any PostgreSQL provider (Neon, Railway, local Postgres)

#### **3.3. Generate NextAuth Secret**

Generate a strong random secret (32+ characters):

```bash
openssl rand -base64 32
```

Add to `.env`:

```env
NEXTAUTH_SECRET="your_generated_secret_here"
NEXTAUTH_URL="http://localhost:3000"
```

**Production Note**: Change `NEXTAUTH_URL` to your production domain (e.g., `https://agorarecomendo.com`)

#### **3.4. Configure Google OAuth**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure consent screen if prompted (External, add your email)
6. Application type: **Web application**
7. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - `https://your-production-domain.com/api/auth/callback/google` (for production)
8. Copy **Client ID** and **Client Secret**
9. Paste into `.env`:

```env
GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefg1234567890"
```

#### **3.5. Set Admin Emails**

Add comma-separated email addresses that can access the admin panel:

```env
ADMIN_EMAILS="your-email@gmail.com,editor@example.com,another-admin@domain.com"
```

**Important**: Only emails in this list can access `/admin-secret-xyz` after Google login.

#### **3.6. (Optional) Add Rainforest API Key**

If you want automated Amazon product data fetching:

1. Sign up at [Rainforest API](https://www.rainforestapi.com/)
2. Get your API key from the dashboard
3. Add to `.env`:

```env
RAINFOREST_API_KEY="your_rainforest_api_key_here"
```

**Note**: Without this key, you can still manually enter product data and use HTML scraping for reviews.

---

### **Step 4: Set Up the Database**

#### **4.1. Run Migrations**

Apply the database schema to your PostgreSQL database:

```bash
npx prisma migrate deploy
```

This creates all tables (Product, Review, Category, AffiliateLink, User, Account, Session, VerificationToken).

#### **4.2. Generate Prisma Client**

Generate the Prisma Client for TypeScript:

```bash
npx prisma generate
```

#### **4.3. (Optional) Seed Initial Data**

Create your first category via Prisma Studio:

```bash
npx prisma studio
```

Open `http://localhost:5555`, navigate to **Category** table, and add a category (e.g., `name: "Electronics"`, `namePtBr: "Eletrônicos"`).

---

### **Step 5: Start the Development Server**

```bash
npm run dev
```

**Server running at**: [http://localhost:3000](http://localhost:3000)

You should see the homepage with "The best recommendations, carefully selected."

---

### **Step 6: Access the Admin Panel**

1. Navigate to [http://localhost:3000/admin-secret-xyz](http://localhost:3000/admin-secret-xyz)
2. Click **Sign in with Google**
3. Authenticate with a Google account listed in `ADMIN_EMAILS`
4. You'll be redirected to the admin dashboard

**First-Time Setup**:
- Go to **Categories** and create at least one category
- Go to **Products** > **New Product** to create your first product
- Add affiliate links (specify locale: `en-US` or `pt-BR`)
- Import reviews from Amazon or add manually
- Write an article using the TipTap editor
- Publish and view at `/produto/[slug]`

---

### **Step 7: Build for Production**

```bash
npm run build
```

This generates an optimized production build with static pages.

**Start Production Server**:

```bash
npm start
```

---

## 🚀 **Deployment**

### **Vercel (Recommended)**

1. Push your code to GitHub:

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Go to [Vercel](https://vercel.com/) and import your repository
3. Configure environment variables in **Vercel Dashboard** > **Project Settings** > **Environment Variables**:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to your production domain, e.g., `https://agorarecomendo.vercel.app`)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `ADMIN_EMAILS`
   - `RAINFOREST_API_KEY` (optional)

4. Update **Google OAuth** redirect URI:
   - Go to [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**
   - Edit your OAuth 2.0 Client ID
   - Add `https://your-production-domain.vercel.app/api/auth/callback/google` to **Authorized redirect URIs**

5. Deploy:

```bash
vercel --prod
```

Or connect GitHub and enable automatic deployments.

---

### **Other Platforms (Railway, Render, Fly.io)**

1. Ensure Node.js 18+ runtime
2. Set all environment variables in platform dashboard
3. Set `NEXTAUTH_URL` to production domain
4. Update Google OAuth redirect URI
5. Run build command: `npm run build`
6. Start command: `npm start`

---

## 🌍 **Locale System Explained**

### **How It Works**

- **Default Locale**: EN-US (English) — all content without translation falls back to English
- **Secondary Locale**: PT-BR (Portuguese) — products can have `titlePtBr`, `summaryPtBr`, `articlePtBr`
- **Toggle Control**: Language toggle (flag icon in header) switches:
  - ✅ **Reviews**: Filtered by `Review.locale` field
  - ✅ **Categories**: Display `namePtBr` when in PT-BR mode
  - ✅ **Affiliate Links**: Selects link matching current locale (e.g., `amazon.com.br` for PT-BR)
  - ✅ **Slugs**: PT-BR slugs get `br-` prefix (e.g., `/produto/br-relogio-inteligente`)

### **Backward Compatibility**

- Reviews without a `locale` field display in **all locales** (graceful handling of legacy data)
- Products without PT-BR translations show English content with PT-BR toggle active

### **Adding New Locales**

To add ES-ES (Spanish):

1. Update `lib/locales/` with `es-ES.json`
2. Modify `LanguageProvider` to support 3 locales
3. Add `titleEsEs`, `summaryEsEs`, `articleEsEs` to Prisma schema
4. Update `generateSlug()` with `es-` prefix logic
5. Adjust `normalizeLocale()` to handle `es`/`es-ES` variants

---

## 📚 **Available Scripts**

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint

npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma generate  # Regenerate Prisma Client after schema changes
npx prisma migrate dev --name description  # Create a new migration
npx prisma migrate deploy  # Apply migrations to production database

npm run db:backup    # (Custom) Backup database to SQL file
npm run db:restore   # (Custom) Restore database from SQL file
npm run db:deploy    # Alias for prisma migrate deploy
npm run db:pull      # Pull database schema to Prisma schema
npm run db:generate  # Alias for prisma generate
```

---

## 🛠️ **Troubleshooting**

### **Issue: "Invalid `prisma.product.findMany()` invocation"**

**Cause**: Prisma Client not generated or out of sync with schema.

**Solution**:

```bash
npx prisma generate
```

---

### **Issue: "Google OAuth redirect URI mismatch"**

**Cause**: Redirect URI in Google Cloud Console doesn't match your app's URL.

**Solution**:

1. Check your current URL (e.g., `http://localhost:3000` or `https://your-domain.com`)
2. Go to [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add exact redirect URI: `YOUR_URL/api/auth/callback/google`
5. Save and retry login

---

### **Issue: "Access denied" when accessing admin panel**

**Cause**: Your email is not in `ADMIN_EMAILS` environment variable.

**Solution**:

1. Open `.env` file
2. Add your Google account email to `ADMIN_EMAILS`:

```env
ADMIN_EMAILS="your-email@gmail.com,other-admin@example.com"
```

3. Restart dev server: `npm run dev`

---

### **Issue: "Database connection failed"**

**Cause**: Incorrect `DATABASE_URL` or database not accessible.

**Solution**:

1. Verify `DATABASE_URL` format:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

2. Test connection with Prisma Studio:

```bash
npx prisma studio
```

3. Check database provider logs (Supabase dashboard, Railway logs, etc.)

---

### **Issue: "Reviews not importing from Amazon"**

**Cause**: Amazon URL format incorrect or page structure changed.

**Solution**:

1. Use full product URL: `https://www.amazon.com/dp/B08XYZABC/`
2. Try both scraping methods: **HTML Scraping** and **Via API** (if Rainforest key configured)
3. Check browser console for specific error messages
4. Verify product has reviews on Amazon page

---

### **Issue: "Images not displaying"**

**Cause**: Remote image domain not configured in `next.config.mjs`.

**Solution**:

1. Open `next.config.mjs`
2. Add image domain to `remotePatterns`:

```js
images: {
  remotePatterns: [
    { hostname: 'placehold.co' },
    { hostname: 'lh3.googleusercontent.com' },
    { hostname: 'm.media-amazon.com' },
    { hostname: 'images-na.ssl-images-amazon.com' },
    { hostname: 'your-new-domain.com' }, // Add here
  ],
},
```

3. Restart dev server

---

### **Issue: "Build fails with 'Module not found'"**

**Cause**: Missing dependency or incorrect import path.

**Solution**:

1. Delete `node_modules` and `package-lock.json`:

```bash
rm -rf node_modules package-lock.json
```

2. Reinstall dependencies:

```bash
npm install
```

3. Regenerate Prisma Client:

```bash
npx prisma generate
```

4. Rebuild:

```bash
npm run build
```

---

## 🎨 **Customization**

### **Change Color Scheme**

Edit `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#007AFF', // Change to your brand color
        dark: '#0051D5',
      },
    },
  },
},
```

### **Add Custom Fonts**

1. Add font files to `public/fonts/`
2. Import in `app/globals.css`:

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-font.woff2') format('woff2');
}
```

3. Update Tailwind config:

```ts
fontFamily: {
  custom: ['CustomFont', 'sans-serif'],
},
```

### **Modify Editor Extensions**

Edit `components/editor/extensions.tsx` to add/remove TipTap extensions:

```ts
import { Bold, Italic, Strike } from '@tiptap/extension-...';

export const extensions = [
  Bold,
  Italic,
  Strike,
  // Add custom extensions here
];
```

---

## 📄 **License**

MIT License. See [LICENSE](LICENSE) file for details.

---

## 🤝 **Contributing**

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

**Code Style**: Follow existing patterns, use TypeScript, add comments for complex logic.

---

## 📧 **Support & Contact**

- **Issues**: [GitHub Issues](https://github.com/bkdsb/agorarecomendo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bkdsb/agorarecomendo/discussions)
- **Email**: support@agorarecomendo.com _(replace with your actual support email)_

---

## 🌟 **Roadmap**

- [ ] Add ES-ES (Spanish) locale support
- [ ] Implement product comparison feature
- [ ] Add user-submitted reviews (public-facing)
- [ ] Create mobile app with React Native
- [ ] Add analytics dashboard (views, clicks, conversions)
- [ ] Implement A/B testing for CTAs
- [ ] Add email newsletter integration
- [ ] Create public API for third-party integrations

---

**Built with ❤️ by developers who care about performance, SEO, and user experience.**

**⭐ Star this repo if it helped you!**
