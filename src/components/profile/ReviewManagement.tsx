import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star, Trash2, Edit, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Review {
  id: string;
  book_id: string;
  rating: number;
  review_text: string;
  nickname: string;
  created_at: string;
  books?: {
    title: string;
    author: string;
    cover_url: string;
  };
}

interface ReviewManagementProps {
  review: Review;
  onUpdate: () => void;
}

export const ReviewManagement = ({ review, onUpdate }: ReviewManagementProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(review.review_text);
  const [editedRating, setEditedRating] = useState(review.rating);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", review.id);

      if (error) throw error;

      toast({
        title: "Review deleted",
        description: "Your review has been removed 💕",
      });

      onUpdate();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (editedText.trim().length < 10) {
      toast({
        title: "Review too short",
        description: "Please write at least 10 characters",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true);

    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          review_text: editedText,
          rating: editedRating,
        })
        .eq("id", review.id);

      if (error) throw error;

      toast({
        title: "Review updated",
        description: "Your changes have been saved 💕",
      });

      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating review:", error);
      toast({
        title: "Error",
        description: "Failed to update review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {review.books?.cover_url && (
            <Link to={`/book/${review.book_id}`} className="flex-shrink-0">
              <img
                src={review.books.cover_url}
                alt={review.books.title}
                className="w-24 h-36 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
              />
            </Link>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <Link to={`/book/${review.book_id}`} className="hover:underline">
                  <h3 className="font-semibold text-lg">{review.books?.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground">{review.books?.author}</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Your Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Rating</label>
                        <div className="flex gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setEditedRating(star)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= editedRating
                                    ? "fill-rose-500 text-rose-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Review</label>
                        <Textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="mt-2 min-h-[150px]"
                          placeholder="Share your thoughts..."
                        />
                      </div>
                      <Button onClick={handleEdit} disabled={isEditing} className="w-full">
                        {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. Your review will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>

            <p className="text-sm leading-relaxed">{review.review_text}</p>

            <p className="text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};