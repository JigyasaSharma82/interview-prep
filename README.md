# AI Interview Prep Kit

An AI-powered interview preparation platform that converts a **Job
Description (JD)**, **company website**, and **number of preparation
days** into a structured, personalized interview preparation kit.

The application researches the company, extracts role requirements from
the JD, generates requirement-focused interview questions and
flashcards, checks requirement coverage deterministically, and creates a
day-by-day preparation schedule.

------------------------------------------------------------------------

## Table of Contents

-   [What the application does](#what-the-application-does)
-   [Main features](#main-features)
-   [How the application works](#how-the-application-works)
-   [Architecture](#architecture)
-   [Tech stack](#tech-stack)
-   [Project structure](#project-structure)
-   [Prerequisites](#prerequisites)
-   [Installation](#installation)
-   [Environment variables](#environment-variables)
-   [Running the application](#running-the-application)
-   [How to use the application](#how-to-use-the-application)
-   [Kit generation pipeline](#kit-generation-pipeline)
-   [Company research](#company-research)
-   [Requirement extraction](#requirement-extraction)
-   [Question generation](#question-generation)
-   [Coverage checking](#coverage-checking)
-   [Schedule generation](#schedule-generation)
-   [Regeneration and editing](#regeneration-and-editing)
-   [Practice mode](#practice-mode)
-   [Authentication and security](#authentication-and-security)
-   [API overview](#api-overview)
-   [Batch evaluation](#batch-evaluation)
-   [Testing](#testing)
-   [Error handling and edge cases](#error-handling-and-edge-cases)
-   [LLM usage](#llm-usage)
-   [Design decisions and trade-offs](#design-decisions-and-trade-offs)
-   [Limitations](#limitations)
-   [Deployment](#deployment)
-   [Development workflow](#development-workflow)

------------------------------------------------------------------------

## What the application does

The user provides:

1.  A pasted job description
2.  A public company URL
3.  The number of days available for interview preparation

For example:

``` text
Job Description:
Senior Backend Engineer
- Node.js
- Express.js
- MongoDB
- REST APIs
- JWT authentication
- Git
...

Company URL:
https://example.com

Days available:
7
```

The application then produces a preparation kit containing:

-   Company brief
-   Company research sources
-   Role title and seniority
-   Responsibilities
-   Stable, categorized requirements
-   Interview questions
-   Answer outlines
-   Difficulty levels
-   Flashcards
-   Deterministic preparation schedule
-   Requirement coverage information

The user can then edit, reorder, pin, delete, regenerate, and practice
the generated material.

------------------------------------------------------------------------

# Main features

## 1. Authentication

Users can:

-   Register
-   Log in
-   Access their authenticated session
-   Access only their own kits
-   Update their own kits
-   Delete their own kits

Passwords are hashed using `bcryptjs` and authentication uses JWT.

------------------------------------------------------------------------

## 2. Create an interview kit

A kit is created from:

``` text
Job Description + Company URL + Days Available
```

The backend runs the complete generation pipeline asynchronously.

Supported preparation duration:

``` text
1–60 days
```

------------------------------------------------------------------------

## 3. Company research

The application crawls the supplied public company website.

It:

-   Validates the external URL
-   Retrieves the homepage
-   Extracts useful internal links
-   Ranks potentially useful pages
-   Retrieves selected pages
-   Cleans page content
-   Uses retrieved content as the basis for the company brief
-   Searches for public interview-process discussions when available

The crawler does not assume that a company has a fixed `/careers` URL.
Useful pages are discovered dynamically through links.

If public interview discussions cannot be found, the kit can still be
generated.

------------------------------------------------------------------------

## 4. Requirement extraction

The job description is converted into structured requirements.

Each requirement has a stable ID such as:

``` json
{
  "id": "r1",
  "text": "Strong experience with Node.js and JavaScript",
  "kind": "technical",
  "priority": "must"
}
```

Requirements are classified as:

-   `technical`
-   `behavioural`
-   `company-fit`
-   other role-relevant categories as appropriate

Priority is:

-   `must`
-   `nice`

The system is designed to avoid inventing requirements that are not
supported by the supplied JD.

------------------------------------------------------------------------

## 5. Interview questions

Questions are linked to requirements.

Example:

``` json
{
  "id": "q1",
  "requirement_ids": ["r1"],
  "category": "technical",
  "prompt": "How would you design a scalable Express.js REST API?",
  "answer_outline": "Discuss routing, validation, middleware, error handling, authentication, and observability.",
  "difficulty": 2
}
```

Question categories include:

-   `technical`
-   `behavioural`
-   `system-design`
-   `company-fit`

Difficulty is an integer from:

``` text
1 = easier
2 = medium
3 = harder
```

------------------------------------------------------------------------

## 6. Requirement coverage

After initial question generation, the application performs a
deterministic coverage check.

The checker compares:

``` text
JD requirements
        ↓
question requirement_ids
```

If a must-have requirement is not covered, additional questions are
generated for the uncovered requirements.

The process repeats up to a bounded number of passes.

A kit is not allowed to complete while must-have requirements remain
uncovered.

Coverage is therefore handled by code rather than trusting the LLM to
decide whether coverage is complete.

------------------------------------------------------------------------

## 7. Deterministic schedule

The schedule allocator is implemented in code.

The LLM does not decide the number of days or perform schedule
arithmetic.

The schedule:

-   Contains exactly the requested number of days
-   Assigns question IDs that exist in the kit
-   Prioritizes must-have requirements
-   Gives harder questions higher priority
-   Distributes questions across available days
-   Calculates integer minutes
-   Ensures must-have requirements appear in the schedule

Example:

``` json
{
  "days_available": 5,
  "days": [
    {
      "day": 1,
      "focus": "Node.js; REST APIs",
      "question_ids": ["q1", "q4"],
      "minutes": 120
    }
  ]
}
```

------------------------------------------------------------------------

## 8. Builder

The Builder allows the user to work with the generated kit instead of
treating AI output as immutable.

Supported editing includes:

-   Edit questions
-   Edit answer outlines
-   Edit flashcards
-   Edit company brief
-   Reorder questions
-   Move questions between categories
-   Add questions
-   Delete questions
-   Pin important questions
-   Regenerate company brief
-   Regenerate a question category
-   Regenerate the schedule

Regeneration is designed to preserve user-controlled content.

------------------------------------------------------------------------

## 9. Practice mode

Practice mode presents one flashcard at a time.

The user can:

1.  See the question/front
2.  Reveal the answer/back
3.  Rate confidence
4.  Continue to the next item

The practice experience can prioritize weaker areas so that
low-confidence material receives more attention.

------------------------------------------------------------------------

# How the application works

The high-level flow is:

``` text
                         ┌──────────────────┐
                         │      User        │
                         └────────┬─────────┘
                                  │
                                  │ JD + company URL + days
                                  ▼
                         ┌──────────────────┐
                         │   Express API    │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
          ┌──────────────────┐        ┌──────────────────┐
          │ Requirement      │        │ Company Research │
          │ Extraction       │        │ / Crawling       │
          └────────┬─────────┘        └────────┬─────────┘
                   │                           │
                   └─────────────┬─────────────┘
                                 ▼
                       ┌──────────────────┐
                       │ Question         │
                       │ Generation       │
                       └────────┬─────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Coverage Checker │
                       │   deterministic  │
                       └────────┬─────────┘
                                │
                     uncovered must requirements?
                                │
                         ┌──────┴──────┐
                         │             │
                        yes            no
                         │             │
                         ▼             │
                Generate extra        │
                questions             │
                         │             │
                         └──────┬──────┘
                                ▼
                       ┌──────────────────┐
                       │   Flashcards     │
                       └────────┬─────────┘
                                ▼
                       ┌──────────────────┐
                       │ Schedule         │
                       │ Allocator        │
                       │ deterministic    │
                       └────────┬─────────┘
                                ▼
                       ┌──────────────────┐
                       │ Kit Validation   │
                       └────────┬─────────┘
                                ▼
                       ┌──────────────────┐
                       │     MongoDB      │
                       └──────────────────┘
```

------------------------------------------------------------------------

# Architecture

The project uses a single repository containing a Next.js frontend and
Node/Express backend.

``` text
Browser
   │
   ▼
Next.js + Tailwind
   │
   ▼
Express REST API
   │
   ├── Authentication
   ├── Kit API
   ├── Research services
   ├── LLM generation services
   ├── Coverage checker
   ├── Schedule allocator
   └── Validation
   │
   ▼
MongoDB
```

The backend intentionally separates:

``` text
retrieval
   ↓
extraction
   ↓
generation
   ↓
coverage
   ↓
scheduling
   ↓
validation
   ↓
persistence
```

This separation makes deterministic parts testable without requiring an
LLM.

------------------------------------------------------------------------

# Tech stack

## Frontend

-   Next.js
-   React
-   Tailwind CSS

## Backend

-   Node.js
-   Express
-   JavaScript (ES modules)

## Database

-   MongoDB
-   Mongoose

## Authentication

-   JWT
-   bcryptjs

## Validation

-   Zod

## LLM

-   Google Gemini
-   `@google/genai`

## Web research

-   Crawlee
-   CheerioCrawler
-   Cheerio
-   PlaywrightCrawler can be used as a fallback for JS-heavy pages

## Testing

-   Vitest

------------------------------------------------------------------------

# Project structure

``` text
ai-interview-prep/
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/
│   │   └── kits/
│   │       ├── new/
│   │       └── [kitId]/
│   │           └── practice/
│   │
│   ├── components/
│   │   ├── auth/
│   │   ├── kit/
│   │   ├── practice/
│   │   └── ui/
│   │
│   └── lib/
│       ├── api.js
│       └── auth.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   │
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Kit.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── kit.routes.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   └── kit.controller.js
│   │   │
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   ├── research/
│   │   │   ├── generation/
│   │   │   ├── coverage/
│   │   │   ├── scheduling/
│   │   │   └── kits/
│   │   │
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── evaluate.js
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── cases/
│   └── sample-cases.json
│
├── README.md
├── .gitignore
└── package.json
```

------------------------------------------------------------------------

# Prerequisites

Install:

-   Node.js
-   npm
-   MongoDB

You also need a Gemini API key for AI generation.

A local MongoDB instance can be used during development, or a MongoDB
deployment can be configured through the environment variables.

------------------------------------------------------------------------

# Installation

Clone the repository:

``` bash
git clone <repository-url>
cd ai-interview-prep
```

Install root dependencies if the root package has dependencies:

``` bash
npm install
```

Install backend dependencies:

``` bash
cd backend
npm install
```

Install frontend dependencies:

``` bash
cd ../frontend
npm install
```

------------------------------------------------------------------------

# Environment variables

Create:

``` text
backend/.env
```

using:

``` text
backend/.env.example
```

Typical configuration:

``` env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://127.0.0.1:27017/ai-interview-prep

JWT_SECRET=your-long-random-secret
FRONTEND_URL=http://localhost:3000

GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=your-supported-gemini-model
```

Never commit the real `.env` file.

The `.env.example` file documents the required variables without
exposing credentials.

------------------------------------------------------------------------

# Running the application

Open two terminals.

## Terminal 1 --- Backend

``` bash
cd backend
npm run dev
```

Expected output:

``` text
MongoDB connected
Server running on http://localhost:5000
```

Health check:

``` text
GET /api/health
```

Expected response:

``` json
{
  "success": true,
  "message": "AI Interview Prep API is running"
}
```

## Terminal 2 --- Frontend

``` bash
cd frontend
npm run dev
```

Open:

``` text
http://localhost:3000
```

------------------------------------------------------------------------

# How to use the application

## Step 1 --- Register

Open the application and create an account.

Provide:

``` text
Name
Email
Password
```

------------------------------------------------------------------------

## Step 2 --- Login

Log in using the registered credentials.

Protected pages and kit APIs require authentication.

------------------------------------------------------------------------

## Step 3 --- Create a kit

Open:

``` text
New Kit
```

Enter:

### Job description

Paste the complete job description.

For best results, include:

-   Role title
-   Responsibilities
-   Required qualifications
-   Nice-to-have qualifications
-   Location

### Company URL

Provide a public company website.

Example:

``` text
https://stripe.com
```

### Days available

Choose a value from:

``` text
1 to 60
```

Submit the form.

------------------------------------------------------------------------

## Step 4 --- Wait for generation

The backend processes the kit through multiple stages.

Typical stages include:

``` text
queued
requirements
research
questions
coverage-questions
flashcards
schedule
validation
completed
```

If generation fails, the kit records the failed stage and error instead
of silently producing an invalid kit.

------------------------------------------------------------------------

## Step 5 --- Review the Builder

Once generation completes, open the kit.

Review:

-   Company brief
-   Interview process research
-   Role information
-   Requirements
-   Questions
-   Flashcards
-   Schedule
-   Coverage

------------------------------------------------------------------------

## Step 6 --- Edit the generated content

AI output is editable.

For example, you can modify:

``` text
Question prompt
Answer outline
Flashcard front
Flashcard back
Company brief
```

Use pinning for questions that should be protected during regeneration.

------------------------------------------------------------------------

## Step 7 --- Regenerate content

### Regenerate company brief

This refreshes the company research and company brief.

It should preserve:

-   Questions
-   Flashcards
-   Schedule
-   Role
-   Requirements
-   User edits/pins

If research fails, an existing valid company brief should not be
replaced with fabricated information.

### Regenerate a question category

For example:

``` text
Regenerate Technical
```

Only eligible questions in that category are replaced.

Pinned/protected questions remain unchanged.

Questions belonging to other categories are not intentionally
regenerated.

New questions receive stable IDs.

### Regenerate schedule

The deterministic scheduler runs again using the current requirements
and questions.

No LLM is required for schedule arithmetic.

------------------------------------------------------------------------

# Kit data structure

The generated kit follows this structure:

``` json
{
  "source": {
    "company": "",
    "company_url": "",
    "role": "",
    "location": "",
    "jd_chars": 0,
    "researched_at": "",
    "pages_used": []
  },
  "company_brief": {
    "summary": "",
    "what_they_do": "",
    "sources": []
  },
  "role": {
    "title": "",
    "seniority": "",
    "responsibilities": [],
    "requirements": [
      {
        "id": "r1",
        "text": "",
        "kind": "technical",
        "priority": "must"
      }
    ]
  },
  "questions": [
    {
      "id": "q1",
      "requirement_ids": ["r1"],
      "category": "technical",
      "prompt": "",
      "answer_outline": "",
      "difficulty": 2
    }
  ],
  "flashcards": [
    {
      "id": "f1",
      "front": "",
      "back": "",
      "requirement_ids": ["r1"]
    }
  ],
  "schedule": {
    "days_available": 5,
    "days": [
      {
        "day": 1,
        "focus": "",
        "question_ids": ["q1"],
        "minutes": 60
      }
    ]
  },
  "coverage": {
    "uncovered_requirement_ids": [],
    "passes": 2
  }
}
```

------------------------------------------------------------------------

# Kit generation pipeline

The generation pipeline deliberately uses multiple steps instead of
asking the LLM to generate the entire kit in one prompt.

## 1. Extract requirements

Input:

``` text
Job Description
```

Output:

``` text
Role + responsibilities + requirements
```

------------------------------------------------------------------------

## 2. Research company

Input:

``` text
Company URL
```

The crawler:

1.  Validates the URL
2.  Retrieves the homepage
3.  Extracts internal links
4.  Ranks useful links
5.  Retrieves selected pages
6.  Cleans page content
7.  Performs public interview-process research where possible

------------------------------------------------------------------------

## 3. Generate questions

Questions are generated from the extracted requirements.

Each generated question must reference an existing requirement.

------------------------------------------------------------------------

## 4. Check coverage

The deterministic checker identifies must-have requirements without
question coverage.

Example:

``` text
Requirements:

r1 Node.js        → covered
r2 Express.js      → covered
r3 MongoDB         → covered
r4 JWT             → NOT covered
```

The system then generates additional questions for `r4`.

------------------------------------------------------------------------

## 5. Generate flashcards

Flashcards are created from the requirements for fast revision.

------------------------------------------------------------------------

## 6. Allocate schedule

The scheduler receives:

``` text
requirements
questions
days
```

and creates the requested number of days.

------------------------------------------------------------------------

## 7. Validate the complete kit

Before persistence, the generated kit is structurally validated.

Validation includes:

-   Stable IDs
-   Valid requirement references
-   Valid question categories
-   Difficulty range
-   Schedule day count
-   Valid schedule question IDs
-   Coverage state
-   Required kit structure

Only a valid kit should be saved as completed.

------------------------------------------------------------------------

# Company research

Company research is intentionally separate from question generation.

The crawler uses:

``` text
Crawlee + CheerioCrawler
```

for normal HTML pages.

Cheerio is used to parse and clean HTML.

For JavaScript-heavy websites, a Playwright-based crawler can be used as
a fallback where required.

## Link discovery

The system does not assume:

``` text
/careers
```

or:

``` text
/jobs
```

exists.

Instead, it extracts internal links and ranks links using useful
concepts such as:

``` text
careers
jobs
hiring
join
about
company
engineering
interview
```

The exact URL is discovered from the website.

## Public interview-process research

The research pipeline also attempts to find public discussions about the
company's interview process.

Potential sources include public:

-   Discussion pages
-   Forums
-   Reddit
-   Interview-review pages
-   Engineering blogs
-   Other publicly accessible sources

This information is supplementary.

If no useful public discussion is found, company research should still
be able to continue.

The application must never invent interview-process information.

------------------------------------------------------------------------

# Requirement extraction

Requirement extraction uses structured LLM output validated with Zod.

The prompt instructs the model to stay grounded in the supplied JD.

The system should not manufacture technologies, years of experience,
responsibilities, or qualifications that are not supported by the input.

This is particularly important for thin JDs.

For example, if a JD only contains:

``` text
Looking for a backend engineer with Node.js experience.
```

the system should not automatically invent:

``` text
MongoDB
AWS
Docker
Kubernetes
Redis
```

unless those are actually present in the JD.

------------------------------------------------------------------------

# Question generation

Question generation uses structured output.

The raw LLM output is normalized before entering the kit.

The normalizer ensures that a generated question contains a valid:

``` text
requirement_id
```

and converts it to the canonical kit representation:

``` json
{
  "requirement_ids": ["r1"]
}
```

The question must reference a requirement that actually exists.

This protects the deterministic coverage and scheduling layers from
malformed LLM output.

------------------------------------------------------------------------

# Coverage checking

Coverage is deterministic.

The checker does not ask the LLM:

``` text
"Are all requirements covered?"
```

Instead it uses requirement IDs.

For example:

``` text
r1 → q1
r2 → q2, q4
r3 → q3
```

If:

``` text
r4
```

is a must-have requirement but does not appear in any question's
`requirement_ids`, it is uncovered.

The generation pipeline then attempts to create additional questions for
that requirement.

------------------------------------------------------------------------

# Schedule generation

Schedule allocation is deliberately deterministic.

The allocator:

1.  Identifies must-have requirements
2.  Sorts questions by requirement priority and difficulty
3.  Places must-have coverage early
4.  Distributes remaining questions
5.  Calculates minutes
6.  Builds daily focus text

The requested number of days is respected exactly.

For example:

``` text
days = 3
```

produces:

``` text
day 1
day 2
day 3
```

even when there are relatively few questions.

------------------------------------------------------------------------

# Regeneration and editing

Regeneration is different from initial generation.

The goal is:

``` text
AI-generated content
        +
user-controlled content
        ↓
safe regeneration
```

User-controlled content must not be casually overwritten.

## Protected questions

Questions can be protected/pinned.

When a category is regenerated:

``` text
Pinned question
     ↓
preserved

Unpinned generated question
     ↓
eligible for replacement
```

The regeneration process also performs duplicate checks.

If additional questions are required for coverage, the system can
perform bounded additional generation attempts.

------------------------------------------------------------------------

# Practice mode

Practice mode is designed for active recall.

A typical session:

``` text
Question / Flashcard
        ↓
Think
        ↓
Reveal answer
        ↓
Confidence rating
        ↓
Next item
```

Confidence can be used to prioritize weaker material.

A simple deterministic ordering can prioritize:

1.  Lower confidence
2.  Must-have requirements
3.  Higher difficulty
4.  Less recently practiced items
5.  Stable ID as a tie-breaker

------------------------------------------------------------------------

# Authentication and security

## Password security

Passwords are hashed using `bcryptjs`.

Plain-text passwords are never stored.

## JWT authentication

Authenticated requests use:

``` text
Authorization: Bearer <token>
```

The backend verifies the token before accessing protected resources.

## Ownership

A kit is always accessed in the context of its authenticated owner.

Users should not be able to retrieve, update, or delete another user's
kit simply by changing the kit ID.

## External URL security

Company URLs are treated as untrusted external input.

The application validates URLs and should reject private/loopback
destinations in production.

Research fetching should also enforce reasonable:

-   Content-type restrictions
-   Response-size limits
-   Timeouts
-   Retry limits

Fetched website content is treated as **untrusted data**, not as
instructions to the application or LLM.

------------------------------------------------------------------------

# API overview

Base URL during local development:

``` text
http://localhost:5000/api
```

## Health

``` http
GET /api/health
```

------------------------------------------------------------------------

## Authentication

### Register

``` http
POST /api/auth/register
```

### Login

``` http
POST /api/auth/login
```

### Current user

``` http
GET /api/auth/me
```

Requires authentication.

------------------------------------------------------------------------

## Kits

### Create kit

``` http
POST /api/kits
```

Body:

``` json
{
  "jd": "Job description...",
  "company_url": "https://example.com",
  "days": 7
}
```

### List user's kits

``` http
GET /api/kits
```

### Get kit

``` http
GET /api/kits/:kitId
```

### Update kit

``` http
PATCH /api/kits/:kitId
```

### Delete kit

``` http
DELETE /api/kits/:kitId
```

------------------------------------------------------------------------

## Regeneration

### Company brief

``` http
POST /api/kits/:kitId/regenerate/company-brief
```

### Question category

``` http
POST /api/kits/:kitId/regenerate/questions/:category
```

Example:

``` http
POST /api/kits/:kitId/regenerate/questions/technical
```

### Schedule

``` http
POST /api/kits/:kitId/regenerate/schedule
```

All protected endpoints require authentication.

------------------------------------------------------------------------

# Batch evaluation

The project supports the required batch entry point:

``` bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

Example:

``` bash
npm run evaluate -- --input cases/sample-cases.json --output kits.json
```

Input format:

``` json
[
  {
    "id": "case-1",
    "jd": "Senior Backend Engineer...",
    "company_url": "https://example.com",
    "days": 7
  },
  {
    "id": "case-2",
    "jd": "Frontend Engineer...",
    "company_url": "https://example.org",
    "days": 5
  }
]
```

Output format:

``` json
{
  "version": "1.0",
  "generated_at": "2026-09-10T00:00:00.000Z",
  "kits": [
    {
      "id": "case-1",
      "status": "completed",
      "kit": {}
    },
    {
      "id": "case-2",
      "status": "failed",
      "kit": null,
      "error": "..."
    }
  ]
}
```

A failure in one case should not prevent the remaining cases from being
processed.

The evaluator uses the same generation pipeline as the application
rather than maintaining a separate implementation.

------------------------------------------------------------------------

# Testing

Run backend tests:

``` bash
cd backend
npm test
```

Watch mode:

``` bash
npm run test:watch
```

The project includes tests for important deterministic and validation
behavior, including:

-   Coverage checker
-   Schedule allocator
-   Kit validator
-   Request schemas

Additional tests should cover regeneration, duplicate handling,
protected questions, practice prioritization, and batch evaluation as
those features evolve.

------------------------------------------------------------------------

# Error handling and edge cases

The application is designed to handle:

## Invalid company URL

The request is rejected through validation.

## 404 / unreachable website

Research fails gracefully.

The application should not invent company information.

## No hiring page

This is not a fatal error.

The company research can still use other retrieved pages.

## No public interview discussion

This is not a fatal error.

The application continues using available company research.

## Thin JD

The output should remain thin and honest.

The LLM should not manufacture requirements.

## Invalid LLM JSON

Structured output is validated and malformed output should not be
silently persisted.

## Rate limiting

LLM/API calls should use bounded retries and backoff where appropriate.

## Duplicate submissions

Kit generation uses a generation key and generation state to reduce
duplicate concurrent generation.

## Long-running generation

Generation progress is represented through stages/status so the frontend
can distinguish:

``` text
generating
completed
failed
```

## Double regeneration

Regeneration operations should be handled so that concurrent requests do
not unnecessarily corrupt the saved kit.

------------------------------------------------------------------------

# LLM usage

Google Gemini is used for tasks where semantic generation is useful:

-   Requirement extraction
-   Company brief generation
-   Interview question generation
-   Flashcard generation

The LLM is **not** trusted for deterministic application logic.

For example, the LLM does not decide:

``` text
How many schedule days exist?
```

The backend does.

The LLM does not decide:

``` text
Whether requirement r4 is covered
```

The deterministic coverage checker does.

This separation makes the application more predictable and testable.

## Structured output

LLM responses are expected to follow structured schemas and are
validated before entering the main kit.

This reduces the chance that malformed AI output propagates into:

-   coverage
-   scheduling
-   persistence
-   frontend rendering

------------------------------------------------------------------------

# Design decisions and trade-offs

## Why separate research from generation?

Company research and JD extraction are retrieval/extraction problems,
while question and flashcard creation are generation problems.

Separating them allows:

-   Better debugging
-   Clearer source provenance
-   Easier testing
-   Better failure handling
-   Less dependence on one large prompt

------------------------------------------------------------------------

## Why deterministic coverage?

An LLM can claim that a requirement is covered even when the generated
question is only loosely related.

Using stable requirement IDs makes coverage deterministic.

------------------------------------------------------------------------

## Why deterministic scheduling?

Schedule arithmetic should be predictable.

The same:

``` text
requirements + questions + days
```

should produce a consistent schedule.

It also makes automated evaluation easier.

------------------------------------------------------------------------

## Why Crawlee?

The assessment requires actual company-site crawling and dynamic link
discovery.

Crawlee provides a crawler abstraction while allowing different
page-processing strategies.

CheerioCrawler is efficient for normal HTML pages, while
PlaywrightCrawler is useful for JavaScript-heavy pages.

------------------------------------------------------------------------

## Why MongoDB?

The kit is naturally document-oriented.

A kit contains nested:

``` text
source
company_brief
role
requirements
questions
flashcards
schedule
coverage
```

MongoDB allows this structure to be persisted without splitting every
generated item into separate relational tables.

------------------------------------------------------------------------

## Why preserve user edits?

AI-generated material is a starting point, not the final source of
truth.

A user may:

-   Correct an answer
-   Add personal experience
-   Rewrite a question
-   Pin an important question
-   Delete irrelevant content

Regeneration should not erase that work.

------------------------------------------------------------------------

# Limitations

## LLM quota

Free-tier LLM APIs may have request and rate limits.

A full kit generation can involve several LLM calls:

``` text
requirements
company brief
questions
coverage follow-up questions
flashcards
```

Therefore production use should account for provider quotas, retries,
and cost.

------------------------------------------------------------------------

## Website variability

Company websites differ significantly.

Some are:

-   Static HTML
-   JavaScript-heavy
-   protected by bot mitigation
-   slow
-   poorly linked
-   inaccessible to automated crawlers

No crawler can guarantee successful extraction from every public
website.

------------------------------------------------------------------------

## Public interview discussions

Public interview-process information may not exist for every company or
role.

The system therefore treats this as supplementary research rather than a
mandatory generation dependency.

------------------------------------------------------------------------

## Generated question quality

LLM output can occasionally be overly generic or insufficiently
grounded.

The application therefore combines:

``` text
LLM generation
+
structured validation
+
requirement IDs
+
deterministic coverage
+
user editing
```

rather than assuming generated content is always perfect.

------------------------------------------------------------------------

# Deployment

The application requires deployment of both:

``` text
Frontend
Backend
```

The backend requires production environment variables for:

-   MongoDB
-   JWT secret
-   Gemini API key
-   frontend origin

The frontend must be configured to call the deployed backend rather
than:

``` text
localhost:5000
```

Production deployment should also enforce secure CORS configuration and
external URL protections.

------------------------------------------------------------------------

# Development workflow

A recommended development workflow is:

## 1. Start MongoDB

Make sure MongoDB is available.

## 2. Start backend

``` bash
cd backend
npm run dev
```

## 3. Start frontend

``` bash
cd frontend
npm run dev
```

## 4. Check health

``` text
GET /api/health
```

## 5. Register/login

Create an authenticated session.

## 6. Create a small test kit

Use a manageable JD and a reachable company website.

## 7. Inspect generation stages

Watch backend logs for:

``` text
requirements
research
questions
coverage
flashcards
schedule
validation
```

## 8. Test Builder

Verify:

-   Editing
-   Reordering
-   Pinning
-   Deleting
-   Adding
-   Regeneration

## 9. Test practice

Verify:

-   Reveal
-   Confidence
-   Next item
-   Weak-area prioritization

## 10. Run tests

``` bash
cd backend
npm test
```

## 11. Build frontend

``` bash
cd frontend
npm run build
```

## 12. Run batch evaluation

``` bash
npm run evaluate -- --input cases/sample-cases.json --output kits.json
```

------------------------------------------------------------------------

# Important implementation principles

The project follows these principles:

### 1. Do not invent source information

Website and public discussion claims must be based on retrieved sources.

### 2. Treat fetched web content as untrusted

Website text must never be treated as application instructions.

### 3. Validate AI output

LLM output must be normalized and schema-validated before persistence.

### 4. Keep deterministic logic in code

Coverage, schedule arithmetic, IDs, validation, and ownership checks
should not depend on LLM decisions.

### 5. Preserve user work

Regeneration must respect protected and user-edited content.

### 6. Fail gracefully

A missing hiring page or missing public interview discussion should not
unnecessarily prevent a kit from being generated.

### 7. Keep the batch pipeline reusable

The CLI evaluator should use the same generation pipeline as the
application.

------------------------------------------------------------------------

# Summary

The application turns:

``` text
Job Description
      +
Company Website
      +
Preparation Days
```

into:

``` text
Company Research
      +
Role Requirements
      +
Interview Questions
      +
Answer Outlines
      +
Flashcards
      +
Coverage Validation
      +
Preparation Schedule
      ↓
Interview Prep Kit
```

The main design goal is to combine the flexibility of an LLM with
deterministic application logic.

AI handles semantic tasks such as:

``` text
"What requirements does this JD describe?"
"What questions should I practice?"
"What is this company about?"
```

Code handles correctness-sensitive tasks such as:

``` text
"Is every must-have requirement covered?"
"How many schedule days should exist?"
"Are these question IDs valid?"
"Does this user own this kit?"
"Is this generated kit structurally valid?"
```

This keeps the system explainable, testable, and safer to regenerate and
edit.
