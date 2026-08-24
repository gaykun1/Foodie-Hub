import { Category } from "../models/Restaurant";

/**
 * The fixed dataset behind the public demo.
 *
 * Coordinates are hard-coded rather than geocoded at seed time so that seeding
 * is deterministic, offline-capable and fast — and so the tracking map always
 * has a sensible route to draw. Everything is centred on Kyiv so a single
 * seeded courier can plausibly serve every restaurant.
 */

export const DEMO_CITY = "Kyiv";
export const DEMO_COUNTRY = "Ukraine";

/** Shared password for every seeded account. Satisfies the server password policy. */
export const DEMO_PASSWORD = "DemoPass123";

export interface SeedDish {
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  typeOfFood: "Appetizers" | "Main Courses" | "Desserts" | "Drinks";
  sold: number;
}

export interface SeedRestaurant {
  title: string;
  description: string;
  about: string;
  imageUrl: string;
  categories: Category[];
  street: string;
  houseNumber: number;
  location: { lat: number; lng: number };
  phone: string;
  websiteUrl: string;
  rating: number;
  startDay: string;
  endDay: string;
  startHour: string;
  endHour: string;
  dishes: SeedDish[];
  reviews: { text: string; rating: number }[];
}

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

export const SEED_RESTAURANTS: SeedRestaurant[] = [
  {
    title: "Ember & Oak",
    description: "Wood-fired steaks and seasonal plates in a warm dining room.",
    about:
      "Ember & Oak has been firing its oak grill since 2016. Everything on the menu passes over live flame at least once, including the vegetables. The dining room seats forty and the bar seats twelve.",
    imageUrl: img("1517248135467-4c7edcad34c4"),
    categories: [Category.FineDining],
    street: "Volodymyrska",
    houseNumber: 20,
    location: { lat: 50.4547, lng: 30.5169 },
    phone: "+380 44 201 3300",
    websiteUrl: "https://emberandoak.example.com",
    rating: 4.7,
    startDay: "Monday",
    endDay: "Sunday",
    startHour: "12:00",
    endHour: "23:00",
    dishes: [
      { title: "Charred Sourdough", description: "Grilled sourdough, cultured butter, sea salt.", price: 6.5, imageUrl: img("1509440159596-0249088772ff"), typeOfFood: "Appetizers", sold: 214 },
      { title: "Oak-Fired Ribeye", description: "300g dry-aged ribeye, bone marrow butter, watercress.", price: 32, imageUrl: img("1546964124-0cce460f38ef"), typeOfFood: "Main Courses", sold: 388 },
      { title: "Smoked Beet Salad", description: "Smoked beets, goat curd, hazelnut, dill oil.", price: 12.5, imageUrl: img("1512621776951-a57141f2eefd"), typeOfFood: "Appetizers", sold: 121 },
      { title: "Burnt Honey Tart", description: "Burnt honey custard, brown butter pastry, creme fraiche.", price: 9, imageUrl: img("1488477181946-6428a0291777"), typeOfFood: "Desserts", sold: 176 },
      { title: "Barrel-Aged Negroni", description: "Gin, vermouth and bitters rested in oak for six weeks.", price: 11, imageUrl: img("1514362545857-3bc16c4c7d1b"), typeOfFood: "Drinks", sold: 143 },
    ],
    reviews: [
      { text: "The ribeye is worth the trip on its own. Perfectly rested.", rating: 5 },
      { text: "Lovely room, attentive staff. The beet salad surprised me.", rating: 5 },
      { text: "Excellent food, though it gets loud after eight.", rating: 4 },
    ],
  },
  {
    title: "Kettle & Crumb",
    description: "All-day bakery and brunch counter with a serious pastry programme.",
    about:
      "A bakery first and a brunch spot second. The laminated pastries are made over three days and the sourdough starter is older than the shop.",
    imageUrl: img("1509042239860-f550ce710b93"),
    categories: [Category.Desserts, Category.Healthy],
    street: "Reitarska",
    houseNumber: 8,
    location: { lat: 50.4526, lng: 30.5104 },
    phone: "+380 44 227 1180",
    websiteUrl: "https://kettleandcrumb.example.com",
    rating: 4.6,
    startDay: "Monday",
    endDay: "Sunday",
    startHour: "07:30",
    endHour: "18:00",
    dishes: [
      { title: "Triple-Baked Croissant", description: "Laminated over three days, baked to order.", price: 4.2, imageUrl: img("1555507036-ab1f4038808a"), typeOfFood: "Desserts", sold: 512 },
      { title: "Green Shakshuka", description: "Soft eggs, chard, herbs, labneh, sourdough soldiers.", price: 13, imageUrl: img("1482049016688-2d3e1b311543"), typeOfFood: "Main Courses", sold: 268 },
      { title: "Seeded Sourdough Loaf", description: "Naturally leavened, 48-hour ferment.", price: 7, imageUrl: img("1585478259715-1c093a7b70d3"), typeOfFood: "Appetizers", sold: 331 },
      { title: "Pistachio Cardamom Bun", description: "Cardamom knot, pistachio cream, rose sugar.", price: 5.4, imageUrl: img("1509440159596-0249088772ff"), typeOfFood: "Desserts", sold: 407 },
      { title: "Single-Origin Filter", description: "Rotating single-origin, brewed by the cup.", price: 3.8, imageUrl: img("1495474472287-4d71bcdd2085"), typeOfFood: "Drinks", sold: 623 },
    ],
    reviews: [
      { text: "Best croissant in the city, and I have tried most of them.", rating: 5 },
      { text: "The green shakshuka is my Saturday ritual now.", rating: 5 },
      { text: "Queue moves fast even at peak. Coffee is excellent.", rating: 4 },
    ],
  },
  {
    title: "Patty Republic",
    description: "Smash burgers, loaded fries and thick shakes. No cutlery required.",
    about:
      "Two griddles, one menu, zero pretension. Beef is ground in-house every morning and smashed to order on a 250C flat top.",
    imageUrl: img("1568901346375-23c9450c58cd"),
    categories: [Category.FastFood],
    street: "Sichovykh Striltsiv",
    houseNumber: 45,
    location: { lat: 50.4593, lng: 30.4938 },
    phone: "+380 44 331 7742",
    websiteUrl: "https://pattyrepublic.example.com",
    rating: 4.4,
    startDay: "Monday",
    endDay: "Sunday",
    startHour: "11:00",
    endHour: "23:30",
    dishes: [
      { title: "Double Smash", description: "Two smashed patties, American cheese, pickles, house sauce.", price: 11.5, imageUrl: img("1568901346375-23c9450c58cd"), typeOfFood: "Main Courses", sold: 894 },
      { title: "Chilli Cheese Fries", description: "Beef chilli, cheese sauce, jalapenos, spring onion.", price: 7.5, imageUrl: img("1573080496219-bb080dd4f877"), typeOfFood: "Appetizers", sold: 512 },
      { title: "Buttermilk Chicken Burger", description: "Buttermilk-brined thigh, slaw, hot honey.", price: 12, imageUrl: img("1606755962773-d324e0a13086"), typeOfFood: "Main Courses", sold: 447 },
      { title: "Salted Malt Shake", description: "Vanilla soft-serve, malt powder, flaky salt.", price: 6, imageUrl: img("1572490122747-3968b75cc699"), typeOfFood: "Drinks", sold: 388 },
      { title: "Fudge Brownie", description: "Dense chocolate brownie, warm, with sea salt.", price: 5.5, imageUrl: img("1607920591413-4ec007e70023"), typeOfFood: "Desserts", sold: 296 },
    ],
    reviews: [
      { text: "Proper smash burger. Crispy edges, no filler.", rating: 5 },
      { text: "Chilli cheese fries are a two-person job. Great value.", rating: 4 },
      { text: "Fast, hot and consistent every single time.", rating: 4 },
    ],
  },
  {
    title: "Verdant",
    description: "Vegetable-forward bowls, grains and cold-pressed juice.",
    about:
      "Verdant works with four growers within ninety kilometres of the city. The menu changes with what arrives on Tuesday mornings.",
    imageUrl: img("1512621776951-a57141f2eefd"),
    categories: [Category.Healthy],
    street: "Khreschatyk",
    houseNumber: 12,
    location: { lat: 50.4478, lng: 30.5232 },
    phone: "+380 44 278 6650",
    websiteUrl: "https://verdant.example.com",
    rating: 4.5,
    startDay: "Monday",
    endDay: "Saturday",
    startHour: "08:00",
    endHour: "20:00",
    dishes: [
      { title: "Harvest Grain Bowl", description: "Freekeh, roast squash, kale, tahini, dukkah.", price: 12.5, imageUrl: img("1512621776951-a57141f2eefd"), typeOfFood: "Main Courses", sold: 356 },
      { title: "Charred Broccoli", description: "Charred tenderstem, almond cream, chilli, lemon.", price: 8, imageUrl: img("1476718406336-bb5a9690ee2a"), typeOfFood: "Appetizers", sold: 187 },
      { title: "Miso Sweet Potato", description: "Whole roast sweet potato, miso butter, sesame.", price: 10, imageUrl: img("1518977676601-b53f82aba655"), typeOfFood: "Main Courses", sold: 224 },
      { title: "Cold-Pressed Green", description: "Cucumber, apple, celery, ginger, lime.", price: 6.5, imageUrl: img("1622597467836-f3285f2131b8"), typeOfFood: "Drinks", sold: 402 },
      { title: "Coconut Chia Pot", description: "Coconut chia, poached rhubarb, toasted oats.", price: 6, imageUrl: img("1488477181946-6428a0291777"), typeOfFood: "Desserts", sold: 158 },
    ],
    reviews: [
      { text: "Actually filling, which most places like this are not.", rating: 5 },
      { text: "The miso sweet potato converted my partner.", rating: 5 },
      { text: "Great food, small room — go early or get it delivered.", rating: 4 },
    ],
  },
  {
    title: "Nori & Rice",
    description: "Hand-rolled maki, donburi and sake, cut to order.",
    about:
      "A ten-seat counter and a delivery kitchen behind it. Fish arrives four times a week and nothing is cut more than an hour before it is served.",
    imageUrl: img("1579871494447-9811cf80d66c"),
    categories: [Category.FineDining, Category.Healthy],
    street: "Velyka Vasylkivska",
    houseNumber: 72,
    location: { lat: 50.4278, lng: 30.5194 },
    phone: "+380 44 495 2210",
    websiteUrl: "https://noriandrice.example.com",
    rating: 4.8,
    startDay: "Tuesday",
    endDay: "Sunday",
    startHour: "12:00",
    endHour: "22:30",
    dishes: [
      { title: "Chef's Nigiri Set", description: "Eight pieces, cut to order from the day's board.", price: 26, imageUrl: img("1579871494447-9811cf80d66c"), typeOfFood: "Main Courses", sold: 341 },
      { title: "Salmon Donburi", description: "Cured salmon, sushi rice, ikura, shiso.", price: 17, imageUrl: img("1546069901-ba9599a7e63c"), typeOfFood: "Main Courses", sold: 289 },
      { title: "Edamame, Burnt Chilli", description: "Steamed edamame, burnt chilli salt.", price: 5.5, imageUrl: img("1564834744159-ff0ea41ba4b9"), typeOfFood: "Appetizers", sold: 402 },
      { title: "Yuzu Sorbet", description: "Sharp yuzu sorbet, candied peel.", price: 6.5, imageUrl: img("1488477181946-6428a0291777"), typeOfFood: "Desserts", sold: 168 },
      { title: "Junmai Sake, 180ml", description: "Chilled junmai, served in a masu.", price: 9.5, imageUrl: img("1514362545857-3bc16c4c7d1b"), typeOfFood: "Drinks", sold: 121 },
    ],
    reviews: [
      { text: "The nigiri set is the best value fine dining in the city.", rating: 5 },
      { text: "Immaculate fish. Book ahead for the counter.", rating: 5 },
      { text: "Delivery arrived cold-chain packed and still perfect.", rating: 5 },
    ],
  },
  {
    title: "Casa Miga",
    description: "Neapolitan pizza from a 450C dome oven, plus small plates.",
    about:
      "Dough is fermented for seventy-two hours and the oven runs at 450C, so a pizza takes ninety seconds. The tomatoes are San Marzano and that is not negotiable.",
    imageUrl: img("1513104890138-7c749659a591"),
    categories: [Category.FastFood, Category.FineDining],
    street: "Andriivskyi Descent",
    houseNumber: 34,
    location: { lat: 50.4592, lng: 30.5164 },
    phone: "+380 44 425 9903",
    websiteUrl: "https://casamiga.example.com",
    rating: 4.6,
    startDay: "Monday",
    endDay: "Sunday",
    startHour: "12:00",
    endHour: "23:00",
    dishes: [
      { title: "Margherita DOP", description: "San Marzano, fior di latte, basil, 72-hour dough.", price: 12, imageUrl: img("1513104890138-7c749659a591"), typeOfFood: "Main Courses", sold: 771 },
      { title: "Nduja & Honey", description: "Spicy nduja, fior di latte, hot honey, oregano.", price: 15, imageUrl: img("1565299624946-b28f40a0ae38"), typeOfFood: "Main Courses", sold: 534 },
      { title: "Burrata & Peach", description: "Whole burrata, grilled peach, basil oil.", price: 11, imageUrl: img("1505253716362-afaea1d3d1af"), typeOfFood: "Appetizers", sold: 246 },
      { title: "Tiramisu al Cucchiaio", description: "Spooned tiramisu, marsala, 24-hour set.", price: 7.5, imageUrl: img("1571877227200-a0d98ea607e9"), typeOfFood: "Desserts", sold: 318 },
      { title: "Blood Orange Spritz", description: "Blood orange, prosecco, soda, rosemary.", price: 8.5, imageUrl: img("1514362545857-3bc16c4c7d1b"), typeOfFood: "Drinks", sold: 205 },
    ],
    reviews: [
      { text: "That crust. Leopard-spotted and light as anything.", rating: 5 },
      { text: "Nduja and honey is a filthy combination. Order it.", rating: 5 },
      { text: "Quick delivery and the pizza was still crisp.", rating: 4 },
    ],
  },
];

/** Delivery address seeded for the demo customer, near the seeded restaurants. */
export const DEMO_ADDRESSES = [
  {
    label: "Home",
    street: "Yaroslaviv Val",
    houseNumber: 15,
    apartmentNumbr: 7,
    city: DEMO_CITY,
    countryOrRegion: DEMO_COUNTRY,
    isDefault: true,
    location: { lat: 50.4519, lng: 30.5116 },
  },
  {
    label: "Office",
    street: "Bohdana Khmelnytskoho",
    houseNumber: 52,
    apartmentNumbr: 300,
    city: DEMO_CITY,
    countryOrRegion: DEMO_COUNTRY,
    isDefault: false,
    location: { lat: 50.4483, lng: 30.4987 },
  },
];

export const DEMO_PROMOCODES = [
  { code: "FOODIE10", discountPercent: 10, type: "Special" as const },
  { code: "WEEKEND15", discountPercent: 15, type: "Usual" as const },
];
