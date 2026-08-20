import type {
  DishGoal,
  IssueCode,
  RecommendationReason,
  SensoryDimension
} from "@flavorpilot/flavor-engine";
import type { Locale } from "./config";

export interface Dictionary {
  meta: { title: string; description: string };
  brand: { name: string; descriptor: string };
  nav: {
    builder: string;
    discover: string;
    library: string;
    pricing: string;
    start: string;
  };
  common: {
    add: string;
    remove: string;
    save: string;
    saved: string;
    cancel: string;
    close: string;
    grams: string;
    score: string;
    ingredients: string;
    preparation: string;
    search: string;
    noResults: string;
    demo: string;
    language: string;
    basedOn: string;
    view: string;
    remix: string;
    remixes: string;
    saves: string;
    public: string;
    private: string;
    unlisted: string;
  };
  home: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    liveLabel: string;
    explanationTitle: string;
    explanation: string;
    addSuggestion: string;
    engineTitle: string;
    engineSubtitle: string;
    step1Title: string;
    step1Text: string;
    step2Title: string;
    step2Text: string;
    step3Title: string;
    step3Text: string;
    socialTitle: string;
    socialText: string;
    privateTitle: string;
    privateText: string;
    closingTitle: string;
    closingText: string;
    closingCta: string;
  };
  builder: {
    title: string;
    subtitle: string;
    dishName: string;
    dishNamePlaceholder: string;
    addIngredient: string;
    ingredientSearchPlaceholder: string;
    direction: string;
    composition: string;
    analysis: string;
    overall: string;
    compatibility: string;
    balance: string;
    quantity: string;
    texture: string;
    confidence: string;
    profile: string;
    insights: string;
    noIssues: string;
    engineSummary: string;
    bestNextMove: string;
    recommendations: string;
    recommendationHelp: string;
    compatibilityLabel: string;
    utilityLabel: string;
    expectedChange: string;
    pairs: string;
    pair: string;
    aromaOverlap: string;
    saveDish: string;
    visibility: string;
    visibilityHelp: string;
    savedLocally: string;
    saveFailed: string;
    reset: string;
    emptyTitle: string;
    emptyText: string;
    maxItems: string;
    duplicate: string;
    privateLimit: string;
    complement: string;
  };
  discover: {
    eyebrow: string;
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    trending: string;
    all: string;
    publicDishes: string;
    openBuilder: string;
    lineage: string;
  };
  library: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyText: string;
    create: string;
    localNotice: string;
    delete: string;
    open: string;
  };
  pricing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    monthly: string;
    freeName: string;
    freePrice: string;
    freeDescription: string;
    proName: string;
    proPrice: string;
    proDescription: string;
    studioName: string;
    studioPrice: string;
    studioDescription: string;
    popular: string;
    choose: string;
    current: string;
    featurePublic: string;
    featurePrivate3: string;
    featureBasicAnalysis: string;
    featureUnlimitedPrivate: string;
    featureAdvancedAnalysis: string;
    featureVersions: string;
    featureQuantity: string;
    featureCosting: string;
    featureNutrition: string;
    featureScaling: string;
    featureExport: string;
    note: string;
  };
  goals: Record<DishGoal, string>;
  dimensions: Record<SensoryDimension, string>;
  issues: Record<IssueCode, string>;
  reasons: Record<RecommendationReason, string>;
  visibility: {
    publicTitle: string;
    publicText: string;
    unlistedTitle: string;
    unlistedText: string;
    privateTitle: string;
    privateText: string;
  };
}

