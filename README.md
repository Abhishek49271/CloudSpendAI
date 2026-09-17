# CloudSpendAI

CloudSpendAI is a cloud cost management dashboard with a local-first JARVIS-style AI assistant.

## Tech Stack

- React + Vite
- Spring Boot
- PostgreSQL
- JWT authentication
- BCrypt password hashing
- Ollama + llama3.2

## Project Structure

```text
CloudSpendAI/
├── backend/
├── frontend/
├── README.md
└── README_AI.md
```

## Requirements

- Java 17+
- Maven
- Node.js + npm
- PostgreSQL
- Ollama

## Database Setup

Create a PostgreSQL database named `cloudspend`.

Backend environment variables:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
OLLAMA_URL
OLLAMA_MODEL
```

Defaults:

```text
DB_URL=jdbc:postgresql://localhost:5432/cloudspend
DB_USERNAME=postgres
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

`DB_PASSWORD` and `JWT_SECRET` should be supplied through environment variables or a deployment secret manager.

## Start Ollama

Install Ollama and make sure the model exists:

```powershell
ollama list
ollama run llama3.2
```

Keep the Ollama terminal running while using the local AI assistant.

## Run Backend

```powershell
cd backend
mvn spring-boot:run
```

Backend:

```text
http://localhost:8080
```

## Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## AI Assistant

The authenticated `/api/ai/**` endpoints provide:

```text
POST   /api/ai/chat
GET    /api/ai/history
DELETE /api/ai/history
GET    /api/ai/insights
GET    /api/ai/anomalies
GET    /api/ai/forecast?days=7
GET    /api/ai/health
```

The assistant can:

- hold natural conversations
- remember recent conversation context per user
- answer general-purpose questions
- answer CloudSpend questions using verified PostgreSQL data
- navigate the CloudSpend application
- apply dashboard filters
- clear filters
- refresh dashboard data
- change theme
- change trend range
- open dashboard detail views
- scroll the application
- provide visible action progress
- accept browser voice input
- speak responses using browser speech synthesis

Website actions are controlled by an allow-list. Destructive database operations are not exposed as AI UI actions.

## Authentication

Register:

```text
POST /api/auth/register
```

Login:

```text
POST /api/auth/login
```

Authenticated requests use:

```text
Authorization: Bearer <token>
```

New accounts receive the `USER` role. Administrative operations remain protected by Spring Security.

## Production Builds

Frontend:

```powershell
cd frontend
npm run build
```

Backend:

```powershell
cd backend
mvn clean package
```

The backend JAR is generated under:

```text
backend/target/
```

## Security

Never commit:

- database passwords
- JWT secrets
- API keys
- private credentials

The AI assistant is designed to avoid receiving authentication secrets.

## JARVIS Architecture

```text
User
 ↓
React Assistant
 ↓
Spring Boot AI Layer
 ↓
Ollama / llama3.2
 ↓
 ┌─────────────────────────┐
 │ Conversation + Reasoning│
 │ CloudSpend Data         │
 │ Safe Website Actions   │
 └─────────────────────────┘
 ↓
React live UI
```

The AI provider is configurable through `OLLAMA_URL` and `OLLAMA_MODEL`, while Ollama remains the default local provider.

## Voice

Voice input uses the browser's speech-recognition API when supported.

Voice output uses the browser's speech-synthesis API.

The browser may request microphone permission the first time voice input is used.

## Current Status

- JWT authentication and authorization integrated
- PostgreSQL cost analytics integrated
- Ollama local AI integrated
- persistent chat memory integrated
- AI analytics integrated
- JARVIS-style structured agent responses integrated
- safe website action execution integrated
- visible live agent activity integrated
- browser voice input/output integrated
