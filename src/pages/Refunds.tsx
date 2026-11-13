import { LegalPage } from "@/components/LegalPage";
import { Link } from "react-router-dom";

const Refunds = () => (
  <LegalPage
    title="Refund Policy"
    updated="13 November 2026"
    intro="This policy applies to subscriptions to Ummverse – The Book Affair, owned, operated and managed by Ummverse Ventures."
    sections={[
      { heading: "Non-refundable fees", body: <p>Ummverse subscriptions are digital services. Fees for the <strong>Monthly ($5)</strong> and <strong>Annual ($60)</strong> plans are <strong>non-refundable once billed</strong> for the current billing cycle, including partially used periods.</p> },
      { heading: "Cancel any time", body: <p>You can cancel at any time <strong>before your next renewal date</strong> through the billing portal in your <Link to="/dashboard">dashboard</Link> (“Manage Subscription”). Cancelling prevents future charges, and you keep Premium access until the end of the period you already paid for.</p> },
      { heading: "Free trials", body: <p>Your 2 free tries cost nothing and require no payment details, so you can try Ummverse before subscribing.</p> },
      { heading: "Billing errors", body: <p>If you were charged twice or charged after cancelling, contact us within 14 days and Ummverse Ventures will review it. Where required by law, your statutory rights are not affected.</p> },
      { heading: "Book purchases", body: <p>Ummverse does not sell books. Refunds for books bought from vendors listed on Ummverse must be requested from that vendor. See the vendor disclaimer in our <Link to="/terms">Terms of Service</Link>.</p> },
      { heading: "Contact", body: <p>Email <a href="mailto:hello@ummverse.com.ng">hello@ummverse.com.ng</a>.</p> },
    ]}
  />
);
export default Refunds;