const en: Dictionary = {
  meta: {
    title: "FlavorPilot — live flavor simulator for chefs",
    description:
      "Build a dish, model its sensory balance, and see what to add, remove or adjust."
  },
  brand: { name: "FlavorPilot", descriptor: "Flavor simulator" },
  nav: {
    builder: "Builder",
    discover: "Discover",
    library: "My dishes",
    pricing: "Pricing",
    start: "Start creating"
  },
  common: {
    add: "Add",
    remove: "Remove",
    save: "Save",
    saved: "Saved",
    cancel: "Cancel",
    close: "Close",
    grams: "g",
    score: "Score",
    ingredients: "Ingredients",
    preparation: "Preparation",
    search: "Search",
    noResults: "Nothing found",
    demo: "MVP demo",
    language: "Language",
    basedOn: "Based on",
    view: "View",
    remix: "Remix",
    remixes: "remixes",
    saves: "saves",
    public: "Public",
    private: "Private",
    unlisted: "Link only"
  },
  home: {
    eyebrow: "A live flavor engine — not another recipe list",
    titleA: "Build the dish.",
    titleB: "Understand the taste.",
    subtitle:
      "FlavorPilot models ingredient compatibility, quantities, preparation, texture and balance in real time — then explains what to change and why.",
    primaryCta: "Open the builder",
    secondaryCta: "Explore public dishes",
    liveLabel: "Live dish analysis",
    explanationTitle: "What the engine sees",
    explanation:
      "The pairing is strong, but fat is high relative to acidity. Mango is close to becoming dominant. Increase lime to 11–14 g or reduce mango to 30–40 g.",
    addSuggestion: "Best next move: add cucumber for freshness and texture.",
    engineTitle: "From ingredients to a measurable composition",
    engineSubtitle:
      "Every change updates compatibility and usefulness separately. A compatible ingredient is not always useful for the dish you are building.",
    step1Title: "Construct",
    step1Text: "Add ingredients, grams, preparation and a sensory direction.",
    step2Title: "Analyze",
    step2Text: "See compatibility, balance, quantity, texture and pair-level explanations.",
    step3Title: "Improve",
    step3Text: "Get ranked additions with expected impact and recommended dosage.",
    socialTitle: "A living library of dishes",
    socialText:
      "Publish compositions, discover other chefs, and remix a dish while preserving its lineage.",
    privateTitle: "Public by choice. Private for professionals.",
    privateText:
      "Free users can share publicly and keep a few private drafts. Pro unlocks unlimited private recipes and versions.",
    closingTitle: "Start with the flavor, not the template",
    closingText:
      "The current MVP runs locally and already includes the deterministic engine, bilingual UI, public examples and private local drafts.",
    closingCta: "Create a dish"
  },
  builder: {
    title: "Dish builder",
    subtitle: "Add an ingredient, see the effect, understand why, choose the next move.",
    dishName: "Dish name",
    dishNamePlaceholder: "e.g. Salmon tartare v2",
    addIngredient: "Add ingredient",
    ingredientSearchPlaceholder: "Search salmon, lime, miso…",
    direction: "Direction",
    composition: "Composition",
    analysis: "Analysis",
    overall: "Overall score",
    compatibility: "Compatibility",
    balance: "Balance",
    quantity: "Quantity",
    texture: "Texture",
    confidence: "Confidence",
    profile: "Sensory profile",
    insights: "Chef notes",
    noIssues: "The composition is balanced. Fine-tune it through the recommendations below.",
    engineSummary: "What the engine sees",
    bestNextMove: "Best next move",
    recommendations: "What to add next",
    recommendationHelp:
      "Compatibility shows whether the ingredient works with the dish. Utility shows whether it improves the current composition.",
    compatibilityLabel: "Compatibility",
    utilityLabel: "Utility",
    expectedChange: "balance",
    pairs: "Ingredient pairs",
    pair: "Pair",
    aromaOverlap: "Aroma overlap",
    saveDish: "Save dish",
    visibility: "Who can see it?",
    visibilityHelp:
      "Public dishes can appear in discovery. Link-only dishes are not indexed. Private drafts stay in your library.",
    savedLocally: "Saved in this browser. Account sync will use the Nest API after sign-in is connected.",
    reset: "Reset demo",
    emptyTitle: "Start with a base ingredient",
    emptyText: "Choose one ingredient and the engine will suggest the next step.",
    maxItems: "The MVP supports up to 12 ingredients per dish.",
    duplicate: "This ingredient is already in the dish. Adjust its quantity instead.",
    privateLimit: "The Free plan includes 3 private drafts. Make this dish public or link-only, or connect billing for Pro.",
    complement: "Complement"
  },
  discover: {
    eyebrow: "Community compositions",
    title: "Discover, understand and remix",
    subtitle:
      "Public dishes are not static posts. Open one in the builder and see how every change affects the composition.",
    searchPlaceholder: "Search dishes or ingredients",
    trending: "Trending now",
    all: "All dishes",
    publicDishes: "Public dishes",
    openBuilder: "Open in builder",
    lineage: "Original composition and future remixes remain connected."
  },
  library: {
    title: "My dishes",
    subtitle: "Your local drafts, public compositions and link-only experiments.",
    emptyTitle: "No saved dishes yet",
    emptyText: "Create a composition in the builder and save it here.",
    create: "Create first dish",
    localNotice:
      "Anonymous dishes stay in browser localStorage. The Nest API and PostgreSQL endpoints are ready; sign-in UI is the next integration.",
    delete: "Delete",
    open: "Open in builder"
  },
  pricing: {
    eyebrow: "Simple SaaS model",
    title: "Share freely. Keep professional work private.",
    subtitle:
      "The prices are launch hypotheses. The first goal is to test whether chefs pay for deeper analysis and private workspace.",
    monthly: "/ month",
    freeName: "Free",
    freePrice: "€0",
    freeDescription: "For exploring the engine and sharing public ideas.",
    proName: "Pro Chef",
    proPrice: "€14.90",
    proDescription: "For chefs who develop dishes and need private space.",
    studioName: "Chef Studio",
    studioPrice: "€29",
    studioDescription: "For full recipe development and operational calculations.",
    popular: "Recommended",
    choose: "Choose plan",
    current: "Included in MVP",
    featurePublic: "Unlimited public dishes",
    featurePrivate3: "3 private drafts",
    featureBasicAnalysis: "Core compatibility and balance",
    featureUnlimitedPrivate: "Unlimited private dishes",
    featureAdvancedAnalysis: "Add / remove / replace with dosage",
    featureVersions: "Recipe versions and remix lineage",
    featureQuantity: "Advanced quantity optimization",
    featureCosting: "Food cost and margin",
    featureNutrition: "Nutrition and allergens",
    featureScaling: "Scaling and yield",
    featureExport: "Technical card and export",
    note: "Checkout is intentionally not connected in this MVP. Add Stripe after interviewing early users and validating the paywall."
  },
  goals: {
    balanced: "Balanced",
    fresh: "Fresh",
    rich: "Rich",
    spicy: "Spicy",
    sweetSour: "Sweet & sour",
    smoky: "Smoky",
    umami: "Umami",
    light: "Light",
    creamy: "Creamy",
    crunchy: "Crunchy"
  },
  dimensions: {
    sweetness: "Sweetness",
    acidity: "Acidity",
    saltiness: "Saltiness",
    bitterness: "Bitterness",
    umami: "Umami",
    fat: "Fat",
    pungency: "Pungency",
    freshness: "Freshness",
    aromaIntensity: "Aroma",
    moisture: "Moisture"
  },
  issues: {
    emptyDish: "Add an ingredient to begin the analysis.",
    singleIngredient: "A single ingredient has no pair compatibility yet. Add a supporting component.",
    fatNeedsAcid: "Fat is high relative to acidity. Add a fresh acidic component.",
    tooSweet: "Sweetness is dominating without enough acidity or bitterness.",
    tooIntense: "The total flavor intensity is high. Reduce strong aromatics or add a neutral base.",
    lowFreshness: "The dish feels heavy. A fresh or watery component could open it up.",
    dominantIngredient: "{ingredient} is dominating the composition at the current quantity.",
    flatTexture: "Texture contrast is limited. Consider a crisp or crunchy element.",
    highSalt: "Saltiness is above a safe sensory range. Reduce salty sauces or cheese.",
    lowUmami: "The dish may lack savory depth. Consider a measured umami component."
  },
  reasons: {
    strongPairing: "strong pairing",
    addsAcidity: "adds acidity",
    balancesFat: "balances fat",
    addsFreshness: "adds freshness",
    addsUmami: "adds umami",
    addsSweetness: "adds sweetness",
    addsPungency: "adds heat",
    addsCrunch: "adds crunch",
    supportsGoal: "supports direction",
    improvesBalance: "improves balance"
  },
  visibility: {
    publicTitle: "Public",
    publicText: "Visible in discovery and on your profile.",
    unlistedTitle: "Link only",
    unlistedText: "Not searchable; anyone with the link can open it.",
    privateTitle: "Private",
    privateText: "Visible only in your workspace. Unlimited on Pro."
  }
};

