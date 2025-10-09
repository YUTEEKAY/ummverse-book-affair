import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DiscoverButtonProps {
  currentId: string;
  currentType: "mood" | "genre" | "trope";
}

const DiscoverButton = ({ currentId, currentType }: DiscoverButtonProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDiscover = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Discover button clicked');
    setIsLoading(true);
    
    try {
      // Randomly pick between mood, genre, or trope
      const types = ["mood", "genre", "trope"] as const;
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      let data;
      let error;
      
      // Fetch items based on type
      if (randomType === "mood") {
        const result = await supabase
          .from("moods")
          .select("id")
          .neq("id", currentType === "mood" ? currentId : "00000000-0000-0000-0000-000000000000");
        data = result.data;
        error = result.error;
      } else if (randomType === "genre") {
        const result = await supabase
          .from("genres")
          .select("id")
          .neq("id", currentType === "genre" ? currentId : "00000000-0000-0000-0000-000000000000");
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from("tropes")
          .select("id")
          .neq("id", currentType === "trope" ? currentId : "00000000-0000-0000-0000-000000000000");
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const randomItem = data[Math.floor(Math.random() * data.length)];
        navigate(`/${randomType}/${randomItem.id}`);
      } else {
        toast({
          title: "No other worlds found",
          description: "Try exploring from the home page!",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error discovering:", error);
      toast({
        title: "Oops!",
        description: "Could not discover a new world. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleDiscover}
      disabled={isLoading}
      size="lg"
      className="bg-gradient-to-r from-dusty-rose to-blush hover:from-blush hover:to-dusty-rose text-white shadow-glow transform transition-transform hover:scale-105 relative z-20"
    >
      <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
      {isLoading ? "Discovering..." : "Discover Another World 💞"}
    </Button>
  );
};

export default DiscoverButton;
