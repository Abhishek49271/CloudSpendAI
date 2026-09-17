# CloudSpendAI AI Layer

CloudSpendAI uses a local-first JARVIS-style AI architecture powered by Ollama.

## Provider

Default:

```text
Provider: Ollama
Model: llama3.2
URL: http://localhost:11434
```

Optional environment variables:

```text
OLLAMA_URL
OLLAMA_MODEL
```

This keeps the application provider configuration separate from the assistant logic.

## AI capabilities

- Natural general-purpose conversation
- CloudSpend cost analysis grounded in PostgreSQL
- Persistent per-user conversation memory
- Structured AI responses
- Safe website action planning
- Live frontend action execution
- Browser voice input
- Browser speech output
- Spending insights
- Daily anomaly detection
- Daily-cost forecasting
- Ollama health monitoring

## Chat endpoints

```text
POST   /api/ai/chat
GET    /api/ai/history
DELETE /api/ai/history
GET    /api/ai/insights
GET    /api/ai/anomalies
GET    /api/ai/forecast?days=7
GET    /api/ai/health
```

All AI endpoints require authentication through the existing Spring Security configuration.

## Conversation memory

Chat messages are stored in PostgreSQL in:

```text
ai_chat_messages
```

Messages are separated by the authenticated user's email.

Recent messages are supplied to Ollama using their actual `user` and `assistant` roles instead of flattening the conversation into one prompt.

## Agent actions

The model can request only an allow-listed set of UI actions:

```text
navigate
refresh_dashboard
set_filters
clear_filters
set_theme
set_trend_range
open_focus
scroll
```

The backend validates action types and parameters before returning them to the frontend.

The frontend executes only those known action types.

Destructive database operations are intentionally not exposed as AI actions.

## Live UI

The frontend receives the structured action list and executes actions through the CloudSpend application state.

The assistant also displays an activity panel such as:

```text
CloudSpend AI is working

✓ Opening Cost Analysis...
✓ Applying the requested dashboard filters...
✓ Showing the 7-day trend...
```

Actions are dispatched sequentially so the user can see the assistant working.

## Voice

Voice input uses the browser's speech recognition API when available.

Voice output uses:

```text
window.speechSynthesis
```

The user must grant microphone permission where required by the browser.

## Ollama setup

Install Ollama, then:

```powershell
ollama list
ollama run llama3.2
```

Run the backend:

```powershell
cd backend
mvn spring-boot:run
```

Run the frontend:

```powershell
cd frontend
npm install
npm run dev
```

## Architecture

```text
                   User
                    │
             Text or Voice
                    │
                    ▼
             React Assistant
                    │
                    ▼
            Spring Boot /api/ai
                    │
              ┌─────┴─────┐
              │           │
              ▼           ▼
          Chat Memory   Cost Data
              │           │
              └─────┬─────┘
                    ▼
              Ollama / LLM
                    │
          structured response
          + safe UI actions
                    │
                    ▼
             React action bus
                    │
                    ▼
             Live application
```

## Security principles

- AI requests are authenticated.
- User conversation memory is isolated by authenticated email.
- JWTs and passwords are never sent to Ollama.
- AI UI actions are allow-listed.
- Backend authorization remains authoritative.
- Administrative backend operations remain protected.
- No arbitrary JavaScript or operating-system commands are exposed to the model.
