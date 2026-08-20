import type {
  DishGoal,
  Ingredient,
  IngredientRole,
  PreparationMethod,
  SensoryProfile
} from "@flavorpilot/contracts";

const profile = (
  sweetness: number,
  acidity: number,
  saltiness: number,
  bitterness: number,
  umami: number,
  fat: number,
  pungency: number,
  freshness: number,
  aromaIntensity: number,
  moisture: number
): SensoryProfile => ({
  sweetness,
  acidity,
  saltiness,
  bitterness,
  umami,
  fat,
  pungency,
  freshness,
  aromaIntensity,
  moisture
});

export const preparationMethods: PreparationMethod[] = [
  {
    id: "raw",
    name: { en: "Raw", uk: "Без обробки" },
    profileMultiplier: { freshness: 1.12, moisture: 1.05 },
    intensityMultiplier: 1
  },
  {
    id: "seared",
    name: { en: "Seared", uk: "Обсмаження" },
    profileMultiplier: {
      umami: 1.12,
      aromaIntensity: 1.18,
      moisture: 0.88,
      bitterness: 1.08
    },
    intensityMultiplier: 1.12,
    addAromas: ["roasted"],
    addTextures: ["crisp"]
  },
  {
    id: "roasted",
    name: { en: "Roasted", uk: "Запікання" },
    profileMultiplier: {
      sweetness: 1.15,
      umami: 1.1,
      aromaIntensity: 1.2,
      moisture: 0.78
    },
    intensityMultiplier: 1.16,
    addAromas: ["roasted", "caramelized"],
    addTextures: ["firm"]
  },
  {
    id: "grilled",
    name: { en: "Grilled", uk: "На грилі" },
    profileMultiplier: {
      aromaIntensity: 1.28,
      bitterness: 1.18,
      umami: 1.08,
      moisture: 0.76,
      freshness: 0.82
    },
    intensityMultiplier: 1.22,
    addAromas: ["smoky", "roasted"],
    addTextures: ["crisp"]
  },
  {
    id: "boiled",
    name: { en: "Boiled", uk: "Відварювання" },
    profileMultiplier: {
      aromaIntensity: 0.82,
      pungency: 0.72,
      moisture: 1.12
    },
    intensityMultiplier: 0.82,
    addTextures: ["tender"]
  },
  {
    id: "steamed",
    name: { en: "Steamed", uk: "На парі" },
    profileMultiplier: {
      freshness: 1.06,
      aromaIntensity: 0.9,
      moisture: 1.12
    },
    intensityMultiplier: 0.9,
    addTextures: ["tender"]
  },
  {
    id: "pickled",
    name: { en: "Pickled", uk: "Маринування" },
    profileMultiplier: {
      acidity: 1.58,
      saltiness: 1.18,
      freshness: 1.08,
      moisture: 1.04
    },
    intensityMultiplier: 1.2,
    addAromas: ["vinegar"]
  },
  {
    id: "fermented",
    name: { en: "Fermented", uk: "Ферментація" },
    profileMultiplier: {
      umami: 1.38,
      acidity: 1.18,
      aromaIntensity: 1.3
    },
    intensityMultiplier: 1.32,
    addAromas: ["fermented"]
  },
  {
    id: "smoked",
    name: { en: "Smoked", uk: "Копчення" },
    profileMultiplier: {
      aromaIntensity: 1.42,
      umami: 1.12,
      freshness: 0.72,
      moisture: 0.88
    },
    intensityMultiplier: 1.34,
    addAromas: ["smoky"]
  },
  {
    id: "caramelized",
    name: { en: "Caramelized", uk: "Карамелізація" },
    profileMultiplier: {
      sweetness: 1.52,
      bitterness: 1.2,
      aromaIntensity: 1.3,
      moisture: 0.68
    },
    intensityMultiplier: 1.28,
    addAromas: ["caramelized", "roasted"],
    addTextures: ["sticky"]
  },
  {
    id: "pureed",
    name: { en: "Purée", uk: "Пюре" },
    profileMultiplier: { aromaIntensity: 1.04, moisture: 1.04 },
    intensityMultiplier: 1.02,
    addTextures: ["silky", "creamy"]
  },
  {
    id: "sauce",
    name: { en: "Sauce", uk: "Соус" },
    profileMultiplier: { aromaIntensity: 1.08, moisture: 1.08 },
    intensityMultiplier: 1.08,
    addTextures: ["silky"]
  }
];

