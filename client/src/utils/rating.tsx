import { Star, StarHalf } from "lucide-react";


export const calculateStars = (rating: number) => {
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i + 1 <= rating) {
      // повна зірка
      stars.push(<Star  className="text-[#636AE8FF]  fill-[#636AE8FF]"size={20} key={i} />);
    } else if (i < rating) {
    
      stars.push(<StarHalf className="text-[#636AE8FF]  fill-[#636AE8FF]" size={20} key ={i}/>);
    }else{
      stars.push(<Star className="text-[#636AE8FF]  " size={20} key ={i}/>);

    }
  }

  return stars;
};
