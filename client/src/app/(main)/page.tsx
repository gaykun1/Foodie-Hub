import Banner from "@/components/mainPage/Banner";
import Discount from "@/components/mainPage/Discount";
import DishesNearYou from "@/components/mainPage/DishesNearYou";
import RestaurantsByCategory from "@/components/mainPage/RestaurantsByCategory";


export default function Home() {
  return (
<div>
  <Banner/>
  <RestaurantsByCategory/>
  <Discount/>
  <DishesNearYou/>
</div>
  );
}
