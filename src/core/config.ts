import { z } from "zod"

const configSchema = z.object({
  openai: z.object({
    apiKey: z.string().min(1, "OPENAI_API_KEY is required"),
  }),
  google: z.object({
    clientId: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
    clientSecret: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
    redirectUri: z.string().url("GOOGLE_REDIRECT_URI must be a valid URL").optional(),
  }),
  aws: z.object({
    region: z.string().default("us-east-1"),
    dynamoTableName: z.string().default("saas-users"),
    s3BucketName: z.string().default("saas-files"),
  }),
  stripe: z.object({
    apiKey: z.string().optional(),
    priceId: z.string().optional(),
  }).optional(),
  app: z.object({
    url: z.string().url().default("http://localhost:9000"),
    assetsUrl: z.string().url().optional(),
  })
})

const config = configSchema.parse({
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },
  aws: {
    region: process.env.AWS_REGION,
    dynamoTableName: process.env.DYNAMO_TABLE_NAME,
    s3BucketName: process.env.S3_BUCKET_NAME,
  },
  stripe: {
    apiKey: process.env.STRIPE_API_KEY,
    priceId: process.env.STRIPE_PRICE_ID,
  },
  app: {
    url: process.env.APP_URL,
    assetsUrl: process.env.ASSETS_URL,
  },
})

export default config
export type Config = z.infer<typeof configSchema>
