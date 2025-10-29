import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface UserPreferencesProps {
  userId: string;
  preferences: {
    email_recommendations?: boolean;
    email_new_books?: boolean;
  };
  profileVisibility: string;
  onUpdate: () => void;
}

export const UserPreferences = ({ userId, preferences, profileVisibility, onUpdate }: UserPreferencesProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [emailRecommendations, setEmailRecommendations] = useState(preferences.email_recommendations ?? true);
  const [emailNewBooks, setEmailNewBooks] = useState(preferences.email_new_books ?? false);
  const [visibility, setVisibility] = useState(profileVisibility);

  const handleSave = async () => {
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          notification_preferences: {
            email_recommendations: emailRecommendations,
            email_new_books: emailNewBooks,
          },
          profile_visibility: visibility,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Preferences saved",
        description: "Your settings have been updated 💕",
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Manage your account settings and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Email Notifications</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="email-recommendations" className="flex flex-col gap-1 cursor-pointer">
              <span>Book Recommendations</span>
              <span className="text-sm text-muted-foreground font-normal">
                Get personalized book suggestions
              </span>
            </Label>
            <Switch
              id="email-recommendations"
              checked={emailRecommendations}
              onCheckedChange={setEmailRecommendations}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="email-new-books" className="flex flex-col gap-1 cursor-pointer">
              <span>New Books</span>
              <span className="text-sm text-muted-foreground font-normal">
                Notify me when new books are added
              </span>
            </Label>
            <Switch
              id="email-new-books"
              checked={emailNewBooks}
              onCheckedChange={setEmailNewBooks}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Privacy</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="profile-visibility" className="flex flex-col gap-1 cursor-pointer">
              <span>Public Profile</span>
              <span className="text-sm text-muted-foreground font-normal">
                {visibility === "public" ? "Your reviews are visible to everyone" : "Your reviews are private"}
              </span>
            </Label>
            <Switch
              id="profile-visibility"
              checked={visibility === "public"}
              onCheckedChange={(checked) => setVisibility(checked ? "public" : "private")}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={isUpdating} className="w-full">
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
};