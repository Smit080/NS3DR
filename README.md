# NS3DR Automation — Stock Control

A stock/inventory web app for NS3DR Automation (CNC router components). Built with React + Vite, backed by Supabase (Postgres) so data is shared and persistent across devices.

## Project structure

```
ns3dr-inventory/
├── .env.example          # copy to .env and fill in your Supabase keys
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx            # top-level state, view routing + wiring
    ├── api.js             # all Supabase queries live here
    ├── supabaseClient.js  # Supabase client setup
    ├── utils.js           # buildable-machine-count calculation
    ├── styles.css
    ├── components/
    │   ├── Header.jsx
    │   ├── Toolbar.jsx
    │   ├── ComponentGrid.jsx
    │   ├── ComponentCard.jsx
    │   ├── ComponentFormModal.jsx   # create + edit component
    │   ├── StockModal.jsx           # add + remove stock (mode prop)
    │   ├── DetailsModal.jsx
    │   ├── CategoryManagerModal.jsx
    │   ├── MachineFormModal.jsx     # create + edit machine
    │   ├── ActivityLog.jsx
    │   └── Toast.jsx
    └── pages/
        ├── AllComponentsPage.jsx    # "Show all" screen — search/category/low-stock filters, edit
        ├── MachinesPage.jsx         # list of machines with buildable counts
        └── MachineDetailPage.jsx    # edit machine + manage its bill of materials
```

## 1. Install dependencies

```bash
cd ns3dr-inventory
npm install
```

## 2. Create your Supabase project

1. Go to https://supabase.com, create a new project (or use an existing one).
2. In the project dashboard, open the **SQL Editor** and run the schema below.
3. Go to **Settings → API** and copy the **Project URL** and the **anon public** key.

## 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

Never commit `.env` — it's already in `.gitignore`.

## 4. Run it

```bash
npm run dev
```

Open http://localhost:5173

## 5. Deploy online

Any static host works since this is a Vite build (Vercel, Netlify, Cloudflare Pages, etc.):

```bash
npm run build
```

This produces a `dist/` folder — deploy that. Set the same two `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` environment variables in your hosting provider's dashboard (not just locally), since Vite reads them at build time.

---

## Supabase schema — tables to create

Run this in Supabase's **SQL Editor** exactly once. It creates 5 tables: `categories`, `components`, `stock_transactions`, `machines`, `machine_components`.

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- 1) Categories — component types (Spindle Motor, Stepper Motor, etc.)
--    You manage these yourself from the app (add / rename / delete).
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- 2) Components — one row per part tracked in inventory
create table components (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category_id uuid references categories(id) on delete set null,
  part_no text,
  quantity numeric not null default 0,
  unit text default 'pcs',
  min_threshold numeric default 2,
  location text,
  machine text,
  supplier text,
  notes text,
  created_at timestamptz not null default now()
);

-- 3) Stock transactions — every add/remove movement, with required
--    reason on removal (which machine/job it went to) and who did it
create table stock_transactions (
  id uuid primary key default uuid_generate_v4(),
  component_id uuid references components(id) on delete cascade,
  type text not null check (type in ('add','remove')),
  quantity numeric not null,
  note text,
  performed_by text,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index idx_components_category on components(category_id);
create index idx_transactions_component on stock_transactions(component_id);
create index idx_transactions_created on stock_transactions(created_at desc);

-- 4) Machines — machine models NS3DR builds (e.g. NS3DR-1325)
create table machines (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- 5) Machine components — the bill of materials: which components
--    (and how many of each) go into one unit of a given machine
create table machine_components (
  id uuid primary key default uuid_generate_v4(),
  machine_id uuid not null references machines(id) on delete cascade,
  component_id uuid not null references components(id) on delete cascade,
  quantity_required numeric not null default 1,
  created_at timestamptz not null default now(),
  unique (machine_id, component_id)
);

create index idx_machine_components_machine on machine_components(machine_id);
create index idx_machine_components_component on machine_components(component_id);
```

### Migration (if you already created categories/components/stock_transactions before)

Run just the new pieces instead of the whole block above:

```sql
alter table stock_transactions add column performed_by text;

