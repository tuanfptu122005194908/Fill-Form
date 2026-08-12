<div align="center">
  <img src="public/favicon.svg" alt="Fill Form Logo" width="120" />
  <h1>Auto-Fill Form System</h1>
  <p>
    <strong>A full-stack, high-performance automation tool for Google Forms utilizing AI to simulate human-like responses.</strong>
  </p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

<br/>

## 🎯 Overview

**Auto-Fill Form** is an advanced web application designed to automate the process of submitting Google Forms at scale. Built with a modern React stack and powered by Supabase and Groq AI, it can seamlessly extract form structures, dynamically distribute responses (via probabilities or absolute counts), and generate diverse, context-aware text answers that easily bypass manual review processes.

This project demonstrates strong problem-solving skills, deep understanding of web protocols, and modern full-stack development capabilities.

---

## ✨ Key Features

### 🛠 Core Automation (The "Tool")
- **Intelligent Form Parsing**: Extracts and parses the hidden `FB_PUBLIC_LOAD_DATA_` JSON structure from Google Forms HTML, identifying all field types (Text, Checkbox, Multiple Choice, Grid, Scale) and their exact `entry.XXX` IDs.
- **CORS Bypass**: Utilizes Serverless Edge Functions as a proxy to fetch form schemas directly, bypassing browser Cross-Origin Resource Sharing restrictions.
- **Smart Submission Engine**: 
  - Restructures the POST payload to match Google's internal requirements.
  - Dynamically generates `fbzx` tracking tokens and `draftResponse` structures to prevent `HTTP 400 Bad Request` errors.
  - Executes asynchronous `fetch` requests with `no-cors` mode to submit large volumes of data seamlessly.
- **Branching Logic**: Supports conditional response generation (e.g., "If Question 1 is A, then Question 2 must be X").

### 🧠 AI Integration
- **Context-Aware Responses**: Integrates **Groq AI (Llama/Mixtral models)** to auto-generate hundreds of unique, human-like text answers for open-ended questions.
- **Multi-Style Prompts**: Users can configure the AI's tone (Positive, Constructive, Negative, Balanced, Detailed) to simulate a highly diverse user base.

### 💳 Monetization & Wallet System
- **Credit-based System**: Users purchase "credits/runs" to use the automation tool.
- **Automated Top-Ups**: Integrates with **SePay Webhooks** to automatically listen for bank transfers via QR code and credit the user's wallet in real-time.

### 🛡️ Authentication & Administration
- **Supabase Auth**: Secure email/password authentication.
- **Admin Dashboard**: Comprehensive dashboard to monitor system logs, track user form submission history, and manage payment transactions.

---

## 🏗 Architecture & Workflow

1. **Input**: User provides a Google Form URL.
2. **Fetch & Parse**: The React Frontend calls a Supabase Edge Function (`fetch-form`) to retrieve the raw HTML. `formParser.ts` extracts the form's schema.
3. **Configuration**: The user configures response distributions (Percentages or Exact Counts) and generates text answers via AI.
4. **Data Generation**: The application randomizes and constructs the final JSON payload array.
5. **Execution**: The `formSubmitter.ts` iterates through the payload, applying random delays (rate-limiting) and submitting the payloads to Google's servers while simultaneously deducting credits via Supabase RPCs.

---

## 💻 Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui & Radix UI
- **Icons**: Lucide React

### Backend & Database (BaaS)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Serverless**: Supabase Edge Functions (Deno) for fetching forms and processing webhooks.

### Third-Party Services
- **AI Engine**: Groq API
- **Payment Gateway**: SePay

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun
- A Supabase Project
- Groq API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tuanfptu122005194908/Fill-Form.git
   cd Fill-Form
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Deploy Edge Functions** (Optional, requires Supabase CLI)
   ```bash
   supabase functions deploy
   ```

---

<div align="center">
  <p>Built with ❤️ by a passionate Full-Stack Developer.</p>
</div>
