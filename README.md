# Nano-SaaS Starter

> A lightweight foundation for building small SaaS products

Built for anyone who want to move fast, keep things simple, and focus on solving real pains without architecting for scale they might never need.

## Philosophy

No over-engineering. Most micro-SaaS wins are straightforward tools with a clear value proposition. Nano-SaaS helps you go from idea to revenue quickly.

Target: 1K–50K ARR tools built by solo founders who value speed, clarity, and control.

## Why Use Nano-SaaS?

- No complicated frontend setups or CI/CD pipelines
- Serverless-first means you only pay for what you use
- Everything you need, nothing you don't
- Built to grow (a little) and holds up fine until you hit meaningful revenue
- Fewer moving parts, easier to debug and extend

## What's Included

- OAuth Auth: Comes with Google, easy to switch to other OAuth providers
- Stripe Integration: SDK-based, no webhook juggling
- DynamoDB as main database
- AI Integration: OpenAI client ready to go
- Session auth with CSRF protection
- Deploy with one command to AWS Lambda via Serverless Framework

## Tech Stack

- Backend: Hono.js (lightweight, standards-based, Cloudflare compatible)
- Frontend: JSX + HTMX (no build step)
- Database: DynamoDB
- IDs: ULID (sortable, time-based, human-friendly)
- Storage: S3
- Payments: Stripe
- Auth: Google OAuth
- Deployment: AWS Lambda + API Gateway
- Language: TypeScript

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo>
cd nano
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env.dev
# Edit .env.dev with your credentials
```

### 3. Configure OAuth

- LinkedIn: [LinkedIn Developers](https://www.linkedin.com/developers/)
- Google (optional): [Google Cloud Console](https://console.cloud.google.com/)

### 4. Setup Stripe

- Grab API keys from your [Stripe Dashboard](https://dashboard.stripe.com/)
- Create a product and pricing
- Add keys to `.env.dev`

### 5. Run the Dev Server

```bash
pnpm dev
```

Visit `http://localhost:9000` and you're up.

### 6. Make Your First Project

Follow the complete deployment checklist in [TODO.md](./TODO.md).
The checklist covers everything from DNS setup to post-deployment verification.

## Typical Costs

- AWS Lambda: ~$1–5/month for light traffic
- DynamoDB: ~$1–10/month for modest usage
- S3: ~$1–5/month under 100GB
- Route53: $0.50/month per domain
- Stripe: Standard fees (2.9% + 30 cents)

Total: \~\$5–25/month until you're making real money

## Deploying

```bash
# For staging or dev
pnpm deploy:dev

# For production
pnpm deploy
```

Configure domain + SSL in `serverless.yml`.

## Project Layout

```
src/
├── app.ts              # Routes
├── core/               # Auth and config
├── models/             # Database models
├── functions/          # Feature logic
├── client/             # JSX components
└── static/             # Static files
```

## Extending the App

### Add a New Feature

```ts
// 1. Define your data schema (src/models/widget.ts)
import { z } from "zod";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import config from "../core/config";

// Zod schemas
export const WidgetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateWidgetSchema = WidgetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type inference
export type Widget = z.infer<typeof WidgetSchema>;
export type CreateWidget = z.infer<typeof CreateWidgetSchema>;

// 2. Add validation schema for API input (src/models/validation.ts)
export const CreateWidgetRequestSchema = z.object({
  name: z.string().min(1, "Widget name is required"),
  description: z.string().optional(),
});

export type CreateWidgetRequest = z.infer<typeof CreateWidgetRequestSchema>;

// 3. Add route with validation (src/app.ts)
import { zValidator } from "@hono/zod-validator";
import { CreateWidgetRequestSchema } from "./models/validation";
import { createWidget } from "./functions/widgets";

app.post(
  "/api/widgets",
  sessionMiddleware(), // Protect with auth
  zValidator("json", CreateWidgetRequestSchema),
  async (c) => {
    const session = getSessionData(c);
    const widgetData = c.req.valid("json");

    try {
      const widget = await createWidget({
        ...widgetData,
        userId: session.userId,
      });
      return c.json({ widget });
    } catch (error) {
      console.error("Widget creation error:", error);
      return c.json({ error: "Failed to create widget" }, 500);
    }
  }
);

// 4. Implement business logic (src/functions/widgets.ts)
import {
  CreateWidget,
  Widget,
  CreateWidgetSchema,
  WidgetSchema,
} from "../models/widget";

export async function createWidget(data: CreateWidget): Promise<Widget> {
  const validated = CreateWidgetSchema.parse(data);
  const now = new Date().toISOString();

  const widget: Widget = {
    ...validated,
    id: ulid(),
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: config.aws.dynamoTableName,
      Item: {
        pk: `USER#${widget.userId}`,
        sk: `WIDGET#${widget.id}`,
        ...widget,
      },
    })
  );

  return WidgetSchema.parse(widget);
}
```

### Add Interactivity

```html
<!-- Use HTMX -->
<button hx-post="/api/widgets" hx-target="#widget-list">Add Widget</button>
```
