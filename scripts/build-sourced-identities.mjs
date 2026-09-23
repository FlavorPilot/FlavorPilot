/** Copy identity rows from a local USDA FoodData Central CSV download.
 * Does not invent sensory scores. Requires the public-domain archives:
 * FoodData_Central_foundation_food_csv_2026-04-30 and
 * FoodData_Central_sr_legacy_food_csv_2018-04.
 * Usage: FDC_DIR=/tmp/fdc node scripts/build-sourced-identities.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = process.env.FDC_DIR ?? '/tmp/fdc';
const foundationDir = path.join(dir, 'FoodData_Central_foundation_food_csv_2026-04-30');
const legacyDir = path.join(dir, 'FoodData_Central_sr_legacy_food_csv_2018-04');
const SOURCE = 'U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, 2019. fdc.nal.usda.gov.';
const LICENSE = 'CC0-1.0';
const LICENSE_URL = 'https://creativecommons.org/publicdomain/zero/1.0/';
const MODEL = 'fdc-identity-2026-04-30';
/** id, English label, Ukrainian project translation, engine id or '', exact FDC description. */
const manifest = [
    ['salmon', 'Salmon', 'Лосось', 'salmon', 'Fish, salmon, Atlantic, farm raised, raw'],
    ['avocado', 'Avocado', 'Авокадо', 'avocado', 'Avocado, Hass, peeled, raw'],
    ['mango', 'Mango', 'Манго', 'mango', 'Mango, Tommy Atkins, peeled, raw'],
    ['lime', 'Lime', 'Лайм', 'lime', 'Limes, raw'],
    ['lemon', 'Lemon', 'Лимон', 'lemon', 'Lemons, raw, without peel'],
    ['chili', 'Chili', 'Чилі', 'chili', 'Peppers, hot chili, red, raw'],
    ['cilantro', 'Cilantro', 'Коріандр', 'cilantro', 'Coriander (cilantro) leaves, raw'],
    ['sesame', 'Sesame', 'Кунжут', 'sesame', 'Seeds, sesame seeds, whole, dried'],
    ['ginger', 'Ginger', 'Імбир', 'ginger', 'Ginger root, raw'],
    ['cucumber', 'Cucumber', 'Огірок', 'cucumber', 'Cucumber, with peel, raw'],
    ['soy_sauce', 'Soy sauce', 'Соєвий соус', 'soy_sauce', 'Soy sauce made from soy and wheat (shoyu)'],
    ['miso', 'Miso', 'Місо', 'miso', 'Miso'],
    ['butter', 'Butter', 'Вершкове масло', 'butter', 'Butter, stick, unsalted'],
    ['mayonnaise', 'Mayonnaise', 'Майонез', 'mayonnaise', 'Mayonnaise, Regular'],
    ['duck', 'Duck', 'Качка', 'duck', 'Duck, domesticated, meat only, raw'],
    ['cherry', 'Cherry', 'Черешня', 'cherry', 'Cherries, sweet, dark red, raw'],
    ['rosemary', 'Rosemary', 'Розмарин', 'rosemary', 'Rosemary, fresh'],
    ['thyme', 'Thyme', 'Чебрець', 'thyme', 'Thyme, fresh'],
    ['orange', 'Orange', 'Апельсин', 'orange', 'Oranges, raw, navels'],
    ['balsamic', 'Balsamic vinegar', 'Бальзамічний оцет', 'balsamic', 'Vinegar, balsamic'],
    ['red_wine', 'Red wine', 'Червоне вино', 'red_wine', 'Alcoholic beverage, wine, table, red'],
    ['chicken', 'Chicken', 'Курка', 'chicken', 'Chicken, breast, meat and skin, raw'],
    ['cream', 'Cream', 'Вершки', 'cream', 'Cream, heavy'],
    ['mushrooms', 'Mushroom', 'Печериці', 'mushrooms', 'Mushrooms, white button'],
    ['garlic', 'Garlic', 'Часник', 'garlic', 'Garlic, raw'],
    ['parmesan', 'Parmesan', 'Пармезан', 'parmesan', 'Cheese, parmesan, grated'],
    ['blue_cheese', 'Blue cheese', 'Блакитний сир', 'blue_cheese', 'Cheese, blue'],
    ['potato', 'Potato', 'Картопля', 'potato', 'Potatoes, russet, without skin, raw'],
    ['pork', 'Pork', 'Свинина', 'pork', 'Pork, loin, boneless, raw'],
    ['apple', 'Apple', 'Яблуко', 'apple', 'Apples, gala, with skin, raw'],
    ['beetroot', 'Beetroot', 'Буряк', 'beetroot', 'Beets, raw'],
    ['tahini', 'Tahini', 'Тахіні', 'tahini', 'Seeds, sesame butter, tahini, from roasted and toasted kernels (most common type)'],
    ['pomegranate', 'Pomegranate', 'Гранат', 'pomegranate', 'Pomegranates, raw'],
    ['cauliflower', 'Cauliflower', 'Цвітна капуста', 'cauliflower', 'Cauliflower, raw'],
    ['walnut', 'Walnut', 'Волоський горіх', 'walnut', 'Nuts, walnuts, English, halves, raw'],
    ['honey', 'Honey', 'Мед', 'honey', 'Honey'],
    ['black_pepper', 'Black pepper', 'Чорний перець', 'black_pepper', 'Spices, pepper, black'],
    ['beef', 'Beef', 'Яловичина', '', 'Beef, ground, 90% lean meat / 10% fat, raw'],
    ['lamb', 'Lamb', 'Баранина', '', 'Lamb, ground, raw'],
    ['turkey', 'Turkey', 'Індичка', '', 'Turkey, ground, 93% lean/ 7% fat, raw'],
    ['egg', 'Egg', 'Яйце', '', 'Egg, whole, raw, fresh'],
    ['tofu', 'Tofu', 'Тофу', '', 'Tofu, raw, regular, prepared with calcium sulfate'],
    ['lentil', 'Lentil', 'Сочевиця', '', 'Lentils, raw'],
    ['chickpea', 'Chickpea', 'Нут', '', 'Chickpeas (garbanzo beans, bengal gram), mature seeds, raw'],
    ['black_bean', 'Black bean', 'Чорна квасоля', '', 'Beans, black, mature seeds, raw'],
    ['cod', 'Cod', 'Тріска', '', 'Fish, cod, Atlantic, wild caught, raw'],
    ['shrimp', 'Shrimp', 'Креветка', '', 'Crustaceans, shrimp, raw'],
    ['tuna', 'Tuna', 'Тунець', '', 'Fish, tuna, fresh, yellowfin, raw'],
    ['milk', 'Milk', 'Молоко', '', 'Milk, whole, 3.25% milkfat, with added vitamin D'],
    ['yogurt', 'Yogurt', 'Йогурт', '', 'Yogurt, plain, whole milk'],
    ['cheddar', 'Cheddar', 'Чедер', '', 'Cheese, cheddar'],
    ['mozzarella', 'Mozzarella', 'Моцарела', '', 'Cheese, mozzarella, whole milk'],
    ['rice', 'Rice', 'Рис', '', 'Rice, white, long grain, unenriched, raw'],
    ['wheat_flour', 'Wheat flour', 'Пшеничне борошно', '', 'Wheat flour, white, all-purpose, enriched, bleached'],
    ['pasta', 'Pasta', 'Паста', '', 'Pasta, dry, enriched'],
    ['oat', 'Oats', 'Вівсянка', '', 'Oats, whole grain, rolled, old fashioned'],
    ['bread', 'Bread', 'Хліб', '', 'Bread, white, commercially prepared'],
    ['corn', 'Corn', 'Кукурудза', '', 'Corn, sweet, yellow, raw'],
    ['onion', 'Onion', 'Цибуля', '', 'Onions, yellow, raw'],
    ['tomato', 'Tomato', 'Помідор', '', 'Tomatoes, red, ripe, raw, year round average'],
    ['carrot', 'Carrot', 'Морква', '', 'Carrots, raw'],
    ['celery', 'Celery', 'Селера', '', 'Celery, raw'],
    ['bell_pepper', 'Bell pepper', 'Солодкий перець', '', 'Peppers, bell, red, raw'],
    ['spinach', 'Spinach', 'Шпинат', '', 'Spinach, raw'],
    ['broccoli', 'Broccoli', 'Броколі', '', 'Broccoli, raw'],
    ['cabbage', 'Cabbage', 'Капуста', '', 'Cabbage, raw'],
    ['lettuce', 'Lettuce', 'Салат айсберг', '', 'Lettuce, iceberg, raw'],
    ['eggplant', 'Eggplant', 'Баклажан', '', 'Eggplant, raw'],
    ['zucchini', 'Zucchini', 'Цукіні', '', 'Squash, summer, zucchini, includes skin, raw'],
    ['pea', 'Pea', 'Зелений горошок', '', 'Peas, green, raw'],
    ['green_bean', 'Green bean', 'Стручкова квасоля', '', 'Beans, snap, green, raw'],
    ['leek', 'Leek', 'Цибуля-порей', '', 'Leeks, bulb and greens, root removed, raw'],
    ['banana', 'Banana', 'Банан', '', 'Bananas, ripe and slightly ripe, raw'],
    ['strawberry', 'Strawberry', 'Полуниця', '', 'Strawberries, raw'],
    ['blueberry', 'Blueberry', 'Чорниця', '', 'Blueberries, raw'],
    ['grape', 'Grape', 'Виноград', '', 'Grapes, red, seedless, raw'],
    ['pineapple', 'Pineapple', 'Ананас', '', 'Pineapple, raw'],
    ['peach', 'Peach', 'Персик', '', 'Peaches, yellow, raw'],
    ['pear', 'Pear', 'Груша', '', 'Pears, raw, bartlett'],
    ['cumin', 'Cumin', 'Кмин', '', 'Spices, cumin seed'],
    ['paprika', 'Paprika', 'Паприка', '', 'Spices, paprika'],
    ['cinnamon', 'Cinnamon', 'Кориця', '', 'Spices, cinnamon, ground'],
    ['basil', 'Basil', 'Базилік', '', 'Basil, fresh'],
    ['parsley', 'Parsley', 'Петрушка', '', 'Parsley, fresh'],
    ['oregano', 'Oregano', 'Орегано', '', 'Spices, oregano, dried'],
    ['bay', 'Bay leaf', 'Лавровий лист', '', 'Spices, bay leaf'],
    ['turmeric', 'Turmeric', 'Куркума', '', 'Spices, turmeric, ground'],
    ['nutmeg', 'Nutmeg', 'Мускатний горіх', '', 'Spices, nutmeg, ground'],
    ['dill', 'Dill', 'Кріп', '', 'Dill weed, fresh'],
    ['mint', 'Mint', 'Мʼята', '', 'Spearmint, fresh'],
    ['olive_oil', 'Olive oil', 'Оливкова олія', '', 'Oil, olive, extra virgin'],
    ['white_vinegar', 'White vinegar', 'Білий оцет', '', 'Vinegar, distilled'],
    ['sugar', 'Sugar', 'Цукор', '', 'Sugars, granulated'],
    ['salt', 'Salt', 'Сіль', '', 'Salt, table, iodized'],
    ['mustard', 'Mustard', 'Гірчиця', '', 'Mustard, prepared, yellow'],
    ['almond', 'Almond', 'Мигдаль', '', 'Nuts, almonds, whole, raw'],
    ['peanut', 'Peanut', 'Арахіс', '', 'Peanuts, raw'],
    ['coffee', 'Coffee', 'Кава', '', 'Beverages, coffee, brewed, prepared with tap water'],
    ['cocoa', 'Cocoa', 'Какао', '', 'Cocoa, dry powder, unsweetened'],
    ['vanilla', 'Vanilla', 'Ваніль', '', 'Vanilla extract'],
    ['coconut', 'Coconut', 'Кокос', '', 'Nuts, coconut meat, raw'],
    ['olive', 'Olive', 'Оливка', '', 'Olives, ripe, canned (small-extra large)'],
    ['shallot', 'Shallot', 'Шалот', '', 'Shallots, bulb, peeled, root removed, raw'],
    ['sweet_potato', 'Sweet potato', 'Батат', '', 'Sweet potatoes, orange flesh, without skin, raw'],
    ['asparagus', 'Asparagus', 'Спаржа', '', 'Asparagus, green, raw'],
    ['kale', 'Kale', 'Кейл', '', 'Kale, raw'],
    ['cranberry', 'Cranberry', 'Журавлина', '', 'Cranberries, raw'],
    ['fig', 'Fig', 'Інжир', '', 'Figs, dried, uncooked'],
    ['apricot', 'Apricot', 'Абрикос', '', 'Apricot, with skin, raw'],
    ['clove', 'Clove', 'Гвоздика', '', 'Spices, cloves, ground'],
    ['cardamom', 'Cardamom', 'Кардамон', '', 'Spices, cardamom'],
    ['coriander_seed', 'Coriander seed', 'Насіння коріандру', '', 'Spices, coriander seed'],
    ['white_wine', 'White wine', 'Біле вино', '', 'Alcoholic beverage, wine, table, white'],
    ['sour_cream', 'Sour cream', 'Сметана', '', 'Cream, sour, full fat'],
    ['feta', 'Feta', 'Фета', '', 'Cheese, feta, whole milk, crumbled'],
    ['anchovy', 'Anchovy', 'Анчоус', '', 'Fish, anchovy, european, raw'],
    ['quinoa', 'Quinoa', 'Кіноа', '', 'Quinoa, uncooked'],
    ['barley', 'Barley', 'Ячмінь', '', 'Barley, pearled, raw'],
    ['tilapia', 'Tilapia', 'Тиляпія', '', 'Fish, tilapia, farm raised, raw'],
];
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 1;
                }
                else
                    quoted = false;
            }
            else
                field += char;
        }
        else if (char === '"')
            quoted = true;
        else if (char === ',') {
            row.push(field);
            field = '';
        }
        else if (char === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        }
        else if (char !== '\r')
            field += char;
    }
    if (field.length || row.length) {
        row.push(field);
        rows.push(row);
    }
    const [header, ...body] = rows.filter(item => item.length > 1);
    return body.map(item => Object.fromEntries(header.map((key, index) => [key, item[index] ?? ''])));
}
function load(foodPath, categoryPath, dataset) {
    const categories = new Map(parseCsv(readFileSync(categoryPath, 'utf8')).map(row => [row.id, row.description]));
    return parseCsv(readFileSync(foodPath, 'utf8')).filter(row => row.data_type === 'foundation_food' || row.data_type === 'sr_legacy_food').map(row => ({ ...row, category: categories.get(row.food_category_id) ?? '', dataset }));
}
const foods = [
    ...load(path.join(foundationDir, 'food.csv'), path.join(foundationDir, 'food_category.csv'), 'FoodData Central Foundation Foods CSV 2026-04-30'),
    ...load(path.join(legacyDir, 'food.csv'), path.join(legacyDir, 'food_category.csv'), 'FoodData Central SR Legacy CSV 2018-04'),
];
const byDescription = new Map();
for (const food of foods) {
    const list = byDescription.get(food.description) ?? [];
    list.push(food);
    byDescription.set(food.description, list);
}
function choose(description) {
    const matches = byDescription.get(description);
    if (!matches?.length)
        throw new Error(`No USDA row for ${description}`);
    return [...matches].sort((left, right) => {
        if (left.data_type !== right.data_type)
            return left.data_type === 'foundation_food' ? -1 : 1;
        if (left.publication_date !== right.publication_date)
            return right.publication_date.localeCompare(left.publication_date);
        return Number(right.fdc_id) - Number(left.fdc_id);
    })[0];
}
const records = manifest.map(([id, nameEn, nameUk, catalogIngredientId, description]) => {
    const food = choose(description);
    if (food.description !== description)
        throw new Error(`Description drifted for ${id}`);
    return {
        id,
        catalogIngredientId: catalogIngredientId || null,
        nameEn,
        nameUk,
        nameUkOrigin: 'project-translation',
        fdcId: Number(food.fdc_id),
        fdcDescription: food.description,
        fdcDataType: food.data_type,
        fdcFoodCategory: food.category,
        fdcPublicationDate: food.publication_date,
        dataset: food.dataset,
        source: `${SOURCE} ${food.dataset}. fdc_id ${food.fdc_id}. Description copied verbatim.`,
        sourceUrl: `https://fdc.nal.usda.gov/food-details/${food.fdc_id}/nutrients`,
        sourceLicense: LICENSE,
        licenseUrl: LICENSE_URL,
        sensoryProfile: null,
        preparationEffects: null,
        recommendedRange: null,
        pairingEvidence: null,
        reviewer: null,
        reviewStatus: 'unreviewed',
        confidence: 0,
        modelVersion: MODEL,
        lastReviewedAt: null,
    };
});
const ids = new Set(records.map(record => record.id));
const fdcIds = new Set(records.map(record => record.fdcId));
if (ids.size !== records.length || fdcIds.size !== records.length)
    throw new Error('Duplicate identity or FDC id');