const all = [
  "raw",
  "seared",
  "roasted",
  "grilled",
  "boiled",
  "steamed",
  "pickled",
  "fermented",
  "smoked",
  "caramelized",
  "pureed",
  "sauce"
];

export const ingredients: Ingredient[] = [
  {
    id: "salmon",
    name: { en: "Salmon", uk: "Лосось" },
    category: { en: "Fish", uk: "Риба" },
    profile: profile(0.8, 0.2, 1.6, 0.2, 7.4, 7.8, 0, 4.8, 6.4, 7.2),
    intensity: 6.2,
    textureIntensity: 4.2,
    aromas: ["marine", "buttery", "umami"],
    textures: ["tender", "flaky"],
    roles: ["base", "fat", "umami"],
    share: { min: 28, ideal: 48, max: 78 },
    preparations: ["raw", "seared", "roasted", "grilled", "smoked"]
  },
  {
    id: "avocado",
    name: { en: "Avocado", uk: "Авокадо" },
    category: { en: "Fruit", uk: "Фрукти" },
    profile: profile(1.2, 0.4, 0.3, 0.4, 2.2, 8.6, 0, 4.6, 2.8, 6.4),
    intensity: 3.2,
    textureIntensity: 2.8,
    aromas: ["green", "nutty", "buttery"],
    textures: ["creamy", "tender"],
    roles: ["fat", "texture"],
    share: { min: 8, ideal: 18, max: 34 },
    preparations: ["raw", "grilled", "pureed"]
  },
  {
    id: "mango",
    name: { en: "Mango", uk: "Манго" },
    category: { en: "Fruit", uk: "Фрукти" },
    profile: profile(8.4, 3.2, 0.1, 0.2, 0.6, 0.4, 0.1, 7.2, 7, 8.4),
    intensity: 6.4,
    textureIntensity: 3.2,
    aromas: ["tropical", "fruity", "floral"],
    textures: ["juicy", "tender"],
    roles: ["sweetener", "freshness"],
    share: { min: 3, ideal: 10, max: 22 },
    preparations: ["raw", "grilled", "pureed", "sauce"]
  },
  {
    id: "lime",
    name: { en: "Lime", uk: "Лайм" },
    category: { en: "Citrus", uk: "Цитрусові" },
    profile: profile(1.2, 9.4, 0.1, 1.4, 0.3, 0.1, 0.2, 9, 8.2, 8.8),
    intensity: 8.6,
    textureIntensity: 1.2,
    aromas: ["citrus", "green", "floral"],
    textures: ["juicy"],
    roles: ["acid", "freshness", "aromatic"],
    share: { min: 1, ideal: 3.2, max: 8 },
    preparations: ["raw", "pickled", "sauce"]
  },
  {
    id: "lemon",
    name: { en: "Lemon", uk: "Лимон" },
    category: { en: "Citrus", uk: "Цитрусові" },
    profile: profile(1.4, 9.1, 0.1, 1.8, 0.3, 0.1, 0.1, 8.8, 7.8, 8.8),
    intensity: 8.2,
    textureIntensity: 1.2,
    aromas: ["citrus", "fresh", "floral"],
    textures: ["juicy"],
    roles: ["acid", "freshness", "aromatic"],
    share: { min: 1, ideal: 3.5, max: 9 },
    preparations: ["raw", "roasted", "pickled", "sauce"]
  },
  {
    id: "chili",
    name: { en: "Chili", uk: "Перець чилі" },
    category: { en: "Spice", uk: "Спеції" },
    profile: profile(1.4, 1.1, 0.3, 0.8, 1, 0.2, 9.6, 6.8, 8, 7.4),
    intensity: 9.4,
    textureIntensity: 2.4,
    aromas: ["green", "peppery", "fruity"],
    textures: ["crisp", "juicy"],
    roles: ["spice", "freshness"],
    share: { min: 0.1, ideal: 0.8, max: 3 },
    preparations: ["raw", "roasted", "grilled", "pickled", "fermented", "sauce"]
  },
  {
    id: "cilantro",
    name: { en: "Cilantro", uk: "Кінза" },
    category: { en: "Herb", uk: "Зелень" },
    profile: profile(0.4, 0.7, 0.1, 1.2, 0.5, 0.1, 0.5, 9.4, 8.6, 7.6),
    intensity: 7.8,
    textureIntensity: 1.8,
    aromas: ["green", "citrus", "herbal"],
    textures: ["tender"],
    roles: ["aromatic", "freshness"],
    share: { min: 0.2, ideal: 1.8, max: 5 },
    preparations: ["raw", "sauce"]
  },
  {
    id: "sesame",
    name: { en: "Sesame", uk: "Кунжут" },
    category: { en: "Seed", uk: "Насіння" },
    profile: profile(1.2, 0.1, 0.4, 1.2, 4.4, 7.4, 0, 1.2, 7.6, 1.2),
    intensity: 6.8,
    textureIntensity: 7.4,
    aromas: ["nutty", "roasted", "earthy"],
    textures: ["crunchy"],
    roles: ["fat", "umami", "texture", "aromatic"],
    share: { min: 0.3, ideal: 2.2, max: 6 },
    preparations: ["raw", "roasted", "sauce"]
  },
  {
    id: "ginger",
    name: { en: "Ginger", uk: "Імбир" },
    category: { en: "Aromatic", uk: "Ароматичні" },
    profile: profile(1.2, 1, 0.1, 1, 1.2, 0.1, 7.8, 8.4, 8.8, 7.2),
    intensity: 8.8,
    textureIntensity: 3.8,
    aromas: ["citrus", "spicy", "woody"],
    textures: ["fibrous", "crisp"],
    roles: ["spice", "aromatic", "freshness"],
    share: { min: 0.3, ideal: 1.8, max: 5 },
    preparations: ["raw", "seared", "pickled", "fermented", "sauce"]
  },
  {
    id: "cucumber",
    name: { en: "Cucumber", uk: "Огірок" },
    category: { en: "Vegetable", uk: "Овочі" },
    profile: profile(1.2, 0.7, 0.1, 0.3, 0.3, 0.1, 0, 9.6, 2.8, 9.8),
    intensity: 2.2,
    textureIntensity: 7.2,
    aromas: ["green", "watery", "fresh"],
    textures: ["crisp", "juicy"],
    roles: ["freshness", "texture"],
    share: { min: 5, ideal: 16, max: 34 },
    preparations: ["raw", "pickled", "pureed"]
  },
  {
    id: "soy_sauce",
    name: { en: "Soy sauce", uk: "Соєвий соус" },
    category: { en: "Seasoning", uk: "Приправи" },
    profile: profile(1.2, 1.1, 9.2, 0.9, 9.4, 0.1, 0.2, 0.4, 8.4, 7.8),
    intensity: 9.2,
    textureIntensity: 1,
    aromas: ["fermented", "umami", "roasted"],
    textures: ["silky"],
    roles: ["umami", "sauce"],
    share: { min: 0.5, ideal: 2.4, max: 6 },
    preparations: ["fermented", "sauce"]
  },
  {
    id: "miso",
    name: { en: "Miso", uk: "Місо" },
    category: { en: "Fermented", uk: "Ферментовані" },
    profile: profile(2.4, 1.2, 7.8, 1, 9.6, 2.2, 0.1, 0.3, 8.8, 5.2),
    intensity: 9.2,
    textureIntensity: 2.8,
    aromas: ["fermented", "umami", "nutty"],
    textures: ["creamy", "sticky"],
    roles: ["umami", "sauce"],
    share: { min: 0.5, ideal: 2.8, max: 7 },
    preparations: ["fermented", "sauce", "roasted"]
  },
  {
    id: "butter",
    name: { en: "Butter", uk: "Вершкове масло" },
    category: { en: "Dairy", uk: "Молочні" },
    profile: profile(0.6, 0.2, 1.2, 0.1, 2.8, 9.8, 0, 0.2, 4.2, 1.6),
    intensity: 4.8,
    textureIntensity: 2.2,
    aromas: ["buttery", "dairy", "creamy"],
    textures: ["creamy", "silky"],
    roles: ["fat", "sauce"],
    share: { min: 1, ideal: 5.5, max: 14 },
    preparations: ["raw", "seared", "sauce", "caramelized"]
  },
  {
    id: "mayonnaise",
    name: { en: "Mayonnaise", uk: "Майонез" },
    category: { en: "Sauce", uk: "Соуси" },
    profile: profile(0.8, 2.3, 2.2, 0.2, 2.4, 9.2, 0.1, 0.6, 3.4, 4.6),
    intensity: 4.6,
    textureIntensity: 2.4,
    aromas: ["creamy", "egg", "vinegar"],
    textures: ["creamy", "silky"],
    roles: ["fat", "sauce"],
    share: { min: 2, ideal: 7, max: 18 },
    preparations: ["sauce"]
  },
  {
    id: "duck",
    name: { en: "Duck", uk: "Качка" },
    category: { en: "Meat", uk: "М’ясо" },
    profile: profile(0.6, 0.1, 1.2, 0.2, 7.8, 8.2, 0, 1.2, 7.2, 5.6),
    intensity: 7.4,
    textureIntensity: 5.4,
    aromas: ["meaty", "gamey", "buttery"],
    textures: ["tender", "firm", "juicy"],
    roles: ["base", "fat", "umami"],
    share: { min: 30, ideal: 52, max: 82 },
    preparations: ["seared", "roasted", "grilled", "smoked"]
  },
  {
    id: "cherry",
    name: { en: "Cherry", uk: "Вишня" },
    category: { en: "Fruit", uk: "Фрукти" },
    profile: profile(7, 6.4, 0.1, 0.7, 0.6, 0.2, 0, 7.4, 7.4, 8.8),
    intensity: 6.8,
    textureIntensity: 3.4,
    aromas: ["red-fruit", "floral", "almond"],
    textures: ["juicy", "tender"],
    roles: ["acid", "sweetener", "freshness"],
    share: { min: 3, ideal: 11, max: 24 },
    preparations: ["raw", "roasted", "pickled", "sauce", "caramelized"]
  },
  {
    id: "rosemary",
    name: { en: "Rosemary", uk: "Розмарин" },
    category: { en: "Herb", uk: "Зелень" },
    profile: profile(0.2, 0.2, 0.1, 3.2, 0.5, 0.4, 1.2, 4.6, 9.4, 2.2),
    intensity: 9.6,
    textureIntensity: 3.8,
    aromas: ["herbal", "pine", "woody"],
    textures: ["fibrous"],
    roles: ["aromatic"],
    share: { min: 0.05, ideal: 0.4, max: 1.5 },
    preparations: ["raw", "roasted", "grilled", "sauce"]
  },
  {
    id: "thyme",
    name: { en: "Thyme", uk: "Чебрець" },
    category: { en: "Herb", uk: "Зелень" },
    profile: profile(0.2, 0.3, 0.1, 2.1, 0.6, 0.2, 0.6, 5.2, 8.4, 2.2),
    intensity: 8.2,
    textureIntensity: 2.8,
    aromas: ["herbal", "woody", "floral"],
    textures: ["tender", "fibrous"],
    roles: ["aromatic"],
    share: { min: 0.08, ideal: 0.5, max: 1.8 },
    preparations: ["raw", "roasted", "grilled", "sauce"]
  },
  {
    id: "orange",
    name: { en: "Orange", uk: "Апельсин" },
    category: { en: "Citrus", uk: "Цитрусові" },
    profile: profile(7.2, 5.4, 0.1, 0.8, 0.3, 0.1, 0, 8.2, 7.2, 9.2),
    intensity: 6.6,
    textureIntensity: 2.8,
    aromas: ["citrus", "fruity", "floral"],
    textures: ["juicy"],
    roles: ["acid", "sweetener", "freshness"],
    share: { min: 2, ideal: 8, max: 20 },
    preparations: ["raw", "roasted", "sauce", "caramelized"]
  },
  {
    id: "balsamic",
    name: { en: "Balsamic vinegar", uk: "Бальзамічний оцет" },
    category: { en: "Vinegar", uk: "Оцет" },
    profile: profile(5.4, 8.2, 0.2, 1.1, 2.2, 0.1, 0, 1.4, 7.8, 7.6),
    intensity: 8.2,
    textureIntensity: 1,
    aromas: ["vinegar", "dark-fruit", "caramelized"],
    textures: ["silky"],
    roles: ["acid", "sweetener", "sauce"],
    share: { min: 0.3, ideal: 1.8, max: 5 },
    preparations: ["sauce", "caramelized"]
  },
  {
    id: "red_wine",
    name: { en: "Red wine", uk: "Червоне вино" },
    category: { en: "Wine", uk: "Вино" },
    profile: profile(2.4, 6.2, 0.1, 3.2, 2.2, 0, 0.3, 1.8, 7.8, 8.8),
    intensity: 7.4,
    textureIntensity: 1,
    aromas: ["red-fruit", "tannic", "earthy"],
    textures: ["silky"],
    roles: ["acid", "aromatic", "sauce"],
    share: { min: 2, ideal: 8, max: 22 },
    preparations: ["raw", "sauce"]
  },
  {
    id: "chicken",
    name: { en: "Chicken", uk: "Курка" },
    category: { en: "Meat", uk: "М’ясо" },
    profile: profile(0.4, 0.1, 1.1, 0.1, 5.8, 3.4, 0, 2.2, 4.4, 6.2),
    intensity: 4.4,
    textureIntensity: 5,
    aromas: ["meaty", "mild", "brothy"],
    textures: ["tender", "fibrous"],
    roles: ["base", "umami"],
    share: { min: 32, ideal: 56, max: 84 },
    preparations: ["seared", "roasted", "grilled", "boiled", "steamed", "smoked"]
  },
  {
    id: "cream",
    name: { en: "Cream", uk: "Вершки" },
    category: { en: "Dairy", uk: "Молочні" },
    profile: profile(1.8, 0.5, 0.5, 0.1, 2.2, 8.8, 0, 0.3, 3.2, 6.8),
    intensity: 3.8,
    textureIntensity: 2,
    aromas: ["dairy", "creamy", "buttery"],
    textures: ["creamy", "silky"],
    roles: ["fat", "sauce"],
    share: { min: 3, ideal: 11, max: 28 },
    preparations: ["raw", "sauce"]
  },
  {
    id: "mushrooms",
    name: { en: "Mushrooms", uk: "Гриби" },
    category: { en: "Fungi", uk: "Гриби" },
    profile: profile(0.8, 0.2, 0.4, 1.2, 8.4, 0.6, 0, 2.2, 7.4, 8.8),
    intensity: 6.8,
    textureIntensity: 5.8,
    aromas: ["earthy", "umami", "woody"],
    textures: ["tender", "firm", "juicy"],
    roles: ["umami", "base", "texture"],
    share: { min: 6, ideal: 18, max: 38 },
    preparations: ["raw", "seared", "roasted", "grilled", "boiled", "pureed"]
  },
  {
    id: "garlic",
    name: { en: "Garlic", uk: "Часник" },
    category: { en: "Aromatic", uk: "Ароматичні" },
    profile: profile(1.6, 0.4, 0.1, 1, 3.8, 0.1, 7.2, 4.2, 9.2, 6.2),
    intensity: 9.2,
    textureIntensity: 3.4,
    aromas: ["sulfurous", "savory", "roasted"],
    textures: ["crisp", "creamy"],
    roles: ["aromatic", "spice", "umami"],
    share: { min: 0.2, ideal: 1.4, max: 4 },
    preparations: ["raw", "seared", "roasted", "grilled", "fermented", "pureed", "sauce"]
  },
  {
    id: "rice_vinegar",
    name: { en: "Rice vinegar", uk: "Рисовий оцет" },
    category: { en: "Vinegar", uk: "Оцет" },
    profile: profile(1.8, 8.8, 0.1, 0.3, 0.6, 0, 0, 4.2, 5.2, 9.2),
    intensity: 7.2,
    textureIntensity: 1,
    aromas: ["vinegar", "clean", "fermented"],
    textures: ["silky"],
    roles: ["acid", "sauce"],
    share: { min: 0.4, ideal: 2, max: 6 },
    preparations: ["sauce", "pickled", "fermented"]
  },
  {
    id: "parmesan",
    name: { en: "Parmesan", uk: "Пармезан" },
    category: { en: "Cheese", uk: "Сир" },
    profile: profile(1, 1.2, 7.8, 1.2, 9.6, 7.2, 0, 0.2, 8.8, 2.2),
    intensity: 9,
    textureIntensity: 7.2,
    aromas: ["dairy", "nutty", "umami", "aged"],
    textures: ["firm", "crunchy"],
    roles: ["umami", "fat", "texture"],
    share: { min: 0.8, ideal: 3.5, max: 10 },
    preparations: ["raw", "roasted", "sauce"]
  },
  {
    id: "blue_cheese",
    name: { en: "Blue cheese", uk: "Блакитний сир" },
    category: { en: "Cheese", uk: "Сир" },
    profile: profile(0.6, 1.8, 7.2, 2.4, 8.8, 8.4, 1.2, 0.1, 9.8, 3.6),
    intensity: 9.8,
    textureIntensity: 4.4,
    aromas: ["dairy", "funky", "aged", "earthy"],
    textures: ["creamy", "crumbly"],
    roles: ["umami", "fat", "aromatic"],
    share: { min: 0.6, ideal: 2.8, max: 7 },
    preparations: ["raw", "sauce"]
  },
  {
    id: "potato",
    name: { en: "Potato", uk: "Картопля" },
    category: { en: "Vegetable", uk: "Овочі" },
    profile: profile(1.2, 0.1, 0.2, 0.2, 2.8, 0.3, 0, 1.2, 2.2, 7.6),
    intensity: 2.2,
    textureIntensity: 6.2,
    aromas: ["earthy", "starchy", "mild"],
    textures: ["creamy", "firm", "crisp"],
    roles: ["base", "texture"],
    share: { min: 12, ideal: 28, max: 58 },
    preparations: ["boiled", "roasted", "grilled", "pureed"]
  },
  {
    id: "pork",
    name: { en: "Pork", uk: "Свинина" },
    category: { en: "Meat", uk: "М’ясо" },
    profile: profile(0.7, 0.1, 1.1, 0.2, 7, 7.2, 0, 1.1, 6.2, 5.8),
    intensity: 6.4,
    textureIntensity: 5.8,
    aromas: ["meaty", "savory", "fatty"],
    textures: ["tender", "fibrous", "juicy"],
    roles: ["base", "fat", "umami"],
    share: { min: 30, ideal: 54, max: 82 },
    preparations: ["seared", "roasted", "grilled", "boiled", "smoked"]
  },
  {
    id: "apple",
    name: { en: "Apple", uk: "Яблуко" },
    category: { en: "Fruit", uk: "Фрукти" },
    profile: profile(6.8, 4.8, 0.1, 0.4, 0.3, 0.1, 0, 8.4, 5.8, 9.1),
    intensity: 5.2,
    textureIntensity: 7.2,
    aromas: ["fruity", "green", "floral"],
    textures: ["crisp", "juicy"],
    roles: ["sweetener", "acid", "freshness", "texture"],
    share: { min: 3, ideal: 11, max: 26 },
    preparations: ["raw", "roasted", "grilled", "pickled", "pureed", "sauce", "caramelized"]
  },
  {
    id: "beetroot",
    name: { en: "Beetroot", uk: "Буряк" },
    category: { en: "Vegetable", uk: "Овочі" },
    profile: profile(6.2, 1.1, 0.4, 1.4, 3.2, 0.2, 0, 3.2, 6.4, 8.2),
    intensity: 6.2,
    textureIntensity: 6,
    aromas: ["earthy", "sweet", "mineral"],
    textures: ["firm", "juicy", "tender"],
    roles: ["base", "sweetener", "texture"],
    share: { min: 7, ideal: 18, max: 38 },
    preparations: ["raw", "roasted", "boiled", "pickled", "pureed"]
  },
  {
    id: "tahini",
    name: { en: "Tahini", uk: "Тахіні" },
    category: { en: "Seed paste", uk: "Паста з насіння" },
    profile: profile(1.2, 0.2, 0.5, 3.2, 4.8, 8.6, 0, 0.4, 7.4, 2.8),
    intensity: 7.4,
    textureIntensity: 2.2,
    aromas: ["sesame", "nutty", "roasted"],
    textures: ["creamy", "sticky"],
    roles: ["fat", "umami", "sauce"],
    share: { min: 1, ideal: 5, max: 13 },
    preparations: ["raw", "roasted", "sauce"]
  },
  {
    id: "pomegranate",
    name: { en: "Pomegranate", uk: "Гранат" },
    category: { en: "Fruit", uk: "Фрукти" },
    profile: profile(6.4, 6.8, 0.1, 1.2, 0.4, 0.1, 0, 8.2, 7.2, 8.8),
    intensity: 6.6,
    textureIntensity: 7.8,
    aromas: ["red-fruit", "floral", "tannic"],
    textures: ["juicy", "crunchy"],
    roles: ["acid", "sweetener", "freshness", "texture"],
    share: { min: 1, ideal: 5, max: 14 },
    preparations: ["raw", "sauce"]
  },
  {
    id: "cauliflower",
    name: { en: "Cauliflower", uk: "Цвітна капуста" },
    category: { en: "Vegetable", uk: "Овочі" },
    profile: profile(1.4, 0.3, 0.3, 0.7, 3.8, 0.2, 0, 4.4, 3.6, 8.2),
    intensity: 3.8,
    textureIntensity: 6.8,
    aromas: ["vegetal", "nutty", "sulfurous"],
    textures: ["firm", "crisp", "tender"],
    roles: ["base", "texture"],
    share: { min: 18, ideal: 38, max: 72 },
    preparations: ["raw", "roasted", "grilled", "boiled", "steamed", "pureed"]
  },
  {
    id: "walnut",
    name: { en: "Walnut", uk: "Волоський горіх" },
    category: { en: "Nut", uk: "Горіхи" },
    profile: profile(1.3, 0.2, 0.2, 3.2, 3.8, 8.8, 0, 0.3, 7.8, 1.2),
    intensity: 7.4,
    textureIntensity: 8.8,
    aromas: ["nutty", "woody", "earthy"],
    textures: ["crunchy", "firm"],
    roles: ["fat", "texture", "aromatic"],
    share: { min: 0.8, ideal: 3.8, max: 10 },
    preparations: ["raw", "roasted", "pureed", "sauce"]
  },
  {
    id: "honey",
    name: { en: "Honey", uk: "Мед" },
    category: { en: "Sweetener", uk: "Підсолоджувачі" },
    profile: profile(9.8, 0.7, 0.1, 0.2, 0.4, 0, 0, 0.4, 6.4, 3.2),
    intensity: 7.2,
    textureIntensity: 2.4,
    aromas: ["floral", "caramelized", "sweet"],
    textures: ["sticky", "silky"],
    roles: ["sweetener", "sauce"],
    share: { min: 0.2, ideal: 1.8, max: 5 },
    preparations: ["raw", "sauce", "caramelized"]
  },
  {
    id: "black_pepper",
    name: { en: "Black pepper", uk: "Чорний перець" },
    category: { en: "Spice", uk: "Спеції" },
    profile: profile(0.2, 0.1, 0.1, 2.8, 0.8, 0.1, 7.4, 1.2, 8.8, 0.8),
    intensity: 9,
    textureIntensity: 2,
    aromas: ["peppery", "woody", "citrus"],
    textures: ["crunchy"],
    roles: ["spice", "aromatic"],
    share: { min: 0.05, ideal: 0.35, max: 1.2 },
    preparations: ["raw", "roasted", "sauce"]
  }
];