const uk: Dictionary = {
  meta: {
    title: "FlavorPilot — живий симулятор смаку для кухарів",
    description:
      "Створюйте страву, моделюйте її сенсорний баланс і бачте, що додати, прибрати або змінити."
  },
  brand: { name: "FlavorPilot", descriptor: "Симулятор смаку" },
  nav: {
    builder: "Конструктор",
    discover: "Огляд",
    library: "Мої страви",
    pricing: "Тарифи",
    start: "Почати створення"
  },
  common: {
    add: "Додати",
    remove: "Видалити",
    save: "Зберегти",
    saved: "Збережено",
    cancel: "Скасувати",
    close: "Закрити",
    grams: "г",
    score: "Оцінка",
    ingredients: "Інгредієнти",
    preparation: "Обробка",
    search: "Пошук",
    noResults: "Нічого не знайдено",
    demo: "MVP-демо",
    language: "Мова",
    basedOn: "На основі",
    view: "Переглянути",
    remix: "Ремікс",
    remixes: "реміксів",
    saves: "збережень",
    public: "Публічна",
    private: "Приватна",
    unlisted: "За посиланням"
  },
  home: {
    eyebrow: "Живий рушій смаку — не черговий каталог рецептів",
    titleA: "Створіть страву.",
    titleB: "Зрозумійте її смак.",
    subtitle:
      "FlavorPilot у реальному часі моделює сумісність продуктів, кількість, обробку, текстуру й баланс — а потім пояснює, що змінити і чому.",
    primaryCta: "Відкрити конструктор",
    secondaryCta: "Дивитися публічні страви",
    liveLabel: "Живий аналіз страви",
    explanationTitle: "Що бачить рушій",
    explanation:
      "Поєднання сильне, але жирність завелика відносно кислотності. Манго майже починає домінувати. Збільште лайм до 11–14 г або зменште манго до 30–40 г.",
    addSuggestion: "Найкращий наступний крок: додати огірок для свіжості й текстури.",
    engineTitle: "Від списку продуктів до вимірюваної композиції",
    engineSubtitle:
      "Кожна зміна окремо оновлює сумісність і корисність. Сумісний продукт не завжди корисний саме для поточної страви.",
    step1Title: "Створюйте",
    step1Text: "Додавайте інгредієнти, грами, спосіб обробки та смаковий напрям.",
    step2Title: "Аналізуйте",
    step2Text: "Бачте сумісність, баланс, кількість, текстуру й пояснення для кожної пари.",
    step3Title: "Покращуйте",
    step3Text: "Отримуйте ранжовані доповнення з прогнозом ефекту й рекомендованою дозою.",
    socialTitle: "Жива бібліотека страв",
    socialText:
      "Публікуйте композиції, знаходьте інших кухарів і створюйте ремікси зі збереженням авторської лінії.",
    privateTitle: "Публічно — за вибором. Приватно — для професіоналів.",
    privateText:
      "Безплатні користувачі можуть ділитися стравами й мати кілька приватних чернеток. Pro відкриває необмежену приватність і версії.",
    closingTitle: "Почніть зі смаку, а не з шаблону",
    closingText:
      "Поточний MVP працює локально й уже містить детермінований рушій, двомовний інтерфейс, публічні приклади та приватні локальні чернетки.",
    closingCta: "Створити страву"
  },
  builder: {
    title: "Конструктор страви",
    subtitle: "Додайте продукт, побачте ефект, зрозумійте причину й оберіть наступний крок.",
    dishName: "Назва страви",
    dishNamePlaceholder: "наприклад, Тартар з лосося v2",
    addIngredient: "Додати інгредієнт",
    ingredientSearchPlaceholder: "Пошук: лосось, лайм, місо…",
    direction: "Напрям",
    composition: "Композиція",
    analysis: "Аналіз",
    overall: "Загальна оцінка",
    compatibility: "Сумісність",
    balance: "Баланс",
    quantity: "Кількість",
    texture: "Текстура",
    confidence: "Впевненість",
    profile: "Сенсорний профіль",
    insights: "Нотатки шефа",
    noIssues: "Композиція збалансована. Точно налаштуйте її за рекомендаціями нижче.",
    engineSummary: "Що бачить рушій",
    bestNextMove: "Найкращий наступний крок",
    recommendations: "Що додати далі",
    recommendationHelp:
      "Сумісність показує, чи працює продукт зі стравою. Корисність — чи покращує він саме поточну композицію.",
    compatibilityLabel: "Сумісність",
    utilityLabel: "Корисність",
    expectedChange: "баланс",
    pairs: "Пари інгредієнтів",
    pair: "Пара",
    aromaOverlap: "Спільна ароматика",
    saveDish: "Зберегти страву",
    visibility: "Хто зможе її бачити?",
    visibilityHelp:
      "Публічні страви можуть з’являтися в огляді. Страви за посиланням не індексуються. Приватні чернетки залишаються у вашій бібліотеці.",
    savedLocally: "Збережено в цьому браузері. Після підключення входу синхронізація працюватиме через Nest API.",
    reset: "Скинути демо",
    emptyTitle: "Почніть з основного продукту",
    emptyText: "Оберіть один інгредієнт — і рушій запропонує наступний крок.",
    maxItems: "MVP підтримує до 12 інгредієнтів в одній страві.",
    duplicate: "Цей продукт уже є у страві. Змініть його кількість.",
    privateLimit: "Тариф Free містить 3 приватні чернетки. Зробіть страву публічною чи доступною за посиланням або підключіть оплату Pro.",
    complement: "Контраст і доповнення"
  },
  discover: {
    eyebrow: "Композиції спільноти",
    title: "Знаходьте, розумійте та створюйте ремікси",
    subtitle:
      "Публічні страви — не статичні дописи. Відкрийте будь-яку в конструкторі й подивіться, як кожна зміна впливає на композицію.",
    searchPlaceholder: "Пошук страв або інгредієнтів",
    trending: "Популярне зараз",
    all: "Усі страви",
    publicDishes: "Публічні страви",
    openBuilder: "Відкрити в конструкторі",
    lineage: "Оригінальна композиція та майбутні ремікси залишаються пов’язаними."
  },
  library: {
    title: "Мої страви",
    subtitle: "Ваші локальні чернетки, публічні композиції та експерименти за посиланням.",
    emptyTitle: "Збережених страв ще немає",
    emptyText: "Створіть композицію в конструкторі й збережіть її тут.",
    create: "Створити першу страву",
    localNotice:
      "Анонімні страви зберігаються в localStorage браузера. Nest API та PostgreSQL-ендпоїнти готові; наступний крок — підключити інтерфейс входу.",
    delete: "Видалити",
    open: "Відкрити в конструкторі"
  },
  pricing: {
    eyebrow: "Проста SaaS-модель",
    title: "Діліться вільно. Професійну роботу тримайте приватною.",
    subtitle:
      "Ціни — стартові гіпотези. Перша мета — перевірити, чи готові кухарі платити за глибший аналіз і приватний простір.",
    monthly: "/ місяць",
    freeName: "Free",
    freePrice: "€0",
    freeDescription: "Для знайомства з рушієм і публікації відкритих ідей.",
    proName: "Pro Chef",
    proPrice: "€14.90",
    proDescription: "Для кухарів, які розробляють страви й потребують приватного простору.",
    studioName: "Chef Studio",
    studioPrice: "€29",
    studioDescription: "Для повної розробки рецептур і операційних розрахунків.",
    popular: "Рекомендовано",
    choose: "Обрати тариф",
    current: "Є в MVP",
    featurePublic: "Необмежені публічні страви",
    featurePrivate3: "3 приватні чернетки",
    featureBasicAnalysis: "Базова сумісність і баланс",
    featureUnlimitedPrivate: "Необмежені приватні страви",
    featureAdvancedAnalysis: "Додати / прибрати / замінити з дозуванням",
    featureVersions: "Версії рецептів і лінія реміксів",
    featureQuantity: "Розширена оптимізація кількості",
    featureCosting: "Собівартість і маржа",
    featureNutrition: "Харчова цінність та алергени",
    featureScaling: "Масштабування й вихід",
    featureExport: "Техкарта та експорт",
    note: "Оплата навмисно не підключена в цьому MVP. Stripe варто додати після інтерв’ю з першими користувачами й перевірки paywall."
  },
  goals: {
    balanced: "Збалансоване",
    fresh: "Свіже",
    rich: "Насичене",
    spicy: "Гостре",
    sweetSour: "Кисло-солодке",
    smoky: "Копчене",
    umami: "Умамі",
    light: "Легке",
    creamy: "Вершкове",
    crunchy: "Хрустке"
  },
  dimensions: {
    sweetness: "Солодкість",
    acidity: "Кислотність",
    saltiness: "Солоність",
    bitterness: "Гіркота",
    umami: "Умамі",
    fat: "Жирність",
    pungency: "Гострота",
    freshness: "Свіжість",
    aromaIntensity: "Ароматика",
    moisture: "Вологість"
  },
  issues: {
    emptyDish: "Додайте інгредієнт, щоб почати аналіз.",
    singleIngredient: "Для одного продукту ще немає попарної сумісності. Додайте підтримувальний компонент.",
    fatNeedsAcid: "Жирність завелика відносно кислотності. Додайте свіжий кислий компонент.",
    tooSweet: "Солодкість домінує без достатньої кислотності або гіркоти.",
    tooIntense: "Загальна інтенсивність смаку висока. Зменште сильну ароматику або додайте нейтральну основу.",
    lowFreshness: "Страва відчувається важкою. Свіжий або водянистий компонент зробить її легшою.",
    dominantIngredient: "{ingredient} домінує в композиції за поточної кількості.",
    flatTexture: "Текстурного контрасту мало. Спробуйте хрусткий елемент.",
    highSalt: "Солоність перевищує комфортний сенсорний діапазон. Зменште солоні соуси або сир.",
    lowUmami: "Страві може бракувати пікантної глибини. Додайте дозований компонент умамі."
  },
  reasons: {
    strongPairing: "сильне поєднання",
    addsAcidity: "додає кислотність",
    balancesFat: "балансує жирність",
    addsFreshness: "додає свіжість",
    addsUmami: "додає умамі",
    addsSweetness: "додає солодкість",
    addsPungency: "додає гостроту",
    addsCrunch: "додає хрускіт",
    supportsGoal: "підтримує напрям",
    improvesBalance: "покращує баланс"
  },
  visibility: {
    publicTitle: "Публічна",
    publicText: "Видима в огляді та у вашому профілі.",
    unlistedTitle: "За посиланням",
    unlistedText: "Не знаходиться через пошук; відкрити може кожен із посиланням.",
    privateTitle: "Приватна",
    privateText: "Видима лише у вашому просторі. Необмежено на Pro."
  }
};

const dictionaries: Record<Locale, Dictionary> = { en, uk };

export const getDictionary = (locale: Locale) => dictionaries[locale];
