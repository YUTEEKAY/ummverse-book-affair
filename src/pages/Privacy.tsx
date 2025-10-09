import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-blush/10 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container py-12 md:py-16"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <Shield className="h-16 w-16 text-primary" />
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Privacy Policy
          </h1>
          <Badge variant="secondary" className="text-sm">
            Last updated: October 2025
          </Badge>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Your privacy matters to us. This Policy explains what data Ummverse collects and how it is used.
          </p>
        </div>
      </motion.section>

      {/* Content */}
      <div className="container pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">1. Data We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Non-personal Data:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Device information</li>
                  <li>Browser type and version</li>
                  <li>IP address</li>
                  <li>Usage data and analytics</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Optional Data:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Email address (for subscriptions)</li>
                  <li>Review texts</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">2. How We Use Data</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>To deliver book recommendations</li>
                <li>To improve user experience</li>
                <li>To send transactional or service-related emails</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">3. Third Parties</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Payment Processing:</h4>
                <p className="text-muted-foreground">
                  Payments are handled securely via <strong>Lemon Squeezy</strong>
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Book Data:</h4>
                <p className="text-muted-foreground">
                  Book information sourced from <strong>Google Books API</strong> & <strong>Open Library API</strong>
                </p>
              </div>
              <p className="text-foreground font-semibold">
                We do not sell or trade your personal data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">4. Cookies</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p className="text-muted-foreground">
                We use cookies for analytics and session management. You can disable cookies in your browser settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">5. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p className="text-muted-foreground">
                Analytics data is stored for up to <strong>12 months</strong>. User data can be deleted upon request to{" "}
                <a href="mailto:support@ummverse.com.ng" className="text-primary hover:underline">
                  support@ummverse.com.ng
                </a>
                .
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">6. Security</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p className="text-muted-foreground">
                All data is transmitted over <strong>HTTPS</strong>. We follow best practices to protect your data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">7. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p className="text-muted-foreground">
                We do not knowingly collect data from users under <strong>18 years old</strong>. If detected, such data will be deleted immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">8. Changes</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p className="text-muted-foreground">
                We may update this policy and will notify users through website notice or email.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blush/20 to-dusty-rose/20 border-dusty-rose/30">
            <CardHeader>
              <CardTitle className="font-serif">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground">
                <strong>Email:</strong>{" "}
                <a href="mailto:support@ummverse.com.ng" className="text-primary hover:underline">
                  support@ummverse.com.ng
                </a>
              </p>
              <p className="text-muted-foreground">
                <strong>Address:</strong> Remote, Abuja, Nigeria
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;
