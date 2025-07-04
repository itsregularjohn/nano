# Deployment Checklist

This checklist covers all the configuration steps needed to deploy your SaaS application successfully.

## Pre-Deployment Setup

### 1. AWS Configuration

- [ ] AWS Profile Setup (if not using default)
  - Configure AWS credentials: `aws configure --profile YOUR_PROFILE_NAME`
  - Update `serverless.yml` profile setting if needed
  - Ensure profile has necessary permissions (CloudFormation, Lambda, DynamoDB, S3, Route53, ACM)

- [ ] Region Configuration
  - Default region is `us-east-1` (recommended for ACM certificates)
  - Update `provider.region` in `serverless.yml` if needed

### 2. DNS & Domain Setup

- [ ] Domain Purchase & Configuration
  - Purchase your domain (e.g., `yourdomain.com`)
  - Choose subdomain for app (e.g., `app.yourdomain.com`)

- [ ] Route53 Hosted Zone
  ```bash
  # Create hosted zone for your domain/subdomain
  aws route53 create-hosted-zone --name app.yourdomain.com --caller-reference unique-ref-$(date +%s)
  ```

- [ ] DNS Delegation
  - If using a DNS provider: Create NS records pointing to Route53 name servers
  - If managing DNS directly: Update domain registrar to use Route53 name servers

- [ ] Update Domain Configuration
  - Update `custom.domain` in `serverless.yml`
  - Update `custom.hostedZone` with your Route53 hosted zone ID

### 3. Google OAuth Setup

- [ ] Google Cloud Project
  - Create/select Google Cloud project
  - Enable Google+ API and OAuth consent screen

- [ ] OAuth Client Configuration
  - Create OAuth 2.0 credentials in Google Cloud Console
  - Add authorized redirect URIs:
    - `http://localhost:3000/oauth/google/callback` (for local development)
    - `https://yourdomain.com/oauth/google/callback` (for production)

- [ ] Environment Variables
  - Update `GOOGLE_CLIENT_ID` in `.env.dev` and `.env.prod`
  - Update `GOOGLE_CLIENT_SECRET` in `.env.dev` and `.env.prod`

### 4. Stripe Setup (Optional)

- [ ] Stripe Account
  - Create Stripe account
  - Get API keys from Stripe dashboard

- [ ] Product & Pricing
  - Create product in Stripe dashboard
  - Create price/plan (e.g., $7/month)
  - Copy price ID

- [ ] Customer Portal Configuration
  - Go to Stripe Dashboard → Settings → Customer Portal
  - Enable customer portal
  - Configure allowed features:
    - ✅ Cancel subscriptions
    - ✅ Update payment methods
    - ✅ Download invoices
    - ✅ View billing history
  - Set custom branding (logo, colors) to match your app
  - Configure business information and support details

- [ ] Environment Variables
  - Update `STRIPE_API_KEY` in `.env.dev` and `.env.prod`
  - Update `STRIPE_PUBLISHABLE_KEY` in `.env.dev` and `.env.prod`
  - Update `STRIPE_PRICE_ID` in `.env.dev` and `.env.prod`

### 5. OpenAI Setup (Optional)

- [ ] OpenAI API Key
  - Create OpenAI account
  - Generate API key
  - Update `OPENAI_API_KEY` in `.env.dev` and `.env.prod`

## Security Configuration

### 6. CSRF Origins

- [ ] Update Allowed Origins
  - Edit `src/app.ts`
  - Update the CSRF middleware `allowedOrigins` array:
  ```typescript
  const allowedOrigins = [
    config.app.url,
    "http://localhost:3000",
    "https://yourdomain.com", // ← Update this
  ];
  ```

### 7. Session Configuration

- [ ] Review Cookie Settings
  - Check `src/core/session-middleware.ts`
  - Ensure `Secure` flag is set for production (automatic)
  - Verify `SameSite` and `HttpOnly` settings

## Legal & Content

### 8. Legal Documents

- [ ] Privacy Policy (`src/static/PRIVACY.md`)
  - Update company/app name throughout
  - Update contact email address
  - Update app URL/domain
  - Customize data collection practices
  - Update retention policies

- [ ] Terms of Service (`src/static/TERMS.md`)
  - Update company/app name throughout
  - Update service description
  - Update contact email address
  - Update app URL/domain
  - Customize pricing and billing terms
  - Review governing law (currently Brazil)

### 9. Branding & Content

- [ ] App Name & Branding
  - Update `service` name in `serverless.yml`
  - Update app name in `package.json`
  - Search for "Nano" or "nano" and replace with your app name
  - Update any remaining template content

- [ ] Contact Information
  - Update contact email in Privacy Policy and Terms
  - Update support email in error messages
  - Update company information

## Deployment

### 10. Environment Files

- [ ] Copy Environment Templates
  ```bash
  cp .env.example .env.dev
  cp .env.example .env.prod
  ```

- [ ] Update Environment Variables
  - Configure all variables in `.env.dev` and `.env.prod`
  - Verify `APP_URL` matches your domain

### 11. Deploy to AWS

- [ ] Development Deployment
  ```bash
  npx serverless deploy --stage dev --aws-profile YOUR_PROFILE
  ```

- [ ] Production Deployment
  ```bash
  npx serverless deploy --stage prod --aws-profile YOUR_PROFILE
  ```

### 12. Post-Deployment Verification

- [ ] SSL Certificate
  - Verify certificate validation completed
  - Check HTTPS access to your domain

- [ ] OAuth Flow
  - Test Google login functionality
  - Verify redirect URIs work correctly

- [ ] Stripe Integration
  - Test payment flow (if implemented)
  - Test customer portal access and functionality
  - Verify subscription management works

- [ ] Functionality Testing
  - Test user registration/login
  - Test core application features
  - Verify database connections
  - Test file uploads (if applicable)

## Troubleshooting

### Common Issues:

- Certificate validation failed: Ensure DNS delegation is working and Route53 hosted zone is correct
- OAuth redirect mismatch: Verify Google Cloud Console has correct redirect URIs
- CSRF errors: Check allowed origins in `src/app.ts`
- Database errors: Verify AWS permissions and DynamoDB table creation
- File upload errors: Check S3 bucket creation and CORS configuration

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Ensure AWS permissions are properly configured
4. Check CloudFormation events for deployment errors

Good luck with your deployment! 🎉
