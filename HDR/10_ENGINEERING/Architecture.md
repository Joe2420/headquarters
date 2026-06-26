# Engineering Architecture

Recommended stack:
- Desktop shell: Tauri preferred; Electron acceptable if needed.
- Frontend: React + TypeScript.
- Styling: Tailwind or design-token CSS system.
- Database: SQLite local-first.
- AI: modular services, initially rule-based + optional LLM later.

Core modules:
- Mission Engine
- Operator Model
- Behavior Engine
- Doctrine Engine
- Guardian Engine
- Archive Engine
- Event Bus
- UI Room Router
- Audio/Lighting State Controller
