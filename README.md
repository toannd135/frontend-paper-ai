# PaperAI — Frontend

Prototype UI for **PaperAI**, an AI research assistant that helps users find academic
sources, analyze them, and assemble a research article — built with mocked/simulated
data (no real backend calls yet).

## Stack

- React 18 + TypeScript + Vite 6
- antd 5 (UI primitives) + lucide-react (icons)
- react-router-dom (client `/` and admin `/admin/*` routes)
- 3d-force-graph + three.js + three-spritetext (3D source-relationship graph)
- Playwright (E2E tests + used interactively via the Playwright MCP server for manual QA)

## Getting started

```bash
npm install
npm run dev       # start the dev server on http://localhost:5173
```

Other scripts:

```bash
npm run build     # tsc -b && vite build
npm run preview   # serve the production build locally
npm run lint      # eslint .
```

## Project structure

```
src/
  client/                  # the main PaperAI app (mounted at "/")
    components/
      article/             # generated-article view: content, table, figure, citations
      chat/                 # chat-driven research flow (questions, progress, bubbles)
      graph/                # 3D source-relationship graph (GraphView + styling helpers)
      Sidebar.tsx, Header.tsx, SourcesPanel.tsx, PaperModal.tsx, ...
    state/                 # AppContext + reducer-based app state (useAppController)
    ClientApp.tsx           # app shell: sidebar + header + workspace + sources panel
  admin/                    # mocked admin dashboard (mounted at "/admin/*")
    pages/                  # Dashboard, Papers, Conversations, Roles, Audit logs, ...
  data/                     # shared mock data (papers, conversations, source relations)
  types.ts                  # shared domain types (ResearchSource, ChatMessage, Stage, ...)
tests/                      # Playwright E2E specs
```

## Key flows

- **Research chat** (`ClientApp` → `ChatView`): submit a topic, answer a few
  clarifying questions, watch sources get found/ranked, then generate an article.
- **Article** (`ArticleView`): the generated paper, styled like an academic article,
  with inline citations, a data table, and a bar-chart figure.
- **Graph** (`GraphView`): once sources exist, a "Graph" tab shows the sources as a
  rotatable 3D force-directed graph (drag to orbit, scroll to zoom), with search,
  type/year/relevance filters, a node detail panel, and keyboard shortcuts (`/`, `+`/`-`,
  `f`, `Esc`, `?`).

All data (papers, citation relationships, chat responses) is mocked in `src/data/mock.ts`
— there is no real API/LLM integration in this prototype.

## Testing

```bash
npx playwright test
```

Specs live in `tests/`. `playwright.config.ts` auto-starts the dev server on port 5173
if it isn't already running.

## Notes

- `.mcp.json` configures the Playwright MCP server used for interactive, agent-driven
  browser testing during development.
- `Claude.md` documents the project's UI/code conventions for AI coding assistants.
