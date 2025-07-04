import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import config from "./config";

const client = new DynamoDBClient({ region: config.aws.region });
const docClient = DynamoDBDocumentClient.from(client);

const SESSION_TABLE_NAME = process.env.SESSIONS_TABLE_NAME || "app-sessions";
const SESSION_DURATION_HOURS = 24;

export interface SessionData {
  sessionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  stripeCustomerId?: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
}

export interface CreateSessionParams {
  userId: string;
  userEmail: string;
  userName: string;
  stripeCustomerId?: string;
}

export async function createSession(
  params: CreateSessionParams
): Promise<string> {
  const sessionId = ulid();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000
  );

  const sessionData: SessionData = {
    sessionId,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    stripeCustomerId: params.stripeCustomerId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastActivityAt: now.toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: SESSION_TABLE_NAME,
      Item: {
        ...sessionData,
        ttl: Math.floor(expiresAt.getTime() / 1000), // DynamoDB TTL uses Unix timestamp
      },
    })
  );

  return sessionId;
}

export async function validateSession(
  sessionId: string
): Promise<SessionData | null> {
  if (!sessionId) return null;

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: SESSION_TABLE_NAME,
        Key: { sessionId },
      })
    );

    if (!result.Item) return null;

    const session = result.Item as SessionData & { ttl: number };

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now > expiresAt) {
      // Session expired, delete it
      await destroySession(sessionId);
      return null;
    }

    // Update last activity (but don't await to avoid slowing down requests)
    updateLastActivity(sessionId).catch(console.error);

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      userEmail: session.userEmail,
      userName: session.userName,
      stripeCustomerId: session.stripeCustomerId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
    };
  } catch (error) {
    console.error("Error validating session:", error);
    return null;
  }
}

export async function destroySession(sessionId: string): Promise<void> {
  if (!sessionId) return;

  try {
    await docClient.send(
      new DeleteCommand({
        TableName: SESSION_TABLE_NAME,
        Key: { sessionId },
      })
    );
  } catch (error) {
    console.error("Error destroying session:", error);
  }
}

export async function refreshSession(
  sessionId: string,
  updatedUserData?: Partial<CreateSessionParams>
): Promise<SessionData | null> {
  const session = await validateSession(sessionId);
  if (!session) return null;

  const now = new Date();
  const newExpiresAt = new Date(
    now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000
  );

  const updatedSession: SessionData = {
    ...session,
    ...updatedUserData,
    expiresAt: newExpiresAt.toISOString(),
    lastActivityAt: now.toISOString(),
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: SESSION_TABLE_NAME,
        Item: {
          ...updatedSession,
          ttl: Math.floor(newExpiresAt.getTime() / 1000),
        },
      })
    );

    return updatedSession;
  } catch (error) {
    console.error("Error refreshing session:", error);
    return null;
  }
}

async function updateLastActivity(sessionId: string): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: SESSION_TABLE_NAME,
        Key: { sessionId },
        UpdateExpression: "SET lastActivityAt = :timestamp",
        ExpressionAttributeValues: {
          ":timestamp": new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error("Error updating last activity:", error);
  }
}

export async function destroyAllUserSessions(userId: string): Promise<void> {
  // Note: This requires a GSI on userId if we want to efficiently find all sessions for a user
  // For now, we'll handle this when implementing account deletion
  console.log(`TODO: Implement destroyAllUserSessions for user ${userId}`);
}
