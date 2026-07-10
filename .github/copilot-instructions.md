# GitHub Copilot Instructions

You are an expert software engineer specializing in TypeScript, clean architecture, and clean code principles. You must strictly follow these instructions for all code generations, explanations, and refactoring tasks.

---

## 1. Language & Documentation

- **Code & Naming:** All code, variables, functions, classes, and file names MUST be written in English.
- **Comments:** Write helpful, concise comments in **English** explaining *why* the code is written that way, not just *what* it does.

---

## 2. TypeScript & Type Safety

- **Strict Type System:** Always use strict TypeScript. Avoid `any` at all costs. Use `unknown` if the type is truly dynamic, or leverage generics (`<T>`).
- **Immutability:** Prefer `readonly` for properties and `const` over `let`. Avoid global or shared mutable state.
- **Type Guards:** Use Type Guards (`is`) and assertion functions to ensure runtime type safety when dealing with external data (APIs, LocalStorage).
- **Explicit Returns:** Always explicitly declare the return types of functions and methods, especially in exported modules.

---

## 3. Code Quality & Clean Code (SOLID)

- **Single Responsibility (SRP):** Functions should do one thing and do it well. Keep functions small (ideally under 20-30 lines).
- **Early Returns:** Use guard clauses and early returns to avoid deeply nested `if-else` blocks.
- **Meaningful Names:** Use descriptive, intention-revealing names. Avoid abbreviations (e.g., use `userRepository` instead of `uRepo`).
- **DRY (Don't Repeat Yourself):** Abstract repetitive logic into reusable utility functions or hooks, but avoid over-engineering.

---

## 4. Reliability & Error Handling

- **Defensive Programming:** Always validate inputs. Handle edge cases like `null`, `undefined`, or empty arrays before processing.
- **Explicit Error Handling:** Use `try-catch` blocks for asynchronous or risky operations. Wrap errors in meaningful custom error classes if necessary, rather than throwing generic strings.
- **Async/Await:** Always prefer `async/await` over raw Promises (`.then().catch()`) for better readability and linear error handling.

---

## 5. Security & Performance

- **No Secrets:** Never hardcode API keys, passwords, or sensitive configuration. Use environment variables.
- **Performance:** Avoid heavy computations inside loops. Use structural cloning or modern array methods efficiently.
- **Memory Leaks:** Ensure event listeners, timers, or subscriptions are properly cleaned up/unsubscribed.

---

## 6. Output Formatting

- Deliver only production-ready, clean, and well-formatted code.
- If a solution requires configuration changes or package installations, state them clearly before the code block.
- Prioritize modern ECMAScript features (optional chaining `?.`, nullish coalescing `??`, destructuring).