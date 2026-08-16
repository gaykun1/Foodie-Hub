import { Star, StarHalf } from "lucide-react";
// func that returns array of stars depending on given prop(rating)

export const calculateStars = (rating: number, size?: number) => {
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i + 1 <= rating) {
      stars.push(<Star className="text-brand fill-brand" size={size ?? 20} key={i} />);
    } else if (i < rating) {
      stars.push(<StarHalf className="text-brand fill-brand" size={size ?? 20} key={i} />);
    } else {
      stars.push(<Star className="text-border" size={size ?? 20} key={i} />);
    }
  }

  return stars;
};
