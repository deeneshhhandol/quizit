# Quizmify

Quizmify is a modern, interactive quiz platform built with Next.js and TypeScript. It allows users to create, play, and analyze quizzes in multiple formats, with a focus on reliability and user experience.

## Features

- User authentication with NextAuth.js
- Create and customize quizzes (MCQ and open-ended)
- Play quizzes and track your progress
- Detailed statistics and analysis for each quiz
- Fallback questions to ensure quizzes are always available
- Responsive UI with Tailwind CSS

## Tech Stack

- **Framework:** Next.js (TypeScript)
- **Styling:** Tailwind CSS
- **Database:** Prisma ORM with SQLite (development)
- **Authentication:** NextAuth.js
- **APIs:** OpenAI integration (with fallback)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up the database:**
   ```bash
   npx prisma migrate dev --name init
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/app/` - Main application pages and API routes
- `src/components/` - Reusable UI components
- `src/lib/` - Utilities, database, and fallback logic
- `src/schemas/` - Validation schemas
- `prisma/` - Database schema and migrations
- `public/` - Static assets

## Fallback Questions

Quizmify includes a fallback mechanism with categorized questions (general knowledge, programming, science) to ensure quizzes are always available, even if external APIs fail.

## Deployment

Quizmify can be deployed on Vercel or any platform supporting Next.js. See the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## License

MIT

---

Built with ❤️ using Next.js, Prisma, and Tailwind CSS.
