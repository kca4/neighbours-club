/**
 * Delivery vertical seed — 4 Kanata restaurants with full menus.
 *
 * Idempotent: restaurants are upserted by slug; menu items are deleted
 * and recreated per restaurant on each run.
 *
 * Run via:  npm run db:seed:delivery
 */

import { PrismaClient, Prisma } from "@prisma/client";
import type { OperatingHours } from "../../lib/types/delivery";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

/**
 * Build a full weekly hours object.
 * Weekdays = Mon–Fri; weekend = Sat–Sun.
 * Any day listed in closedDays gets isClosed: true.
 */
function buildHours(
  weekdayOpen: string,
  weekdayClose: string,
  weekendOpen: string,
  weekendClose: string,
  closedDays: string[] = []
): OperatingHours {
  return Object.fromEntries(
    DAYS.map((day) => {
      const isWeekend = day === "saturday" || day === "sunday";
      return [
        day,
        {
          open: isWeekend ? weekendOpen : weekdayOpen,
          close: isWeekend ? weekendClose : weekdayClose,
          isClosed: closedDays.includes(day),
        },
      ];
    })
  ) as OperatingHours;
}

/**
 * Generate a placehold.co image URL.
 * bg / fg should be bare hex codes without the leading #.
 */
function ph(
  width: number,
  height: number,
  bg: string,
  text: string,
  fg = "FFFFFF"
): string {
  const cleanBg = bg.replace(/^#/, "");
  const cleanFg = fg.replace(/^#/, "");
  const encoded = encodeURIComponent(text);
  return `https://placehold.co/${width}x${height}/${cleanBg}/${cleanFg}?text=${encoded}`;
}

// ─── Local types ──────────────────────────────────────────────────────────────

interface MenuItemInput {
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  colorHex: string;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
}

interface RestaurantInput {
  name: string;
  slug: string;
  cuisine: string;
  address: string;
  phone: string;
  description: string;
  ownerName: string;
  ownerQuote: string;
  hours: OperatingHours;
  isActive: boolean;
  isPaused: boolean;
  rating: number;
  reviewCount: number;
  estimatedMinMin: number;
  estimatedMinMax: number;
  heroImageUrl: string;
  logoUrl: string;
  menuItems: MenuItemInput[];
}

// ─── Restaurant + menu data ───────────────────────────────────────────────────

const RESTAURANTS: RestaurantInput[] = [
  // ── 1. Kanata Pizza Co. ───────────────────────────────────────────────────
  {
    name: "Kanata Pizza Co.",
    slug: "kanata-pizza-co",
    cuisine: "Pizza · Italian",
    address: "340 Legget Dr, Kanata, ON K2K 1Y6",
    phone: "+16135551001",
    description:
      "Hand-tossed dough, San Marzano tomatoes, and real mozzarella. " +
      "Family-owned and Kanata-rooted since 2018.",
    ownerName: "Marco Ferraro",
    ownerQuote:
      "Every dough ball tells you what it needs — you just have to listen.",
    hours: buildHours("11:00", "22:00", "11:00", "23:00"),
    isActive: true,
    isPaused: false,
    rating: 4.5,
    reviewCount: 142,
    estimatedMinMin: 30,
    estimatedMinMax: 50,
    heroImageUrl: ph(800, 400, "8B0000", "Kanata Pizza Co.", "FAF8F3"),
    logoUrl:      ph(100, 100, "8B0000", "KPC",              "FAF8F3"),
    menuItems: [
      // Most Ordered
      {
        name: "Pepperoni Classico",
        description:
          "House tomato, fior di latte, double pepperoni, fresh basil, extra virgin olive oil.",
        price: 18.99,
        category: "Most Ordered",
        tags: ["popular"],
        colorHex: "#C94A2B",
        imageUrl: ph(400, 400, "C94A2B", "Pepperoni Classico"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "BBQ Chicken Pizza",
        description:
          "Smoky BBQ base, pulled chicken, red onion, aged cheddar, fresh cilantro.",
        price: 19.99,
        category: "Most Ordered",
        tags: ["popular"],
        colorHex: "#C97A35",
        imageUrl: ph(400, 400, "C97A35", "BBQ Chicken Pizza"),
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Garlic Bread",
        description: "Toasted house bread, roasted garlic butter, sea salt, flat-leaf parsley.",
        price: 6.99,
        category: "Most Ordered",
        tags: ["popular", "vegetarian"],
        colorHex: "#C9A040",
        imageUrl: ph(400, 400, "C9A040", "Garlic Bread"),
        isAvailable: true,
        sortOrder: 2,
      },
      // Pizza
      {
        name: "Margherita",
        description:
          "San Marzano tomato, fresh buffalo mozzarella, basil, extra virgin olive oil. Simple and honest.",
        price: 16.99,
        category: "Pizza",
        tags: ["vegetarian"],
        colorHex: "#C94A2B",
        imageUrl: ph(400, 400, "C94A2B", "Margherita"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Pepperoni Classico",
        description:
          "House tomato, fior di latte, double pepperoni, fresh basil, extra virgin olive oil.",
        price: 18.99,
        category: "Pizza",
        tags: ["popular"],
        colorHex: "#C94A2B",
        imageUrl: ph(400, 400, "C94A2B", "Pepperoni Classico"),
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "BBQ Chicken Pizza",
        description:
          "Smoky BBQ base, pulled chicken, red onion, aged cheddar, fresh cilantro.",
        price: 19.99,
        category: "Pizza",
        tags: ["popular"],
        colorHex: "#C97A35",
        imageUrl: ph(400, 400, "C97A35", "BBQ Chicken Pizza"),
        isAvailable: true,
        sortOrder: 2,
      },
      {
        name: "Veggie Supreme",
        description:
          "Roasted peppers, mushrooms, black olives, red onion, baby spinach, feta, tomato base.",
        price: 17.99,
        category: "Pizza",
        tags: ["vegetarian"],
        colorHex: "#5A8C3A",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 3,
      },
      {
        name: "Meat Lovers",
        description:
          "Tomato base, pepperoni, Italian sausage, smoked bacon, ground beef, mozzarella.",
        price: 22.99,
        category: "Pizza",
        tags: [],
        colorHex: "#8B3A1A",
        imageUrl: ph(400, 400, "8B3A1A", "Meat Lovers"),
        isAvailable: true,
        sortOrder: 4,
      },
      // Apps
      {
        name: "Garlic Bread",
        description: "Toasted house bread, roasted garlic butter, sea salt, flat-leaf parsley.",
        price: 6.99,
        category: "Apps",
        tags: ["popular", "vegetarian"],
        colorHex: "#C9A040",
        imageUrl: ph(400, 400, "C9A040", "Garlic Bread"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Mozzarella Sticks",
        description: "House-breaded, golden-fried. Marinara and ranch on the side.",
        price: 10.99,
        category: "Apps",
        tags: ["vegetarian"],
        colorHex: "#D4A850",
        imageUrl: ph(400, 400, "D4A850", "Mozzarella Sticks"),
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Caesar Starter",
        description:
          "Half-portion. Romaine, house Caesar dressing, shaved parmesan, house croutons.",
        price: 9.99,
        category: "Apps",
        tags: ["vegetarian"],
        colorHex: "#8B9B3A",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 2,
      },
      // Chicken
      {
        name: "Honey Garlic Wings",
        description: "1 lb wings, double-fried, tossed in house honey garlic sauce.",
        price: 16.99,
        category: "Chicken",
        tags: ["popular"],
        colorHex: "#C97A35",
        imageUrl: ph(400, 400, "C97A35", "Honey Garlic Wings"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Crispy Chicken Tenders",
        description: "Buttermilk-marinated, golden-fried. Choice of dipping sauce.",
        price: 14.99,
        category: "Chicken",
        tags: [],
        colorHex: "#C9A040",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 1,
      },
      // Salads
      {
        name: "Classic Caesar",
        description: "Full-size. Romaine, house dressing, shaved parmesan, croutons.",
        price: 11.99,
        category: "Salads",
        tags: ["vegetarian"],
        colorHex: "#8B9B3A",
        imageUrl: ph(400, 400, "8B9B3A", "Classic Caesar"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Garden Greek",
        description:
          "Tomato, cucumber, red onion, kalamata olives, bell pepper, feta, oregano vinaigrette.",
        price: 10.99,
        category: "Salads",
        tags: ["vegetarian"],
        colorHex: "#5A8C3A",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 1,
      },
      // Drinks
      {
        name: "Fountain Pop",
        description: "Coke, Diet Coke, Sprite, or Ginger Ale. 500 ml.",
        price: 2.99,
        category: "Drinks",
        tags: [],
        colorHex: "#7AAFC8",
        imageUrl: ph(400, 400, "7AAFC8", "Fountain Pop"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Bottled Water",
        description: "Still, 500 ml.",
        price: 1.99,
        category: "Drinks",
        tags: [],
        colorHex: "#A0C8D8",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Fresh Lemonade",
        description: "Squeezed daily, lightly sweetened. Regular or raspberry.",
        price: 3.99,
        category: "Drinks",
        tags: [],
        colorHex: "#D4C840",
        imageUrl: ph(400, 400, "D4C840", "Fresh Lemonade"),
        isAvailable: true,
        sortOrder: 2,
      },
    ],
  },

  // ── 2. Amir's Shawarma ────────────────────────────────────────────────────
  {
    name: "Amir's Shawarma",
    slug: "amirs-shawarma",
    cuisine: "Middle Eastern · Shawarma",
    address: "5165 Kanata Ave, Kanata, ON K2K 1X7",
    phone: "+16135551002",
    description:
      "Rotisserie-marinated chicken and beef, hand-pressed wraps, and a garlic sauce " +
      "you'll be thinking about for days. Family recipe, Kanata institution.",
    ownerName: "Amir Khalil",
    ownerQuote: "My mother's garlic sauce recipe. Nobody has it. Nobody ever will.",
    hours: buildHours("11:00", "23:00", "11:00", "00:00", ["monday"]),
    isActive: true,
    isPaused: false,
    rating: 4.7,
    reviewCount: 198,
    estimatedMinMin: 25,
    estimatedMinMax: 40,
    heroImageUrl: ph(800, 400, "7B4A1A", "Amir's Shawarma", "FAF8F3"),
    logoUrl:      ph(100, 100, "7B4A1A", "AS",              "FAF8F3"),
    menuItems: [
      // Most Ordered
      {
        name: "Chicken Shawarma Wrap",
        description:
          "Rotisserie chicken, house garlic sauce, pickles, tomato, parsley, fresh pita.",
        price: 13.99,
        category: "Most Ordered",
        tags: ["popular"],
        colorHex: "#C97A35",
        imageUrl: ph(400, 400, "C97A35", "Chicken Shawarma"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Mixed Shawarma Platter",
        description:
          "Chicken and beef over saffron rice. Garlic sauce, hot sauce, salad on the side.",
        price: 21.99,
        category: "Most Ordered",
        tags: ["popular"],
        colorHex: "#8B6B3A",
        imageUrl: ph(400, 400, "8B6B3A", "Mixed Platter"),
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Garlic Potatoes",
        description:
          "Crispy fried potatoes, house garlic sauce. The thing everyone orders twice.",
        price: 5.99,
        category: "Most Ordered",
        tags: ["popular", "vegetarian"],
        colorHex: "#C9B040",
        imageUrl: ph(400, 400, "C9B040", "Garlic Potatoes"),
        isAvailable: true,
        sortOrder: 2,
      },
      // Wraps
      {
        name: "Chicken Shawarma Wrap",
        description:
          "Rotisserie chicken, house garlic sauce, pickles, tomato, parsley, fresh pita.",
        price: 13.99,
        category: "Wraps",
        tags: ["popular"],
        colorHex: "#C97A35",
        imageUrl: ph(400, 400, "C97A35", "Chicken Shawarma"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Beef Shawarma Wrap",
        description:
          "Slow-marinated beef, tahini, pickled turnip, parsley, fresh pita.",
        price: 14.99,
        category: "Wraps",
        tags: [],
        colorHex: "#8B3A1A",
        imageUrl: ph(400, 400, "8B3A1A", "Beef Shawarma"),
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Falafel Wrap",
        description:
          "House-made falafel, tahini, tomato, cucumber, pickled red cabbage.",
        price: 12.99,
        category: "Wraps",
        tags: ["vegetarian"],
        colorHex: "#8B9B3A",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 2,
      },
      {
        name: "Mixed Wrap",
        description: "Half chicken, half beef. Garlic sauce, pickles, tomato, fresh pita.",
        price: 15.99,
        category: "Wraps",
        tags: [],
        colorHex: "#C97A35",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 3,
      },
      // Platters
      {
        name: "Chicken Shawarma Platter",
        description:
          "Rotisserie chicken over saffron rice. Garlic sauce, side salad, pita.",
        price: 19.99,
        category: "Platters",
        tags: [],
        colorHex: "#C97A35",
        imageUrl: ph(400, 400, "C97A35", "Chicken Platter"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Beef Shawarma Platter",
        description:
          "Marinated beef over saffron rice. Tahini, side salad, pita.",
        price: 21.99,
        category: "Platters",
        tags: [],
        colorHex: "#8B3A1A",
        imageUrl: ph(400, 400, "8B3A1A", "Beef Platter"),
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Mixed Shawarma Platter",
        description:
          "Chicken and beef over saffron rice. Garlic sauce, hot sauce, salad on the side.",
        price: 21.99,
        category: "Platters",
        tags: ["popular"],
        colorHex: "#8B6B3A",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 2,
      },
      // Sides
      {
        name: "Garlic Potatoes",
        description:
          "Crispy fried potatoes, house garlic sauce. The thing everyone orders twice.",
        price: 5.99,
        category: "Sides",
        tags: ["popular", "vegetarian"],
        colorHex: "#C9B040",
        imageUrl: ph(400, 400, "C9B040", "Garlic Potatoes"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Hummus & Pita",
        description:
          "Smooth house hummus drizzled with olive oil and za'atar. Two warm pita.",
        price: 7.99,
        category: "Sides",
        tags: ["vegetarian"],
        colorHex: "#D4C8A0",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Tabouleh",
        description:
          "Fresh parsley, bulgur wheat, tomato, lemon, olive oil. Bright and clean.",
        price: 6.99,
        category: "Sides",
        tags: ["vegetarian"],
        colorHex: "#8B9B3A",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 2,
      },
      // Drinks
      {
        name: "Mint Lemonade",
        description: "Fresh mint, lemon, cane sugar. Made in-house daily.",
        price: 4.99,
        category: "Drinks",
        tags: [],
        colorHex: "#8B9B3A",
        imageUrl: ph(400, 400, "8B9B3A", "Mint Lemonade"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Can of Pop",
        description: "Pepsi, Diet Pepsi, or 7UP.",
        price: 2.49,
        category: "Drinks",
        tags: [],
        colorHex: "#7AAFC8",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 1,
      },
    ],
  },

  // ── 3. Sakura Sushi ───────────────────────────────────────────────────────
  {
    name: "Sakura Sushi",
    slug: "sakura-sushi",
    cuisine: "Japanese · Sushi",
    address: "700 Earl Grey Dr, Kanata, ON K2T 1A2",
    phone: "+16135551003",
    description:
      "Daily-fresh nigiri, creative rolls, and bento boxes prepared with precision. " +
      "Kanata's most-loved sushi since 2020.",
    ownerName: "Yuki Tanaka",
    ownerQuote: "Fresh fish, sharp knife, cold hands. That is all.",
    hours: buildHours("12:00", "21:30", "12:00", "22:00", ["tuesday"]),
    isActive: true,
    isPaused: false,
    rating: 4.6,
    reviewCount: 87,
    estimatedMinMin: 30,
    estimatedMinMax: 50,
    heroImageUrl: ph(800, 400, "2D4A6B", "Sakura Sushi", "FAF8F3"),
    logoUrl:      ph(100, 100, "2D4A6B", "SS",          "FAF8F3"),
    menuItems: [
      // Most Ordered
      {
        name: "Dragon Roll",
        description:
          "Shrimp tempura and cucumber inside. Avocado, unagi, tobiko on top. Chef's favourite.",
        price: 17.99,
        category: "Most Ordered",
        tags: ["popular"],
        colorHex: "#C94A6B",
        imageUrl: ph(400, 400, "C94A6B", "Dragon Roll"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Salmon Nigiri (2 pc)",
        description:
          "Atlantic salmon over sushi rice with wasabi. Consumed in one perfect bite.",
        price: 7.99,
        category: "Most Ordered",
        tags: ["popular"],
        colorHex: "#F08060",
        imageUrl: ph(400, 400, "F08060", "Salmon Nigiri"),
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Chicken Teriyaki Bento",
        description:
          "Grilled chicken, steamed rice, miso soup, edamame, gyoza, side salad.",
        price: 18.99,
        category: "Most Ordered",
        tags: ["popular"],
        colorHex: "#C97A35",
        imageUrl: ph(400, 400, "C97A35", "Chicken Bento"),
        isAvailable: true,
        sortOrder: 2,
      },
      // Rolls
      {
        name: "Dragon Roll",
        description:
          "Shrimp tempura and cucumber inside. Avocado, unagi, tobiko on top. Chef's favourite.",
        price: 17.99,
        category: "Rolls",
        tags: ["popular"],
        colorHex: "#C94A6B",
        imageUrl: ph(400, 400, "C94A6B", "Dragon Roll"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "California Roll",
        description: "Crab, avocado, cucumber. Classic and consistent.",
        price: 12.99,
        category: "Rolls",
        tags: [],
        colorHex: "#D4A850",
        imageUrl: ph(400, 400, "D4A850", "California Roll"),
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Spicy Tuna Roll",
        description: "Bluefin tuna, spicy mayo, cucumber, sriracha drizzle.",
        price: 14.99,
        category: "Rolls",
        tags: ["spicy"],
        colorHex: "#C94A2B",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 2,
      },
      {
        name: "Veggie Roll",
        description:
          "Cucumber, avocado, sweet potato, pickled daikon, sesame seed.",
        price: 11.99,
        category: "Rolls",
        tags: ["vegetarian"],
        colorHex: "#5A8C3A",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 3,
      },
      {
        name: "Tiger Roll",
        description:
          "Salmon and cream cheese inside. Spicy mayo, mango, pickled jalapeño on top.",
        price: 16.99,
        category: "Rolls",
        tags: ["spicy"],
        colorHex: "#C97A35",
        imageUrl: ph(400, 400, "C97A35", "Tiger Roll"),
        isAvailable: true,
        sortOrder: 4,
      },
      // Nigiri
      {
        name: "Salmon Nigiri (2 pc)",
        description:
          "Atlantic salmon over sushi rice with wasabi. Consumed in one perfect bite.",
        price: 7.99,
        category: "Nigiri",
        tags: ["popular"],
        colorHex: "#F08060",
        imageUrl: ph(400, 400, "F08060", "Salmon Nigiri"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Tuna Nigiri (2 pc)",
        description: "Fresh bluefin tuna, sushi rice, wasabi.",
        price: 8.99,
        category: "Nigiri",
        tags: [],
        colorHex: "#C94A6B",
        imageUrl: ph(400, 400, "C94A6B", "Tuna Nigiri"),
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Ebi Nigiri (2 pc)",
        description: "Steamed prawn, sushi rice, wasabi.",
        price: 7.49,
        category: "Nigiri",
        tags: [],
        colorHex: "#F0A080",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 2,
      },
      {
        name: "Tamago Nigiri (2 pc)",
        description: "Sweet Japanese egg omelette over sushi rice.",
        price: 5.99,
        category: "Nigiri",
        tags: ["vegetarian"],
        colorHex: "#D4C840",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 3,
      },
      // Bento
      {
        name: "Chicken Teriyaki Bento",
        description:
          "Grilled chicken, steamed rice, miso soup, edamame, gyoza, side salad.",
        price: 18.99,
        category: "Bento",
        tags: ["popular"],
        colorHex: "#C97A35",
        imageUrl: ph(400, 400, "C97A35", "Chicken Bento"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Salmon Sashimi Bento",
        description:
          "Six-piece salmon sashimi, steamed rice, miso soup, edamame, pickled ginger.",
        price: 22.99,
        category: "Bento",
        tags: [],
        colorHex: "#F08060",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 1,
      },
      // Drinks
      {
        name: "Ramune",
        description: "Original, strawberry, or watermelon. The glass marble bottle.",
        price: 4.49,
        category: "Drinks",
        tags: [],
        colorHex: "#7AAFC8",
        imageUrl: ph(400, 400, "7AAFC8", "Ramune"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Green Tea",
        description: "Hot or iced genmaicha. Brewed daily.",
        price: 3.49,
        category: "Drinks",
        tags: [],
        colorHex: "#8B9B3A",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 1,
      },
    ],
  },

  // ── 4. Stack'd Burgers ────────────────────────────────────────────────────
  {
    name: "Stack'd Burgers",
    slug: "stackd-burgers",
    cuisine: "Burgers · American",
    address: "600 March Rd, Kanata, ON K2K 2M5",
    phone: "+16135551004",
    description:
      "Smash-style patties, hand-formed daily. Brioche buns baked this morning. " +
      "No freezer. No exceptions.",
    ownerName: "Devon Marchetti",
    ownerQuote:
      "A great burger is just respect — for the beef, the bun, and the person eating it.",
    hours: buildHours("11:00", "22:00", "11:00", "23:00"),
    isActive: true,
    isPaused: false,
    rating: 4.4,
    reviewCount: 63,
    estimatedMinMin: 25,
    estimatedMinMax: 45,
    heroImageUrl: ph(800, 400, "8B3A1A", "Stack'd Burgers", "FAF8F3"),
    logoUrl:      ph(100, 100, "8B3A1A", "SB",              "FAF8F3"),
    menuItems: [
      // Most Ordered
      {
        name: "The Classic Smash",
        description:
          "Double smash patty, American cheese, house sauce, pickles, white onion, brioche.",
        price: 14.99,
        category: "Most Ordered",
        tags: ["popular"],
        colorHex: "#C97A35",
        imageUrl: ph(400, 400, "C97A35", "Classic Smash"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Bacon Cheddar Stack",
        description:
          "Double patty, aged cheddar, smoked bacon, caramelized onion, garlic aioli, brioche.",
        price: 17.99,
        category: "Most Ordered",
        tags: ["popular"],
        colorHex: "#C94A2B",
        imageUrl: ph(400, 400, "C94A2B", "Bacon Cheddar"),
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Seasoned Fries",
        description: "Fresh-cut, double-fried, house seasoning blend.",
        price: 5.99,
        category: "Most Ordered",
        tags: ["popular", "vegetarian"],
        colorHex: "#C9A040",
        imageUrl: ph(400, 400, "C9A040", "Seasoned Fries"),
        isAvailable: true,
        sortOrder: 2,
      },
      // Burgers
      {
        name: "The Classic Smash",
        description:
          "Double smash patty, American cheese, house sauce, pickles, white onion, brioche.",
        price: 14.99,
        category: "Burgers",
        tags: ["popular"],
        colorHex: "#C97A35",
        imageUrl: ph(400, 400, "C97A35", "Classic Smash"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Bacon Cheddar Stack",
        description:
          "Double patty, aged cheddar, smoked bacon, caramelized onion, garlic aioli, brioche.",
        price: 17.99,
        category: "Burgers",
        tags: ["popular"],
        colorHex: "#C94A2B",
        imageUrl: ph(400, 400, "C94A2B", "Bacon Cheddar"),
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Mushroom Swiss",
        description:
          "Single patty, sautéed cremini mushrooms, Swiss cheese, garlic mayo, arugula.",
        price: 16.99,
        category: "Burgers",
        tags: [],
        colorHex: "#8B6B3A",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 2,
      },
      {
        name: "Spicy Jalapeño",
        description:
          "Double patty, pepper jack, pickled jalapeños, chipotle mayo, crispy onion.",
        price: 16.99,
        category: "Burgers",
        tags: ["spicy"],
        colorHex: "#C94A2B",
        imageUrl: ph(400, 400, "C94A2B", "Spicy Jalapeno"),
        isAvailable: true,
        sortOrder: 3,
      },
      {
        name: "The Veggie Stack",
        description:
          "House lentil-mushroom patty, avocado, tomato, pickled red onion, sriracha mayo.",
        price: 15.99,
        category: "Burgers",
        tags: ["vegetarian"],
        colorHex: "#5A8C3A",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 4,
      },
      // Sides
      {
        name: "Seasoned Fries",
        description: "Fresh-cut, double-fried, house seasoning blend.",
        price: 5.99,
        category: "Sides",
        tags: ["popular", "vegetarian"],
        colorHex: "#C9A040",
        imageUrl: ph(400, 400, "C9A040", "Seasoned Fries"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Onion Rings",
        description: "Beer-battered, fried golden. House chipotle dip.",
        price: 6.99,
        category: "Sides",
        tags: ["vegetarian"],
        colorHex: "#C9B040",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 1,
      },
      {
        name: "Poutine",
        description: "Fries, Quebec cheese curds, house-made gravy. The real one.",
        price: 9.99,
        category: "Sides",
        tags: ["popular"],
        colorHex: "#C97A35",
        imageUrl: ph(400, 400, "C97A35", "Poutine"),
        isAvailable: true,
        sortOrder: 2,
      },
      // Shakes
      {
        name: "Vanilla Shake",
        description: "Thick, hand-spun. Madagascar vanilla bean, 12 oz.",
        price: 7.99,
        category: "Shakes",
        tags: ["vegetarian"],
        colorHex: "#F0E8D0",
        imageUrl: ph(400, 400, "F0E8D0", "Vanilla Shake", "1A1A2E"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Chocolate Shake",
        description: "Rich Belgian cocoa, cream, real chocolate chips. 12 oz.",
        price: 7.99,
        category: "Shakes",
        tags: ["vegetarian"],
        colorHex: "#8B5E3A",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 1,
      },
      // Drinks
      {
        name: "Fountain Pop",
        description: "Coke, Diet Coke, Sprite, or Dr. Pepper. 500 ml.",
        price: 2.99,
        category: "Drinks",
        tags: [],
        colorHex: "#7AAFC8",
        imageUrl: ph(400, 400, "7AAFC8", "Fountain Pop"),
        isAvailable: true,
        sortOrder: 0,
      },
      {
        name: "Bottled Water",
        description: "Still, 500 ml.",
        price: 1.99,
        category: "Drinks",
        tags: [],
        colorHex: "#A0C8D8",
        imageUrl: null,
        isAvailable: true,
        sortOrder: 1,
      },
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Ensure the Kanata neighbourhood exists
  const kanata = await prisma.neighbourhood.upsert({
    where: { slug: "kanata" },
    update: { isActive: true },
    create: {
      name: "Kanata",
      slug: "kanata",
      city: "Ottawa",
      isActive: true,
    },
  });
  console.log(`✓ Neighbourhood: ${kanata.name} (${kanata.id})`);

  for (const r of RESTAURANTS) {
    const { menuItems, hours, ...rest } = r;

    // Upsert restaurant by slug
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: r.slug },
      update: {
        ...rest,
        hours: hours as unknown as Prisma.InputJsonValue,
        neighbourhoodId: kanata.id,
      },
      create: {
        ...rest,
        hours: hours as unknown as Prisma.InputJsonValue,
        neighbourhoodId: kanata.id,
      },
    });

    // Replace all menu items (idempotent)
    await prisma.menuItem.deleteMany({ where: { restaurantId: restaurant.id } });
    await prisma.menuItem.createMany({
      data: menuItems.map((item) => ({ ...item, restaurantId: restaurant.id })),
    });

    const itemCounts = menuItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {});
    const summary = Object.entries(itemCounts)
      .map(([cat, n]) => `${cat}(${n})`)
      .join(", ");

    console.log(`✓ ${restaurant.name}: ${menuItems.length} items — ${summary}`);
  }

  console.log("\nDelivery seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
