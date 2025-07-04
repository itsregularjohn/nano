import { z } from "zod";

export const OAuthCallbackSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().optional(),
});

export const CreateCheckoutSessionSchema = z.object({
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const CreatePortalSessionSchema = z.object({
  returnUrl: z.string().url().optional(),
});

export const UpdateUserProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
});

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export const UserResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    givenName: z.string().optional(),
    familyName: z.string().optional(),
    profilePicture: z.string().url().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export const SubscriptionStatusResponseSchema = z.object({
  isPro: z.boolean(),
  status: z.string(),
  subscriptionId: z.string().optional(),
});

export const CheckoutSessionResponseSchema = z.object({
  url: z.string().url(),
});

export type OAuthCallback = z.infer<typeof OAuthCallbackSchema>;
export type CreateCheckoutSession = z.infer<typeof CreateCheckoutSessionSchema>;
export type CreatePortalSession = z.infer<typeof CreatePortalSessionSchema>;
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type SubscriptionStatusResponse = z.infer<typeof SubscriptionStatusResponseSchema>;
export type CheckoutSessionResponse = z.infer<typeof CheckoutSessionResponseSchema>;