create table machines (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table machine_components (
  id uuid primary key default uuid_generate_v4(),
  machine_id uuid not null references machines(id) on delete cascade,
  component_id uuid not null references components(id) on delete cascade,
  quantity_required numeric not null default 1,
  created_at timestamptz not null default now(),
  unique (machine_id, component_id)
);

create index idx_machine_components_machine on machine_components(machine_id);
create index idx_machine_components_component on machine_components(component_id);
```

### Field reference

**categories**
| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key, auto |
| name | text | unique, required — e.g. "Stepper Motor" |
| created_at | timestamptz | auto |

**components**
| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key, auto |
| name | text | required — e.g. "NEMA 23 Stepper Motor" |
| category_id | uuid | FK → categories.id |
| part_no | text | optional SKU/part number |
| quantity | numeric | current stock on hand |
| unit | text | pcs / sets / meters / rolls / boxes / pairs |
| min_threshold | numeric | below this = "low stock" badge |
| location | text | e.g. "Rack B-3" |
| machine | text | which NS3DR machine model(s) it fits |
| supplier | text | vendor name |
| notes | text | free text — specs, voltage, size |
| created_at | timestamptz | when the component was first added |

**stock_transactions**
| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key, auto |
| component_id | uuid | FK → components.id |
| type | text | `add` or `remove` |
| quantity | numeric | how many units moved |
| note | text | for `add`: source/PO reference (optional). For `remove`: **required** — which machine/job it was used for |
| performed_by | text | **required** — name of the person who added or removed the stock |
| created_at | timestamptz | recorded automatically |

**machines**
| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key, auto |
| name | text | required — e.g. "NS3DR-1325" |
| description | text | optional notes about the model |
| created_at | timestamptz | auto |

**machine_components** (bill of materials — one row per component used in one machine)
| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key, auto |
| machine_id | uuid | FK → machines.id |
| component_id | uuid | FK → components.id |
| quantity_required | numeric | how many units of this component one machine needs |
| created_at | timestamptz | auto |

### Row Level Security (RLS)

By default Supabase enables RLS once you turn it on, which blocks all access until you add policies. For a quick internal tool, the simplest option is to leave RLS **off** for all five tables (this app currently uses the public `anon` key with no login screen, so anyone with the URL + anon key can read/write).

If you want it locked down before going fully public, run this instead of leaving RLS off, and add real user authentication later:

```sql
alter table categories enable row level security;
alter table components enable row level security;
alter table stock_transactions enable row level security;
alter table machines enable row level security;
alter table machine_components enable row level security;

create policy "public read/write categories" on categories for all using (true) with check (true);
create policy "public read/write components" on components for all using (true) with check (true);
create policy "public read/write stock_transactions" on stock_transactions for all using (true) with check (true);
create policy "public read/write machines" on machines for all using (true) with check (true);
create policy "public read/write machine_components" on machine_components for all using (true) with check (true);
```

This keeps behavior identical to RLS-off but makes the policy explicit — swap `using (true)` for real auth checks (e.g. `auth.uid() is not null`) once you add login.

## Notes on how it works

- **Categories** are fully dynamic — add, rename, or delete from **Manage categories** in the toolbar. Deleting a category that's in use sets those components to "Uncategorized" rather than deleting them.
- **Add stock** records a `stock_transactions` row with `type = 'add'`, who did it, and an optional source note, timestamped automatically.
- **Remove stock** requires both "removed by" and "used for / machine" before it will save — enforced in `StockModal.jsx`.
- Every component's **View details & history** shows its full add/remove trail pulled from `stock_transactions`. From the same screen you can edit a component's details (quantity itself is locked there — change it via Add/Remove stock so history stays accurate).
- **Home screen** only previews up to 5 components. Click **Show all →** to open the full **All Components** screen, which has its own search, category filter, and a **low stock only** toggle.
- **Machines**: click **+ New machine** to create one (name + optional description), which drops you into that machine's detail screen. There, add components from a dropdown of existing inventory items plus how many of each one machine needs (its bill of materials).
- The **Machines** block on the home screen shows how many machines are configured; tapping it opens the full machines list, where each machine shows **how many complete units can currently be built** — calculated as the minimum of `floor(component stock ÷ quantity needed per machine)` across every component in that machine's list. Whichever part runs out first caps the number.
