import { 
  Wallet, Laptop, TrendingUp, Utensils, Car, ShoppingBag, 
  Zap, Film, Activity, Book, Plane, Home, HelpCircle, 
  Briefcase, Coffee, Gift, Landmark, Smartphone, Wifi, 
  Dumbbell, GraduationCap, Globe, AlertCircle, PiggyBank, Tag
} from 'lucide-react';

const iconMap: Record<string, any> = {
  "Wallet": Wallet, "Laptop": Laptop, "TrendingUp": TrendingUp,
  "Utensils": Utensils, "Car": Car, "ShoppingBag": ShoppingBag,
  "Zap": Zap, "Film": Film, "Activity": Activity, "Book": Book,
  "Plane": Plane, "Home": Home, "Briefcase": Briefcase,
  "Coffee": Coffee, "Gift": Gift, "Landmark": Landmark,
  "Smartphone": Smartphone, "Wifi": Wifi, "Dumbbell": Dumbbell,
  "GraduationCap": GraduationCap, "Globe": Globe,
  "AlertCircle": AlertCircle, "PiggyBank": PiggyBank, "Tag": Tag
};

interface IconProps {
  iconName: string;
  size?: number;
  className?: string;
}

export const CategoryIcon = ({ iconName, size = 20, className = "" }: IconProps) => {
  const IconComponent = iconMap[iconName] || HelpCircle;
  return <IconComponent size={size} className={className} />;
};

export const availableIcons = Object.keys(iconMap);