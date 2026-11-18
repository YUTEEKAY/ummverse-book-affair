import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FEATURED_SLOTS, featuredSlot } from '@/lib/featuredBooks';

export default function FeaturedBookField({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  return <div className="space-y-2">
    <Label htmlFor="featured-position">Feature on homepage</Label>
    <Select value={value?.toString() ?? 'none'} onValueChange={value => onChange(featuredSlot(value))}>
      <SelectTrigger id="featured-position"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Not featured</SelectItem>
        {FEATURED_SLOTS.map(slot => <SelectItem key={slot} value={slot.toString()}>Featured position {slot}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>;
}