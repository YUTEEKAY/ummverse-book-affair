import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Heart, TrendingUp, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ReadingStatsProps {
  userId: string;
}

export const ReadingStats = ({ userId }: ReadingStatsProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["reading-stats", userId],
    queryFn: async () => {
      // Get total books viewed
      const { count: viewsCount } = await supabase
        .from("book_views")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Get reviews and calculate average rating
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("user_id", userId);

      const avgRating = reviews?.length
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : "0";

      // Get most viewed genres
      const { data: viewedBooks } = await supabase
        .from("book_views")
        .select("book_id, books(genre)")
        .eq("user_id", userId)
        .limit(100);

      const genreCounts: { [key: string]: number } = {};
      viewedBooks?.forEach((view: any) => {
        const genre = view.books?.genre;
        if (genre) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      });

      const topGenre = Object.entries(genreCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "None yet";

      return {
        totalViewed: viewsCount || 0,
        reviewsWritten: reviews?.length || 0,
        avgRating,
        topGenre,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Books Viewed",
      value: stats?.totalViewed || 0,
      icon: BookOpen,
      color: "text-rose-500",
    },
    {
      title: "Reviews Written",
      value: stats?.reviewsWritten || 0,
      icon: Heart,
      color: "text-pink-500",
    },
    {
      title: "Average Rating",
      value: `${stats?.avgRating || 0}★`,
      icon: Star,
      color: "text-amber-500",
    },
    {
      title: "Top Genre",
      value: stats?.topGenre || "None yet",
      icon: TrendingUp,
      color: "text-purple-500",
      isText: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.isText ? 'text-base' : ''}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};