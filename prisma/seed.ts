import { PrismaClient, Category } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Реальное меню банкетного зала. Цены в рублях; в БД хранятся в копейках (× 100).
// Состав блюда (где он указан) идёт в description.
const MENU: {
  name: string;
  description: string | null;
  category: Category;
  price: number;
  mandatory?: boolean;
  perEvent?: boolean;
  informational?: boolean;
}[] = [
  // --- Первые блюда ---
  { name: "Бишбармак", description: null, category: Category.FIRST_COURSE, price: 290 },
  { name: "Бишбармак (со своим мясом)", description: null, category: Category.FIRST_COURSE, price: 180 },
  { name: "Улюш с говядиной", description: null, category: Category.FIRST_COURSE, price: 320 },
  { name: "Лапша домашняя с курицей", description: null, category: Category.FIRST_COURSE, price: 170 },
  { name: "Вак-беляш с бульоном", description: null, category: Category.FIRST_COURSE, price: 240 },
  { name: "Солянка", description: null, category: Category.FIRST_COURSE, price: 170 },

  // --- Гарниры ---
  { name: "Картофель фри", description: null, category: Category.SIDE_DISH, price: 125 },
  { name: "Картофель запеченный", description: null, category: Category.SIDE_DISH, price: 140 },
  { name: "Рис с овощами", description: null, category: Category.SIDE_DISH, price: 90 },
  { name: "Овощи гриль", description: null, category: Category.SIDE_DISH, price: 150 },

  // --- Рыбные блюда ---
  { name: "Рыба запеченная в фольге с овощами", description: null, category: Category.FISH, price: 270 },
  { name: "Филе рыбы горбуша", description: null, category: Category.FISH, price: 320 },
  { name: "Лосось под соусом", description: null, category: Category.FISH, price: 400 },

  // --- Мясные блюда ---
  { name: "Антрекот (говядина) жаренный с луком", description: null, category: Category.MEAT, price: 370 },
  { name: "Жаркое по-домашнему с курицей", description: null, category: Category.MEAT, price: 220 },
  { name: "Филе куриное", description: null, category: Category.MEAT, price: 200 },
  { name: "Куриные шашлыки с соусом", description: null, category: Category.MEAT, price: 200 },
  { name: "Голубцы (1 шт)", description: null, category: Category.MEAT, price: 140 },
  { name: "Манты (1 шт) с фирменным соусом", description: null, category: Category.MEAT, price: 80 },
  { name: "Плов", description: null, category: Category.MEAT, price: 160 },
  { name: "Мясо по-французски", description: null, category: Category.MEAT, price: 270 },

  // --- Холодные закуски ---
  { name: "Ассорти овощное", description: "Помидоры, огурцы, перец болгарский, зелень", category: Category.COLD_APPETIZER, price: 120 },
  { name: "Ассорти рыбное", description: "Сельдь, скумбрия, горбуша, оливки", category: Category.COLD_APPETIZER, price: 190 },
  { name: "Ассорти мясное", description: "Говядина/конина, печень, куриный рулет", category: Category.COLD_APPETIZER, price: 230 },
  { name: "Колбасная нарезка", description: "Колбаса копчёная, бекон, сыр", category: Category.COLD_APPETIZER, price: 170 },
  { name: "Сырная нарезка", description: null, category: Category.COLD_APPETIZER, price: 160 },
  { name: "Селёдка с картошкой и луком", description: null, category: Category.COLD_APPETIZER, price: 160 },

  // --- Закуски ---
  { name: "Куриный рулет", description: null, category: Category.APPETIZER, price: 100 },
  { name: "Шампиньоны", description: null, category: Category.APPETIZER, price: 90 },
  { name: "Рулет из ветчины", description: null, category: Category.APPETIZER, price: 110 },
  { name: "Блинные мешочки с начинкой", description: null, category: Category.APPETIZER, price: 90 },
  { name: "Печень с овощами", description: null, category: Category.APPETIZER, price: 110 },
  { name: "Окорочка", description: null, category: Category.APPETIZER, price: 130 },
  { name: "Рыба в кляре горбуша", description: null, category: Category.APPETIZER, price: 140 },
  { name: "Рыба в кляре минтай", description: null, category: Category.APPETIZER, price: 130 },
  { name: "Скумбрия фаршированная", description: null, category: Category.APPETIZER, price: 140 },
  { name: "Тарталетка с грибами и сыром", description: null, category: Category.APPETIZER, price: 60 },
  { name: "Брускетты с различными начинками", description: null, category: Category.APPETIZER, price: 140 },
  { name: "Кабачки фаршированные", description: null, category: Category.APPETIZER, price: 100 },
  { name: "Баклажаны фаршированные", description: null, category: Category.APPETIZER, price: 100 },
  { name: "Трубочки с сырной начинкой", description: null, category: Category.APPETIZER, price: 80 },
  { name: "Рулет из шпината", description: null, category: Category.APPETIZER, price: 130 },
  { name: "Вафли с семгой", description: null, category: Category.APPETIZER, price: 120 },

  // --- Салаты ---
  { name: "Греческий", description: "Помидоры, огурцы, болгарский перец, пекинская капуста, лук репчатый, сыр, оливковое масло", category: Category.SALAD, price: 180 },
  { name: "Греческий с птицей", description: null, category: Category.SALAD, price: 220 },
  { name: "Ананасовый", description: "Курица, лук маринованный, сыр, ананас, майонез", category: Category.SALAD, price: 190 },
  { name: "Радуга", description: "Свежая свёкла, свежая морковь, огурцы, колбаса, зелёный горошек, картофель фри, майонез с чесноком", category: Category.SALAD, price: 180 },
  { name: "Фантазия", description: "Курица, колбаса копчёная, огурцы, картофель фри, пекинская капуста, грибы жареные, яйцо, майонез", category: Category.SALAD, price: 200 },
  { name: "Грузинский", description: "Колбаса копчёная, бекон, помидоры, перец красный, сыр, соус", category: Category.SALAD, price: 190 },
  { name: "Цезарь", description: "Курица, пекинская капуста, перепелиное яйцо, помидоры, сухари, пармезан, соус", category: Category.SALAD, price: 250 },
  { name: "Русская красавица", description: "Курица, шампиньоны жареные, листья салата, помидоры, чернослив, грецкий орех, лук фри", category: Category.SALAD, price: 230 },
  { name: "Гнездо глухаря", description: "Куриная грудка, яйца, огурцы, сыр, майонез, картофель фри", category: Category.SALAD, price: 190 },
  { name: "Салат коктейль с курицей", description: "Курица, огурцы, яйцо, чернослив, майонез, сметана, орехи", category: Category.SALAD, price: 200 },
  { name: "Малахитовый браслет", description: "Куриное филе, яблоко, морковь, изюм, яйцо, сыр, майонез", category: Category.SALAD, price: 200 },
  { name: "Сельдь под шубой", description: null, category: Category.SALAD, price: 160 },
  { name: "Салат с курицей и апельсином с грецкими орехами", description: null, category: Category.SALAD, price: 210 },
  { name: "Итальянский с печенью", description: null, category: Category.SALAD, price: 190 },
  { name: "Итальянский с мясом", description: null, category: Category.SALAD, price: 230 },
  { name: "Мужской каприз с говядиной", description: null, category: Category.SALAD, price: 220 },
  { name: "Салат мясной с овощами", description: "Говядина, листья салата, перец болгарский, помидоры, соус", category: Category.SALAD, price: 230 },
  { name: "Салат с креветками и свежими овощами с фирменным соусом", description: null, category: Category.SALAD, price: 350 },
  { name: "Салат с куриной грудкой, грушами и авокадо", description: null, category: Category.SALAD, price: 230 },
  { name: "Тёплый салат с хрустящими баклажанами", description: null, category: Category.SALAD, price: 220 },

  // --- Напитки и к столу ---
  { name: "Хлеб", description: null, category: Category.DRINK, price: 30 },
  { name: "Компот", description: null, category: Category.DRINK, price: 100 },
  { name: "Чай", description: null, category: Category.DRINK, price: 50 },

  // --- Дополнительные услуги ---
  // Обслуживание включено всегда (mandatory) и не снимается клиентом.
  { name: "Обслуживание", description: "Включается автоматически для каждого гостя", category: Category.SERVICE, price: 250, mandatory: true },
  { name: "Накидки для стульев", description: "Декоративные чехлы на стулья", category: Category.SERVICE, price: 25 },
  // Оформление зала — только отметка «нужно / не нужно». В итог НЕ входит:
  // цена справочная «от …», точную стоимость клиент согласует с залом.
  { name: "Оформление зала на свадьбу", description: "от 6000 ₽. Стоимость уточняется отдельно с банкетным залом.", category: Category.SERVICE, price: 6000, informational: true },
  { name: "Оформление зала на юбилей", description: "от 3000 ₽. Стоимость уточняется отдельно с банкетным залом.", category: Category.SERVICE, price: 3000, informational: true },
];

async function main() {
  // --- Admin ---
  const email = process.env.ADMIN_EMAIL ?? "admin@banquet.local";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const hashed = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, password: hashed, name: "Администратор" },
  });
  console.log(`Admin ready: ${email} / ${password}`);

  // --- Dishes ---
  // Полная замена каталога меню. Удаляем только блюда, не затрагивая
  // мероприятия (связи EventDish удалятся каскадно).
  await prisma.dish.deleteMany({});
  await prisma.dish.createMany({
    data: MENU.map((d) => ({
      name: d.name,
      description: d.description,
      category: d.category,
      pricePerGuest: d.price * 100,
      active: true,
      mandatory: d.mandatory ?? false,
      perEvent: d.perEvent ?? false,
      informational: d.informational ?? false,
    })),
  });
  console.log(`Seeded ${MENU.length} dishes.`);

  // --- Demo event ---
  const demo = await prisma.event.findFirst({ where: { title: "Демо-свадьба" } });
  if (!demo) {
    const event = await prisma.event.create({
      data: {
        title: "Демо-свадьба",
        clientName: "Иван Петров",
        eventDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        guests: 50,
      },
    });
    console.log(`Demo event link: /event/${event.token}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
