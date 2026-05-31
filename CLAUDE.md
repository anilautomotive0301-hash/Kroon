# Kroon — School Uniform ERP

Full-stack ERP for school uniform vendors and manufacturing teams.

## Stack

| Layer | Technology |
|---|---|
| Backend API | NestJS (TypeScript) |
| Database | PostgreSQL + Prisma ORM |
| Frontend | Next.js 15 (App Router) |
| Auth | JWT (access + refresh) + bcrypt |
| QR Codes | `qrcode` library |
| Bulk Import | `xlsx` + `papaparse` |
| File Upload | Multer (NestJS) |
| Charts | Recharts |
| Styling | Tailwind CSS + shadcn/ui |

## Project Layout

```
Kroon/
├── backend/          NestJS API on port 4000
│   ├── prisma/       schema.prisma + migrations
│   └── src/
│       ├── auth/
│       ├── campus/
│       ├── students/
│       ├── measurements/
│       ├── workflow/
│       ├── inventory/
│       ├── production/
│       ├── dispatch/
│       ├── payments/
│       ├── analytics/
│       └── common/
└── frontend/         Next.js 15 on port 3000
    └── src/
        ├── app/
        │   ├── (auth)/login/
        │   └── (dashboard)/
        │       ├── campus/
        │       ├── students/
        │       ├── measurements/
        │       ├── workflow/
        │       ├── production/
        │       ├── dispatch/
        │       ├── inventory/
        │       ├── payments/
        │       └── analytics/
        ├── components/
        ├── hooks/
        ├── lib/
        └── types/
```

## End-to-End Workflow

```
CAMPUS_REGISTERED
  → STUDENTS_IMPORTED        (bulk CSV/Excel upload)
  → MEASUREMENT_SCHEDULED    (campus visit created)
  → MEASUREMENT_IN_PROGRESS  (field staff scanning QR + entering measurements)
  → SIZE_ASSIGNED            (standard or custom size selected)
  → PENDING_APPROVAL         (supervisor review queue)
  → APPROVED
  → FABRIC_ALLOCATED         (inventory deducted)
  → TAILOR_ASSIGNED
  → STITCHING
  → QUALITY_CHECK
  → DISPATCHED
  → DELIVERED
  → REWORK                   (if quality fails, loops back)
```

## Roles

| Role | Access |
|---|---|
| ADMIN | Full access |
| SUPERVISOR | Approve measurements, manage production |
| FIELD_STAFF | Record measurements via QR scan |
| TAILOR | Update stitching status |
| ACCOUNTANT | View/manage payments and invoices |

## Dev Setup

```bash
# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

## API Base URL

Backend: `http://localhost:4000/api`

## Key Design Decisions

- Each student has a unique QR code generated on import
- Workflow state transitions are recorded in `WorkflowHistory` with actor + timestamp
- Every size assignment change writes to `AuditLog`
- Bulk imports are tracked as `ImportBatch` records for traceability
- Fabric stock is managed as running balance (entries - consumptions)
- Approval requests are 1:1 with workflow states (no duplicate requests)
