# Client Architecture — Next.js Frontend

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (providers stack)
│   ├── page.tsx            # Home redirect
│   ├── not-found.tsx
│   ├── globals.css
│   ├── actions/            # Next.js Server Actions
│   ├── admin/              # Admin panel routes
│   ├── faq/                # FAQ page
│   ├── gioi-thieu/         # About page
│   ├── ky-gui/             # Consignment form flow
│   └── trang-chu/          # Homepage
├── components/
│   ├── ui/                 # shadcn/ui primitives (DO NOT modify directly)
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── app-sidebar.tsx
│   └── parallaxHome.tsx
├── context/                # React Context providers
│   ├── DictionaryProvider.tsx
│   ├── LocaleProvider.tsx
│   ├── QueryClientProviderWrapper.tsx
│   └── ThemeProvider.tsx
├── hooks/                  # Custom hooks
│   ├── debounce.ts
│   ├── use-mobile.ts
│   └── useScreenWidth.ts
├── lib/
│   ├── axiosBase.ts        # Axios factory — use createAxiosInstance()
│   ├── constants.ts        # API_ENDPOINTS, KEY_STORE, OBJECTID_*, TIME_BOOKING
│   ├── get-dictionary.ts   # i18n dictionary loader
│   ├── i18n.ts
│   ├── store.ts
│   └── utils.ts            # cn() tailwind merge helper
├── store/
│   ├── globalStore.ts      # Zustand: searchQuery
│   └── useAppStore.ts
├── types/
│   └── enums.ts
├── dictionaries/
│   ├── vi.json             # Vietnamese translations
│   └── en.json             # English translations
├── actions/
│   └── card.ts             # Server actions
└── middleware.ts           # Next.js middleware (auth/locale)
```

## Root Layout — Providers Order

```
ReactFlowProvider
  └── DictionaryProvider (i18n dict)
        └── LocaleProvider
              └── TooltipProvider
                    └── ThemeProvider (next-themes, default: "light")
                          ├── ParallaxHome
                          ├── Header
                          └── main > {children}
```

## State Management

- **Zustand** (`globalStore.ts`): client-side UI state (searchQuery, etc.)
- **TanStack Query**: server state, caching, API calls
- **React Hook Form + Zod**: form state & validation

## Routing Convention

- Vietnamese slugs: `/ky-gui`, `/trang-chu`, `/gioi-thieu`
- Admin routes: `/admin/*`
- Default locale: `vi` (set in `src/lib/get-dictionary.ts` as `DEFAULT_LOCALE`)

## Component Guidelines

- **shadcn/ui** components live in `src/components/ui/` — generated via CLI, don't edit
- Use `cn()` from `src/lib/utils.ts` for conditional Tailwind classes
- **Radix UI** for public-facing pages
- **antd** only for admin panel
- New page components go in `src/app/{route}/page.tsx`
- Shared reusable components go in `src/components/`

## HTTP Calls Pattern

```ts
// Always use createAxiosInstance, never raw axios
import { createAxiosInstance } from '@/lib/axiosBase';
const api = createAxiosInstance({ authType: 'bearer' });
const res = await api.get(API_ENDPOINTS.PRODUCT);
```

## i18n Pattern

```ts
// Server components: use getDictionary()
const dict = await getDictionary(locale);

// Client components: use react-i18next useTranslation()
const { t } = useTranslation('common');
```

## Image Path Alias

```ts
// tsconfig paths alias for images
import logo from '@images/favicon.png'; // maps to public/images/
```