export const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
export const preparationById = new Map(
  preparationMethods.map((preparation) => [preparation.id, preparation])
);

const pairKey = (a: string, b: string) => [a, b].sort().join("::");

const entries: Array<[string, string, number]> = [
  ["salmon", "lime", 22],
  ["salmon", "lemon", 21],
  ["salmon", "avocado", 18],
  ["salmon", "mango", 10],
  ["salmon", "cilantro", 14],
  ["salmon", "sesame", 14],
  ["salmon", "ginger", 15],
  ["salmon", "cucumber", 15],
  ["salmon", "soy_sauce", 18],
  ["salmon", "miso", 18],
  ["avocado", "lime", 24],
  ["avocado", "lemon", 20],
  ["avocado", "mango", 12],
  ["avocado", "cilantro", 16],
  ["avocado", "chili", 13],
  ["mango", "lime", 23],
  ["mango", "chili", 18],
  ["mango", "cilantro", 14],
  ["mango", "ginger", 14],
  ["lime", "chili", 16],
  ["lime", "cilantro", 18],
  ["soy_sauce", "ginger", 18],
  ["soy_sauce", "sesame", 19],
  ["miso", "sesame", 17],
  ["duck", "cherry", 25],
  ["duck", "orange", 22],
  ["duck", "rosemary", 17],
  ["duck", "thyme", 17],
  ["duck", "red_wine", 18],
  ["duck", "balsamic", 16],
  ["cherry", "balsamic", 21],
  ["cherry", "red_wine", 18],
  ["cherry", "rosemary", 11],
  ["chicken", "cream", 17],
  ["chicken", "mushrooms", 20],
  ["chicken", "garlic", 18],
  ["chicken", "thyme", 18],
  ["cream", "mushrooms", 21],
  ["cream", "garlic", 14],
  ["mushrooms", "garlic", 20],
  ["mushrooms", "thyme", 20],
  ["mushrooms", "parmesan", 20],
  ["pork", "apple", 23],
  ["pork", "honey", 13],
  ["pork", "rosemary", 15],
  ["beetroot", "blue_cheese", 23],
  ["beetroot", "walnut", 22],
  ["beetroot", "balsamic", 18],
  ["cauliflower", "tahini", 23],
  ["cauliflower", "pomegranate", 18],
  ["cauliflower", "parmesan", 18],
  ["tahini", "lemon", 22],
  ["tahini", "garlic", 17],
  ["pomegranate", "walnut", 15],
  ["blue_cheese", "apple", 22],
  ["blue_cheese", "honey", 20],
  ["blue_cheese", "walnut", 20],
  ["potato", "butter", 20],
  ["potato", "garlic", 18],
  ["potato", "rosemary", 17],
  ["salmon", "blue_cheese", -18],
  ["mango", "rosemary", -14],
  ["duck", "cucumber", -10],
  ["cherry", "soy_sauce", -8]
];

