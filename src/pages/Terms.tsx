import { LegalPage } from "@/components/LegalPage";
import { Link } from "react-router-dom";

const Terms = () => (
  <LegalPage
    title="Terms of Service"
    updated="13 November 2026"
    intro="Ummverse – The Book Affair (“Ummverse”) is owned, operated and managed by Ummverse Ventures. By using Ummverse you agree to these terms."
    sections={[
      { heading: "Who we are", body: <p>References to “we”, “us” or “our” mean Ummverse Ventures, the owner and operator of Ummverse. Ummverse helps readers discover romance books by mood, trope and spice level.</p> },
      { heading: "Accounts", body: <p>You can sign in with your Google account. You are responsible for activity on your account and must give accurate information. You must be old enough to form a binding contract where you live.</p> },
      { heading: "Free trials", body: <p>Every visitor gets <strong>2 free tries</strong> (for example, quiz recommendations). Tries are counted per browser and per account, and carry over when you sign in. After 2 tries, a paid subscription is required to continue.</p> },
      { heading: "Subscriptions & billing", body: <>
        <ul>
          <li><strong>Monthly:</strong> $5 USD per month.</li>
          <li><strong>Annual:</strong> $60 USD per year.</li>
        </ul>
        <p>Subscriptions <strong>renew automatically</strong> at the end of each billing period at the then-current price until you cancel. Payments are processed by our payment partner, Paddle, which acts as the merchant of record. You can cancel any time from your dashboard's billing portal; cancellation stops future renewals and access continues until the end of the paid period. See our <Link to="/refunds">Refund Policy</Link>.</p>
        <p>We may change prices with advance notice; changes apply from your next renewal.</p>
      </> },
      { heading: "Third-party vendor disclaimer", body: <>
        <p>Ummverse acts <strong>strictly as an informational and discovery directory</strong> for book vendors, including Instagram vendors, online stores and local bookstores. We do not sell books, take payment for books, or act as an agent for any vendor.</p>
        <p>Any purchase, communication or arrangement you make with a vendor is solely between you and that vendor. <strong>Ummverse Ventures assumes zero liability</strong> for any transaction, dispute, payment, delivery or shipping issue, product quality, misrepresentation or fraud arising between you and any third-party vendor listed on the platform. Listing a vendor is not an endorsement or guarantee. Please do your own checks before paying anyone.</p>
      </> },
      { heading: "User conduct & reviews", body: <>
        <p>You agree not to post content that is unlawful, hateful, harassing, sexually explicit beyond book discussion, spam, misleading, or that infringes others' rights, and not to misuse, scrape or disrupt the service.</p>
        <p>We reserve the right to edit or remove any review or content, and to suspend or terminate any account that violates these terms or our platform standards, at our discretion and without prior notice. You keep ownership of your reviews but grant us a licence to display them on Ummverse.</p>
      </> },
      { heading: "Content & intellectual property", body: <p>Book descriptions, covers and metadata may come from publishers and public sources such as Open Library and belong to their owners. The Ummverse name, design and original content belong to Ummverse Ventures.</p> },
      { heading: "Disclaimers & limitation of liability", body: <p>Ummverse is provided “as is”. Recommendations, spice levels and content warnings are guidance only. To the fullest extent permitted by law, Ummverse Ventures is not liable for indirect or consequential losses, and our total liability is limited to the amount you paid us in the 12 months before the claim.</p> },
      { heading: "Changes & governing law", body: <p>We may update these terms and will post the new date above. These terms are governed by the laws of the Federal Republic of Nigeria.</p> },
      { heading: "Contact", body: <p>Questions? Contact Ummverse Ventures at <a href="mailto:hello@ummverse.com.ng">hello@ummverse.com.ng</a>.</p> },
    ]}
  />
);
export default Terms;
