import { motion } from "framer-motion";
import { ArrowLeft, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const Terms = () => {
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
          <Scale className="h-16 w-16 text-primary" />
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Terms & Conditions
          </h1>
          <Badge variant="secondary" className="text-sm">
            Last updated: October 2025
          </Badge>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Please read these terms carefully before using Ummverse: The Book Affair
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
              <CardTitle className="font-serif">Welcome</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                Welcome to Ummverse: The Book Affair ("the Platform"). By using this website
                (https://ummverse.com.ng) and services, you agree to these Terms & Conditions ("Terms"). If you
                do not agree, please discontinue use.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">1. Eligibility & Accounts</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                You must be at least <strong>18 years old</strong> (or the age of majority in your jurisdiction). You may use the
                Platform anonymously or via guest access. Premium features require subscription.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">2. Subscription & Payment</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                Access to certain content and features requires a paid subscription processed via Lemon Squeezy.
                Payments are <strong>non-refundable</strong> unless required by law.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">3. User Conduct</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                You may leave anonymous reviews but must not post illegal, obscene, or defamatory content. We
                reserve the right to remove violating content.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">4. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                All content, branding, and designs on Ummverse are property of Ummverse or licensed to it. You
                may not copy or reuse brand elements without permission.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">5. Disclaimer of Warranties</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                The Platform is provided <strong>"as is"</strong>. Ummverse disclaims all warranties, express or implied, including
                fitness for a particular purpose.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">6. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                Ummverse shall not be liable for damages arising from use or inability to use the Platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">7. Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                These Terms are governed by the laws of the <strong>Federal Republic of Nigeria</strong>. Disputes shall be
                resolved in Abuja courts.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">8. Changes</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                Ummverse may revise these Terms at any time with notice via website or email.
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

export default Terms;
