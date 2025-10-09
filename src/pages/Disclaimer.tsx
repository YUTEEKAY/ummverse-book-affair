import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const Disclaimer = () => {
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
          <Info className="h-16 w-16 text-primary" />
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Disclaimer & Data Sources
          </h1>
          <Badge variant="secondary" className="text-sm">
            Last updated: October 2025
          </Badge>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Understanding where our book data comes from and how we use it
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
              <CardTitle className="font-serif">Book Data Sources</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none space-y-4">
              <p className="text-muted-foreground">
                Book data including summaries, cover images, and metadata displayed on Ummverse: The Book Affair
                is retrieved from the following trusted sources:
              </p>
              <div className="flex flex-col md:flex-row gap-4 my-6">
                <div className="flex-1 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                  <BookOpen className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Google Books API</h4>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive book information and metadata
                  </p>
                </div>
                <div className="flex-1 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                  <BookOpen className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Open Library API</h4>
                  <p className="text-sm text-muted-foreground">
                    Additional book data and cover images
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Copyright & Ownership</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none space-y-4">
              <p className="text-muted-foreground">
                <strong>All rights remain with original authors and publishers.</strong> Ummverse does not claim
                ownership of any book content, summaries, or cover images.
              </p>
              <p className="text-muted-foreground">
                We display only short summaries and metadata for discovery purposes under fair use principles.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Fair Use Statement</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p className="text-muted-foreground">
                The book information displayed on this platform is used for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                <li>Educational and informational purposes</li>
                <li>Book discovery and recommendation</li>
                <li>Helping readers find their next favorite book</li>
                <li>Non-commercial community building</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We encourage users to purchase books from legitimate sources to support authors and publishers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Content Accuracy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p className="text-muted-foreground">
                While we strive to provide accurate book information, Ummverse cannot guarantee the accuracy,
                completeness, or timeliness of the data retrieved from third-party APIs. Book availability,
                pricing, and descriptions may vary.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Removal Requests</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p className="text-muted-foreground">
                If you are a copyright holder and believe that content on Ummverse infringes your rights,
                please contact us immediately at{" "}
                <a href="mailto:support@ummverse.com.ng" className="text-primary hover:underline">
                  support@ummverse.com.ng
                </a>
                {" "}and we will promptly review and address your concerns.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blush/20 to-dusty-rose/20 border-dusty-rose/30">
            <CardHeader>
              <CardTitle className="font-serif">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground">
                For questions about our data sources or to report content issues:
              </p>
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

export default Disclaimer;
