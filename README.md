# Welcome to Ummverse

## Flutterwave and Vercel deployment

1. Connect this project to GitHub in Lovable, then import that repository into Vercel as a Vite project. Build: `npm run build`; output: `dist`. Root `vercel.json` provides SPA deep-link rewrites.
2. Set the public variables from `.env.example` in Vercel. Copy the existing application's public Cloud URL and publishable key from project configuration. Set `VITE_FLUTTERWAVE_PUBLIC_KEY` to the public key from the same Flutterwave test/live account as the server key. Rebuild after changes.
3. Keep `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_HASH`, `FLUTTERWAVE_MONTHLY_PLAN_ID`, and `FLUTTERWAVE_ANNUAL_PLAN_ID` in Lovable Cloud secrets, never as Vite variables. Backend functions continue to run on Lovable Cloud, not Vercel.
4. Create active USD recurring payment plans in Flutterwave: $5 with interval `monthly`, and $60 with interval `yearly`. Save their numeric IDs as the two plan variables. Test and live plans/keys must not be mixed.
5. Set the Flutterwave webhook URL to the Cloud functions base URL followed by `/flutterwave-webhook`, set its secret hash to the same `FLUTTERWAVE_WEBHOOK_HASH`, and enable payment/subscription events and webhook retries. The handler expects v3 `verif-hash` authentication and independently verifies payments.
6. Allow your Vercel and custom-domain `https://…/**` return URLs in Lovable Cloud → Users → Auth settings → Advanced. Managed Google sign-in also requires hosting that serves Lovable's `/~oauth` broker paths; Vercel's SPA rewrite alone does not provide that broker. Verify Google sign-in on Vercel before launch and configure a supported externally hosted OAuth flow if needed.
7. Disconnect the old managed Payments integration from its dashboard's three-dot menu. Prior subscriptions are not migrated or canceled automatically; arrange migration with existing subscribers before retiring their old billing.

Checkout uses Flutterwave Standard hosted recurring card checkout. No fake keys or sandbox success fallbacks are shipped: the portal renders with empty configuration, but payment requests fail safely until credentials and plans are supplied. Annual price is $60. Cancellation stops renewals while preserving access through the paid period. Subscription rows, not editable profile metadata, drive access.

Before launch, test successful/failed checkout, dashboard verification, duplicate and recurring webhooks, cancellation, and paid review/vendor access with test credentials. These cannot be certified while credentials are missing. `bun test src/lib/*.test.ts` runs the regression tests.

## Project info

**URL**: https://lovable.dev/projects/7a37ec35-ed53-4a58-aada-c05fb47266d7

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7a37ec35-ed53-4a58-aada-c05fb47266d7) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7a37ec35-ed53-4a58-aada-c05fb47266d7) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