if (records.length < 80 || records.length > 120)
    throw new Error(`Expected 80–120 identities, got ${records.length}`);
const ts = `import type { SourcedIngredientIdentity } from '@flavorpilot/contracts/domain';
/** Generated by scripts/build-sourced-identities.mjs from USDA CSV downloads.
 * Foundation Foods 2026-04-30 and SR Legacy 2018-04. CC0 1.0.
 * When several USDA rows share a description, the script keeps a foundation food,
 * then the latest publication date, then the highest fdc_id.
 * Ukrainian names are project translations. Sensory fields are intentionally empty.
 */
export const FDC_SOURCE = ${JSON.stringify(SOURCE)};
export const FDC_LICENSE = ${JSON.stringify(LICENSE)} as const;
export const FDC_LICENSE_URL = ${JSON.stringify(LICENSE_URL)};
export const IDENTITY_MODEL_VERSION = ${JSON.stringify(MODEL)};
export const sourcedIdentities: SourcedIngredientIdentity[] = ${JSON.stringify(records, null, 4)};
`;
writeFileSync(path.join(root, 'packages/flavor-engine/src/sourced-identities.ts'), ts);
const q = value => value === null ? 'null' : `'${String(value).replaceAll("'", "''")}'`;
let sql = '-- GENERATED identity citations from USDA FoodData Central. Not sensory measurements.\n-- Does not overwrite a row. Reviewed status is not granted here.\nbegin;\n';
for (const record of records) {
    sql += `insert into public.ingredient_identities(id,catalog_ingredient_id,name_en,name_uk,name_uk_origin,fdc_id,fdc_description,fdc_data_type,fdc_food_category,fdc_publication_date,dataset,source,source_url,source_license,license_url,review_status,confidence,model_version) values(${[q(record.id), q(record.catalogIngredientId), q(record.nameEn), q(record.nameUk), q(record.nameUkOrigin), record.fdcId, q(record.fdcDescription), q(record.fdcDataType), q(record.fdcFoodCategory), q(record.fdcPublicationDate), q(record.dataset), q(record.source), q(record.sourceUrl), q(record.sourceLicense), q(record.licenseUrl), q(record.reviewStatus), record.confidence, q(record.modelVersion)].join(',')}) on conflict (id) do nothing;\n`;
}
sql += 'commit;\n';
writeFileSync(path.join(root, 'supabase/seed-identities.sql'), sql);
console.log(`Identities: ${records.length}. Linked to the scoring catalogue: ${records.filter(record => record.catalogIngredientId).length}.`);
