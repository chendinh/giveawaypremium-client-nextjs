# Coding Conventions & Dependency Map

## Active Dependencies (actually used in src/)

### UI / Components

| Package        | Used in                                                                 | Notes                                      |
| -------------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| `antd`         | `src/app/gioi-thieu/page.tsx`, `src/app/ky-gui/BookingForm/index-1.tsx` | Public pages — consider migrating to Radix |
| `@radix-ui/*`  | `src/components/ui/` (shadcn/ui)                                        | Primary UI library for public pages        |
| `lucide-react` | Throughout                                                              | Icons                                      |
| `sonner`       | `layout.tsx`                                                            | Toast notifications                        |

### Flow / Diagram

| Package         | Used in                          | Notes                                 |
| --------------- | -------------------------------- | ------------------------------------- |
| `@xyflow/react` | `layout.tsx` (ReactFlowProvider) | **Use this** — NOT `reactflow`        |
| `reactflow`     | NOT used directly                | Legacy — `@xyflow/react` is successor |

### Animation

| Package        | Used in                                                             | Notes        |
| -------------- | ------------------------------------------------------------------- | ------------ |
| `react-lottie` | `ky-gui/BookingForm`, `trang-chu/HomeCarousel`, `admin/Consignment` | Active usage |

### Charts (admin only)

| Package                        | Used in               |
| ------------------------------ | --------------------- |
| `chart.js` + `react-chartjs-2` | `admin/SummaryScreen` |

### Date / Time (admin only)

| Package    | Used in                    | Notes                                    |
| ---------- | -------------------------- | ---------------------------------------- |
| `moment`   | All admin table components | Heavy — consider `date-fns` for new code |
| `date-fns` | Already installed          | **Prefer this for new code**             |

### Print / QR (admin only)

| Package          | Used in                           |
| ---------------- | --------------------------------- |
| `react-to-print` | `TagPrintBox`, `TagPrintBoxMulti` |
| `qrcode`         | `TagQrcode`                       |

### Forms & Validation

| Package               | Usage             |
| --------------------- | ----------------- |
| `react-hook-form`     | All forms         |
| `zod` v4              | Schema validation |
| `@hookform/resolvers` | Bridge RHF + Zod  |

### State & Data

| Package                    | Usage                              |
| -------------------------- | ---------------------------------- |
| `zustand` v5               | Global UI state (`globalStore.ts`) |
| `@tanstack/react-query` v4 | Server state, API caching          |
| `axios`                    | HTTP via `createAxiosInstance()`   |

### i18n

| Package                            | Usage                    |
| ---------------------------------- | ------------------------ |
| `i18next` + `react-i18next`        | Client-side translations |
| `next-i18next`                     | SSR translations         |
| `i18next-browser-languagedetector` | Auto-detect locale       |

### Carousel

| Package                                            | Used in                 |
| -------------------------------------------------- | ----------------------- |
| `embla-carousel-react` + `embla-carousel-autoplay` | Carousels               |
| `react-image-gallery`                              | Product image galleries |

---

## Unused / Questionable Dependencies

| Package                     | Status                             | Recommendation                           |
| --------------------------- | ---------------------------------- | ---------------------------------------- |
| `reactflow` (old)           | `@xyflow/react` is the replacement | Remove when `reactflow` imports are gone |
| `dagre`                     | No imports found in src/           | Safe to remove                           |
| `@openzeppelin/merkle-tree` | No imports found in src/           | Remove — blockchain lib, unrelated       |
| `i` (npm package)           | Utility, rarely needed             | Remove if not used                       |

---

## File Naming Conventions

- Pages: `src/app/{route}/page.tsx`
- Components: `PascalCase.tsx`
- Hooks: `use{Name}.ts` (camelCase)
- Utils/lib: `camelCase.ts`
- Constants: `SCREAMING_SNAKE_CASE` for values, `camelCase` for files

## TypeScript Rules

- Prefer `interface` over `type` for object shapes
- Use `const` assertions for constant objects: `as const`
- Always type function return values on public APIs
- Avoid `any` — use `unknown` + type narrowing

## Import Order (enforced by ESLint + Prettier)

1. React/Next.js imports
2. Third-party packages
3. Internal `@/` aliases
4. Relative imports

## Tailwind Usage

```ts
// Always use cn() for conditional classes
import { cn } from '@/lib/utils';
<div className={cn('base-class', isActive && 'active-class', className)} />
```

## New Feature Checklist

- [ ] Add translations to `src/dictionaries/vi.json` AND `en.json`
- [ ] Use `createAxiosInstance()` for API calls, not raw `axios`
- [ ] Use `API_ENDPOINTS` constants, not hardcoded strings
- [ ] Soft-delete only: set `deletedAt`, never `DELETE /classes/...`
- [ ] Use `date-fns` for new date formatting (not `moment`)
- [ ] shadcn/ui components for UI (not raw Radix or antd on public pages)
