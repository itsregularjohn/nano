import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { UserModel } from "../models";
import config from "../core/config";
import Stripe from "stripe";

const s3Client = new S3Client({ region: config.aws.region });

export async function deleteUserAccount(userId: string): Promise<void> {
  console.log(`Starting account deletion for user ${userId}`);

  // Get user details first
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  // 1. Cancel Stripe subscription if exists and Stripe is configured
  if (config.stripe?.apiKey && user.stripeCustomerId) {
    try {
      const stripe = new Stripe(config.stripe.apiKey);
      console.log(
        `Cancelling Stripe subscription for customer ${user.stripeCustomerId}`
      );

      // Get all active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "active",
      });

      // Cancel each active subscription
      for (const subscription of subscriptions.data) {
        await stripe.subscriptions.cancel(subscription.id);
        console.log(`Cancelled subscription ${subscription.id}`);
      }

      // Delete the customer from Stripe
      await stripe.customers.del(user.stripeCustomerId);
      console.log(`Deleted Stripe customer ${user.stripeCustomerId}`);
    } catch (stripeError) {
      console.error(
        `Failed to clean up Stripe data for user ${userId}:`,
        stripeError
      );
      // Don't fail the entire operation for Stripe errors
    }
  }

  // 2. Delete all S3 objects for this user
  try {
    const s3Prefix = `users/${userId}/`;

    // List all objects with this prefix
    const listResult = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: config.aws.s3BucketName,
        Prefix: s3Prefix,
      })
    );

    // Delete each object found
    if (listResult.Contents && listResult.Contents.length > 0) {
      console.log(
        `Deleting ${listResult.Contents.length} S3 objects for user ${userId}`
      );

      for (const object of listResult.Contents) {
        if (object.Key) {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: config.aws.s3BucketName,
              Key: object.Key,
            })
          );
          console.log(`Deleted S3 object: ${object.Key}`);
        }
      }
    } else {
      console.log(`No S3 objects found for user ${userId}`);
    }
  } catch (s3Error) {
    console.error(`Failed to delete S3 objects for user ${userId}:`, s3Error);
    // Don't fail the entire operation for S3 errors
  }

  // 3. Delete any user-specific data from DynamoDB
  // This is where you would delete user's application-specific data
  // For example: documents, files, preferences, etc.
  try {
    // Add your application-specific data deletion logic here
    console.log(`Cleaning up application data for user ${userId}`);

    // Example: Delete user's documents, settings, etc.
    // const userDocuments = await DocumentModel.findByUser(userId)
    // for (const doc of userDocuments) {
    //   await DocumentModel.delete(doc.id)
    // }
  } catch (dataError) {
    console.error(
      `Failed to delete application data for user ${userId}:`,
      dataError
    );
    // Continue with user deletion even if application data cleanup fails
  }

  // 4. Finally, delete the user account
  await UserModel.delete(userId);
  console.log(`Deleted user account ${userId} (${user.email})`);

  console.log(`Account deletion completed for user ${userId}`);
}
