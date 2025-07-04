import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { z } from "zod";
import config from "../core/config";

// for convenience
export * from "./validation";

const client = new DynamoDBClient({ region: config.aws.region });
const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Zod schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  googleId: z.string(),
  name: z.string(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  profilePicture: z.string().url().optional(),
  stripeCustomerId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Schema for Google OAuth profile (what we receive from Google)
export const GoogleProfileSchema = z.object({
  id: z.string().optional(), // Sometimes Google returns 'id' instead of 'sub'
  sub: z.string().optional(), // Google's user ID
  email: z.string().email(),
  verified_email: z.boolean().default(false).optional(), // Google returns 'verified_email', not 'email_verified'
  name: z.string(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url().optional(),
}).refine((data) => data.sub || data.id, {
  message: "Either 'sub' or 'id' must be present",
  path: ["sub"],
});

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
}).partial();

// Type inference from schemas
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type GoogleProfile = z.infer<typeof GoogleProfileSchema>;

export const UserModel = {
  async create(data: CreateUser): Promise<User> {
    const validated = CreateUserSchema.parse(data);
    const now = new Date().toISOString();
    const user: User = {
      ...validated,
      id: ulid(),
      createdAt: now,
      updatedAt: now,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: config.aws.dynamoTableName,
        Item: {
          pk: `USER#${user.id}`,
          sk: `USER#${user.id}`,
          gsi1pk: `EMAIL#${user.email.toLowerCase()}`,
          gsi1sk: `USER`,
          ...user,
        },
      })
    );

    return UserSchema.parse(user);
  },

  async findById(id: string): Promise<User | null> {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: config.aws.dynamoTableName,
        Key: {
          pk: `USER#${id}`,
          sk: `USER#${id}`,
        },
      })
    );

    if (!result.Item) return null;
    
    try {
      return UserSchema.parse(result.Item);
    } catch (error) {
      console.error("Invalid user data in database:", error);
      return null;
    }
  },

  async findByEmail(email: string): Promise<User | null> {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: config.aws.dynamoTableName,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :email AND gsi1sk = :type",
        ExpressionAttributeValues: {
          ":email": `EMAIL#${email.toLowerCase()}`,
          ":type": "USER",
        },
        Limit: 1,
      })
    );

    if (!result.Items?.[0]) return null;

    try {
      return UserSchema.parse(result.Items[0]);
    } catch (error) {
      console.error("Invalid user data in database for email", email, ":", error);
      console.log("Raw database item:", result.Items[0]);
      
      // If it's missing googleId but has the user data, try to return null
      // so the OAuth flow can create a new user
      const item = result.Items[0];
      if (!item.googleId && item.email) {
        console.log("User found but missing googleId, returning null to allow recreation");
        return null;
      }
      
      return null;
    }
  },

  async findByStripeCustomerId(customerId: string): Promise<User | null> {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: config.aws.dynamoTableName,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1sk = :type",
        FilterExpression: "stripeCustomerId = :customerId",
        ExpressionAttributeValues: {
          ":type": "USER",
          ":customerId": customerId,
        },
      })
    );

    if (!result.Items?.[0]) return null;

    try {
      return UserSchema.parse(result.Items[0]);
    } catch (error) {
      console.error("Invalid user data in database:", error);
      return null;
    }
  },

  async updateStripeCustomerId(
    userId: string,
    stripeCustomerId: string
  ): Promise<void> {
    await dynamodb.send(
      new UpdateCommand({
        TableName: config.aws.dynamoTableName,
        Key: {
          pk: `USER#${userId}`,
          sk: `USER#${userId}`,
        },
        UpdateExpression:
          "SET stripeCustomerId = :customerId, updatedAt = :now",
        ExpressionAttributeValues: {
          ":customerId": stripeCustomerId,
          ":now": new Date().toISOString(),
        },
      })
    );
  },

  async update(userId: string, updates: UpdateUser): Promise<void> {
    const validated = UpdateUserSchema.parse(updates);
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};

    Object.entries(validated).forEach(([key, value]) => {
      if (value !== undefined) {
        const attrName = `#${key}`;
        const attrValue = `:${key}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        attributeNames[attrName] = key;
        attributeValues[attrValue] = value;
      }
    });

    if (updateExpressions.length === 0) return;

    updateExpressions.push("#updatedAt = :updatedAt");
    attributeNames["#updatedAt"] = "updatedAt";
    attributeValues[":updatedAt"] = new Date().toISOString();

    await dynamodb.send(
      new UpdateCommand({
        TableName: config.aws.dynamoTableName,
        Key: {
          pk: `USER#${userId}`,
          sk: `USER#${userId}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: attributeNames,
        ExpressionAttributeValues: attributeValues,
      })
    );
  },

  async delete(userId: string): Promise<void> {
    await dynamodb.send(
      new DeleteCommand({
        TableName: config.aws.dynamoTableName,
        Key: {
          pk: `USER#${userId}`,
          sk: `USER#${userId}`,
        },
      })
    );
  },
};