export const explicitPairAdjustments = new Map(
  entries
    .filter(([a, b]) => ingredientById.has(a) && ingredientById.has(b))
    .map(([a, b, value]) => [pairKey(a, b), value])
);

export const getPairAdjustment = (a: string, b: string) =>
  explicitPairAdjustments.get(pairKey(a, b)) ?? 0;

export interface GoalDefinition {
  targetBias: Partial<Record<keyof SensoryProfile, number>>;
  preferredRoles: IngredientRole[];
}

export const goalDefinitions: Record<DishGoal, GoalDefinition> = {
  balanced: { targetBias: {}, preferredRoles: [] },
  fresh: {
    targetBias: { freshness: 1.8, acidity: 0.8, fat: -0.7 },
    preferredRoles: ["freshness", "acid"]
  },
  rich: {
    targetBias: { umami: 1.1, fat: 1.1, aromaIntensity: 0.8 },
    preferredRoles: ["fat", "umami", "sauce"]
  },
  spicy: {
    targetBias: { pungency: 2.4, freshness: 0.4 },
    preferredRoles: ["spice", "freshness"]
  },
  sweetSour: {
    targetBias: { sweetness: 1.5, acidity: 1.6 },
    preferredRoles: ["acid", "sweetener"]
  },
  smoky: {
    targetBias: { aromaIntensity: 1.7, bitterness: 0.6 },
    preferredRoles: ["aromatic", "umami"]
  },
  umami: {
    targetBias: { umami: 2, saltiness: 0.4 },
    preferredRoles: ["umami"]
  },
  light: {
    targetBias: { freshness: 1.3, moisture: 0.8, fat: -1.7 },
    preferredRoles: ["freshness", "acid", "texture"]
  },
  creamy: {
    targetBias: { fat: 1.5, moisture: 0.4 },
    preferredRoles: ["fat", "sauce"]
  },
  crunchy: {
    targetBias: { freshness: 0.5 },
    preferredRoles: ["texture"]
  }
};

