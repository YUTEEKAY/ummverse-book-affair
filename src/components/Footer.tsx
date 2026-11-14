import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-secondary/50 px-6 py-10">
    <div className="mx-auto max-w-4xl space-y-4 text-center">
      <p className="font-serif text-muted-foreground">Where every page turns into a love story</p>
      <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
        <Link to="/terms" className="text-muted-foreground hover:text-primary">Terms of Service</Link>
        <Link to="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link>
        <Link to="/refunds" className="text-muted-foreground hover:text-primary">Refund Policy</Link>
        <Link to="/disclaimer" className="text-muted-foreground hover:text-primary">Disclaimer</Link>
      </nav>
      <p className="text-xs text-muted-foreground/80">© {new Date().getFullYear()} Ummverse – The Book Affair is owned and operated by Ummverse Ventures. All rights reserved.</p>
    </div>
  </footer>
);

export function SiteFooter() {
  return <Footer />;
}

export default Footer;
