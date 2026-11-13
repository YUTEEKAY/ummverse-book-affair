import { Heart, Sparkles, BookOpen } from "lucide-react";

const STEPS = [
  { icon: Heart, title: "Browse by mood", text: "Pick how you want to feel — cozy, spicy, dark, magical or bittersweet — and see romance books that match." },
  { icon: BookOpen, title: "Follow your favourite tropes", text: "Enemies to lovers, second chances, fake dating and more. Every book is tagged by trope and heat level." },
  { icon: Sparkles, title: "Take the quick quiz", text: "Answer three questions about feeling, trope and heat, and get personal book recommendations." },
];

const HowItWorks = () => (
  <section aria-labelledby="how-it-works" className="border-b border-border bg-background">
    <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-14">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">What is Ummverse?</p>
      <h2 id="how-it-works" className="max-w-3xl font-serif text-3xl leading-tight text-foreground sm:text-4xl">
        A romance book finder that starts with how you want to feel.
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Ummverse helps romance readers find their next book by mood, genre or trope, with a cover, summary, heat level and space for reader reviews on every title.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-md border border-border bg-card p-5">
            <Icon className="mb-3 h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="font-serif text-xl text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