export const defaultDish = [
  { ingredientId: "salmon", grams: 180, preparationId: "raw" },
  { ingredientId: "avocado", grams: 80, preparationId: "raw" },
  { ingredientId: "mango", grams: 45, preparationId: "raw" },
  { ingredientId: "lime", grams: 8, preparationId: "raw" }
];

export const publicDishSeeds = [
  {
    id: "seed-salmon-mango",
    name: { en: "Salmon, avocado & mango tartare", uk: "Тартар з лосося, авокадо та манго" },
    author: "@olena.chef",
    goal: "fresh" as DishGoal,
    items: defaultDish,
    saves: 482,
    remixes: 87
  },
  {
    id: "seed-duck-cherry",
    name: { en: "Duck with cherry and rosemary", uk: "Качка з вишнею та розмарином" },
    author: "@marko.kitchen",
    goal: "rich" as DishGoal,
    items: [
      { ingredientId: "duck", grams: 220, preparationId: "seared" },
      { ingredientId: "cherry", grams: 70, preparationId: "sauce" },
      { ingredientId: "rosemary", grams: 1.5, preparationId: "roasted" },
      { ingredientId: "balsamic", grams: 8, preparationId: "sauce" }
    ],
    saves: 713,
    remixes: 132
  },
  {
    id: "seed-cauliflower-tahini",
    name: { en: "Roasted cauliflower, tahini & pomegranate", uk: "Запечена цвітна капуста, тахіні та гранат" },
    author: "@anna.plants",
    goal: "balanced" as DishGoal,
    items: [
      { ingredientId: "cauliflower", grams: 260, preparationId: "roasted" },
      { ingredientId: "tahini", grams: 32, preparationId: "sauce" },
      { ingredientId: "pomegranate", grams: 38, preparationId: "raw" },
      { ingredientId: "lemon", grams: 14, preparationId: "raw" },
      { ingredientId: "garlic", grams: 4, preparationId: "roasted" }
    ],
    saves: 624,
    remixes: 109
  },
  {
    id: "seed-chicken-mushroom",
    name: { en: "Chicken with mushroom cream sauce", uk: "Курка з вершково-грибним соусом" },
    author: "@chef.dan",
    goal: "creamy" as DishGoal,
    items: [
      { ingredientId: "chicken", grams: 210, preparationId: "seared" },
      { ingredientId: "mushrooms", grams: 120, preparationId: "seared" },
      { ingredientId: "cream", grams: 65, preparationId: "sauce" },
      { ingredientId: "garlic", grams: 5, preparationId: "seared" },
      { ingredientId: "thyme", grams: 1, preparationId: "sauce" }
    ],
    saves: 351,
    remixes: 54
  }
];

export const allPreparationIds = all;
