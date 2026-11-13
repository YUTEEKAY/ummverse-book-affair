import { LegalPage } from "@/components/LegalPage";

const Privacy = () => (
  <LegalPage
    title="Privacy Policy"
    updated="13 November 2026"
    intro="Ummverse – The Book Affair is owned, operated and managed by Ummverse Ventures, which is responsible for your personal data. This policy explains what we collect and why."
    sections={[
      { heading: "What we collect", body: <ul>
        <li><strong>Google account information</strong> when you sign in: your name, email address and profile picture.</li>
        <li><strong>Reading activity:</strong> quiz answers and results, saved books and reviews you write.</li>
        <li><strong>Trial usage:</strong> how many of your 2 free tries you have used, stored against your account.</li>
        <li><strong>Device identifier for trial enforcement:</strong> a small counter saved in your browser's local storage so tries can be counted before you sign in. We do not use invasive fingerprinting.</li>
        <li><strong>Subscription details</strong> from our payment partner: plan, status and renewal date. We never see or store your full card details.</li>
      </ul> },
      { heading: "How we use it", body: <p>To run your account, give recommendations, enforce the free-trial limit, provide Premium features, process subscriptions, prevent abuse, and improve the site.</p> },
      { heading: "Storage & security", body: <p>Your data is stored securely with Supabase, our cloud database provider, with access rules that limit each person to their own data. Only authorised Ummverse Ventures administrators can view account data, for support and moderation.</p> },
      { heading: "We never sell your data", body: <p><strong>Ummverse Ventures never sells, rents or trades your personal data to third parties.</strong></p> },
      { heading: "Service providers", body: <ul>
        <li><strong>Google</strong> – sign-in.</li>
        <li><strong>Paddle</strong> – payments and subscription management (merchant of record).</li>
        <li><strong>Supabase</strong> – secure data storage and authentication.</li>
        <li><strong>Vercel Analytics & Speed Insights</strong> – anonymous traffic and performance measurement.</li>
        <li><strong>Google Fonts and Open Library</strong> – fonts and book covers load from their servers, which receive your IP address.</li>
      </ul> },
      { heading: "Site analytics", body: <>
        <p>We also use Lovable's built-in visitor analytics. It uses no cookies, stores nothing on your device, doesn't keep IP addresses and doesn't identify visitors. Lovable collects this data for us. <a href="https://lovable.dev/privacy" target="_blank" rel="noreferrer">Lovable's privacy policy</a> explains how it handles it.</p>
        <p>It records the pages visited, where visitors came from, their country, browser, operating system and device type, how long they stay, how fast pages load, errors, and which buttons and links are clicked. This is recorded for every visitor. Detailed data is kept for 90 days and daily summaries for a year.</p>
      </> },
      { heading: "Your browser's storage", body: <p>We store your sign-in session and free-try counter in your browser's local storage. These are needed for the site to work.</p> },
      { heading: "Retention & your rights", body: <p>We keep your data while your account is active. You can ask to access, correct or delete your data, or close your account, by emailing us. You may also have rights under the Nigeria Data Protection Act 2023 and other local laws.</p> },
      { heading: "Contact", body: <p>Ummverse Ventures – <a href="mailto:hello@ummverse.com.ng">hello@ummverse.com.ng</a>.</p> },
    ]}
  />
);
export default Privacy;
