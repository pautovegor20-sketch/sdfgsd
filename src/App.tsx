import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const MAX_LINK = "https://t.me/max_event";
const RECEIVER_EMAIL = "booking@example.com";

type View = "home" | "wedding" | "team" | "specialist";

type WeddingData = {
  date: string;
  budgetAmount: string;
  allowIncrease: boolean;
  venue: string;
};

type SpecialistData = {
  role: string;
  name: string;
  experience: string;
  portfolio: string;
  busyDates: string[];
  price: string;
};

const roles = [
  "Ведущий",
  "Фотограф",
  "Видеограф",
  "Рилсмейкер",
  "Техническое оснащение",
  "Декоратор",
];

const venues = [
  "Дворец Торжеств",
  "Усадьба Шансон",
  "Парад Парк Отель",
  "Банкетный зал Шале",
  "Старый чердак",
  "Марле Буа",
  "Трактир Сибирская трапеза",
  "Кафе Самовар",
  "Серебряная чаша",
  "Золотая Долина",
  "Малина бар",
  "У Крюгера",
  "Семейный ресторан Панда",
  "Кафе-бар Дрезден",
  "Вечерний Баку",
  "Кафе Медведи",
  "Кафе Питер",
  "Визави",
  "Кафе-бар Корона",
  "Боярская Заимка",
  "Старый Баку",
  "DJ бар Репутация",
  "Коктейль Холл",
  "Madison Hall",
  "Караоке Duets",
  "Гримерка Gastro Club",
  "Karaoke Royal Kings",
  "Шишки Мишки",
  "Николо Поле",
  "Банкетный зал на Усова",
];

const team = [
  { title: "Ведущий", text: "Сценарий и энергия вечера без пауз и перегруза." },
  { title: "Фотограф", text: "Эмоциональные кадры в стильной цветокоррекции." },
  { title: "Видеограф", text: "Кинематографичная история дня с живым звуком." },
  { title: "Декоратор", text: "Элегантная визуальная среда и световая атмосфера." },
];

function toIso(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatMoney(value: string) {
  const n = Number(value);
  return n ? `${new Intl.NumberFormat("ru-RU").format(n)} руб.` : "не указан";
}

async function sendEmail(subject: string, payload: Record<string, string>) {
  const response = await fetch(`https://formsubmit.co/ajax/${RECEIVER_EMAIL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ _subject: subject, _template: "table", ...payload }),
  });

  if (!response.ok) {
    throw new Error("send error");
  }
}

function BusyCalendar({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (iso: string) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const firstDay = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells: Array<number | null> = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  return (
    <div className="space-y-3 rounded-2xl border border-[#c1a97f]/40 bg-[#fcf8f0] p-4">
      <div className="flex items-center justify-between text-sm text-[#2e281f]">
        <button type="button" onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="px-2 py-1 hover:opacity-70">
          Назад
        </button>
        <p className="capitalize">{cursor.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</p>
        <button type="button" onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="px-2 py-1 hover:opacity-70">
          Далее
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-[#7b6f5d]">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="h-9" />;
          const iso = toIso(new Date(y, m, day));
          const active = selected.includes(iso);

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onToggle(iso)}
              className={`h-9 rounded-md text-sm transition ${
                active ? "bg-[#181818] text-[#f6e8cc]" : "border border-[#c1a97f]/45 text-[#2c251b] hover:border-[#8f7548]"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [weddingStep, setWeddingStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [specialistSent, setSpecialistSent] = useState(false);

  const [wedding, setWedding] = useState<WeddingData>({
    date: "",
    budgetAmount: "",
    allowIncrease: false,
    venue: "",
  });

  const [specialist, setSpecialist] = useState<SpecialistData>({
    role: "",
    name: "",
    experience: "",
    portfolio: "",
    busyDates: [],
    price: "",
  });

  const weddingCanNext = useMemo(() => {
    if (weddingStep === 1) return Boolean(wedding.date);
    if (weddingStep === 2) return Number(wedding.budgetAmount) > 0;
    return Boolean(wedding.venue.trim());
  }, [wedding, weddingStep]);

  const handleWeddingSubmit = async () => {
    setLoading(true);
    try {
      await sendEmail("Заявка: подбор свадебной команды", {
        date: wedding.date,
        budget: wedding.budgetAmount,
        increase10: wedding.allowIncrease ? "Да" : "Нет",
        venue: wedding.venue,
      });
    } catch (error) {
      window.alert("Проверьте RECEIVER_EMAIL в src/App.tsx");
    }
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setView("team");
  };

  const handleSpecialistSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await sendEmail("Заявка от специалиста", {
        role: specialist.role,
        name: specialist.name,
        experience: specialist.experience,
        portfolio: specialist.portfolio,
        busyDates: specialist.busyDates.join(", ") || "Не отмечены",
        price: specialist.price,
      });
      setSpecialistSent(true);
    } catch (error) {
      window.alert("Проверьте RECEIVER_EMAIL в src/App.tsx");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5efe3] text-[#17120d]">
      <AnimatePresence mode="wait">
        {view === "home" && (
          <motion.main key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative min-h-screen overflow-hidden">
            <img src="/images/hero-premium-event.jpg" alt="Свадебная атмосфера" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,7,9,0.35),rgba(10,8,7,0.58),rgba(245,239,227,0.95))]" />

            <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-10">
              <header className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.28em] text-[#ead9ba]">Luxury Wedding Team</span>
                <a href={MAX_LINK} target="_blank" rel="noreferrer" className="text-xs uppercase tracking-[0.2em] text-[#f2e4c8] hover:opacity-70">
                  Макс
                </a>
              </header>

              <section className="flex flex-1 flex-col items-center justify-center text-center">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="text-5xl font-medium leading-[0.95] tracking-tight text-white sm:text-7xl"
                >
                  Создаем свадьбы,
                  <br />
                  которые чувствуют сердцем
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-5 max-w-2xl text-lg text-[#f6ecdd] sm:text-2xl">
                  Подбираем точную команду под ваш стиль, бюджет и площадку.
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <button
                    onClick={() => setView("wedding")}
                    className="min-w-64 border border-[#d7be95] bg-[#d7be95] px-8 py-4 text-sm uppercase tracking-[0.16em] text-[#151515] transition hover:-translate-y-0.5 hover:bg-[#e9d8b7]"
                  >
                    У меня свадьба
                  </button>
                  <button
                    onClick={() => setView("specialist")}
                    className="min-w-64 border border-[#f4ecd9]/75 px-8 py-4 text-sm uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:border-[#d7be95]"
                  >
                    Я специалист
                  </button>
                </motion.div>
              </section>
            </div>
          </motion.main>
        )}

        {view === "wedding" && (
          <motion.main key="wedding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
            <div className="flex items-center justify-between">
              <button onClick={() => setView("home")} className="text-xs uppercase tracking-[0.2em] text-[#8e7447] hover:opacity-70">
                На главную
              </button>
              <a href={MAX_LINK} target="_blank" rel="noreferrer" className="text-xs uppercase tracking-[0.2em] text-[#8e7447] hover:opacity-70">
                Макс
              </a>
            </div>

            <h2 className="mt-8 text-4xl sm:text-6xl">Ваша свадьба</h2>
            <p className="mt-3 text-[#4b4337]">3 шага для подбора команды.</p>

            <div className="mt-7 h-1 bg-[#ddd0bb]">
              <motion.div className="h-full bg-[#b89358]" animate={{ width: `${(weddingStep / 3) * 100}%` }} />
            </div>

            <div className="mt-8 rounded-2xl border border-[#c8b083]/40 bg-[#fcf8f0] p-5 sm:p-8">
              {weddingStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-2xl">Шаг 1. Дата свадьбы</h3>
                  <input
                    type="date"
                    value={wedding.date}
                    onChange={(e) => setWedding((p) => ({ ...p, date: e.target.value }))}
                    className="w-full border border-[#bfa57a]/45 bg-transparent px-4 py-4 text-lg outline-none focus:border-[#94784e]"
                  />
                </div>
              )}

              {weddingStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-2xl">Шаг 2. Примерный бюджет</h3>
                  <input
                    inputMode="numeric"
                    placeholder="Введите сумму в рублях"
                    value={wedding.budgetAmount}
                    onChange={(e) => setWedding((p) => ({ ...p, budgetAmount: e.target.value.replace(/\D/g, "") }))}
                    className="w-full border border-[#bfa57a]/45 bg-transparent px-4 py-4 text-lg outline-none placeholder:text-[#8e816d] focus:border-[#94784e]"
                  />
                  <label className="flex items-center gap-3 text-sm text-[#443c31]">
                    <input
                      type="checkbox"
                      checked={wedding.allowIncrease}
                      onChange={(e) => setWedding((p) => ({ ...p, allowIncrease: e.target.checked }))}
                      className="h-4 w-4 accent-[#1b1b1b]"
                    />
                    Рассматриваете ли вы увеличение бюджета на 10%
                  </label>
                  <p className="text-sm text-[#5e5447]">Текущий бюджет: {formatMoney(wedding.budgetAmount)}</p>
                </div>
              )}

              {weddingStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-2xl">Шаг 3. Площадка в Томске</h3>
                  <input
                    list="venues"
                    placeholder="Введите площадку"
                    value={wedding.venue}
                    onChange={(e) => setWedding((p) => ({ ...p, venue: e.target.value }))}
                    className="w-full border border-[#bfa57a]/45 bg-transparent px-4 py-4 text-lg outline-none placeholder:text-[#8e816d] focus:border-[#94784e]"
                  />
                  <datalist id="venues">
                    {venues.map((v) => (
                      <option value={v} key={v} />
                    ))}
                  </datalist>

                  <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                    {venues.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setWedding((p) => ({ ...p, venue: v }))}
                        className={`border px-3 py-2 text-left text-sm transition ${
                          wedding.venue === v
                            ? "border-[#1b1b1b] bg-[#1b1b1b] text-[#f7e9ce]"
                            : "border-[#c1a97f]/45 text-[#2d261c] hover:border-[#8f7548]"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setWeddingStep((s) => Math.max(1, s - 1))}
                  disabled={weddingStep === 1}
                  className="border border-[#c1a97f]/50 px-6 py-3 text-sm uppercase tracking-[0.12em] text-[#332c22] disabled:opacity-30"
                >
                  Назад
                </button>

                {weddingStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setWeddingStep((s) => Math.min(3, s + 1))}
                    disabled={!weddingCanNext}
                    className="bg-[#1b1b1b] px-6 py-3 text-sm uppercase tracking-[0.12em] text-[#f7e9ce] disabled:opacity-40"
                  >
                    Далее
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleWeddingSubmit}
                    disabled={!weddingCanNext || loading}
                    className="bg-[#1b1b1b] px-6 py-3 text-sm uppercase tracking-[0.12em] text-[#f7e9ce] disabled:opacity-40"
                  >
                    Подобрать специалистов
                  </button>
                )}
              </div>
            </div>

            {loading && (
              <div className="mt-10 flex flex-col items-center gap-4">
                <motion.div
                  className="h-14 w-14 rounded-full border border-[#bfa57a]/45 border-t-[#181818]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-[#322b20]">Подбираем лучших специалистов для вашей свадьбы...</p>
              </div>
            )}
          </motion.main>
        )}

        {view === "team" && (
          <motion.main key="team" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
            <div className="flex items-center justify-between">
              <button onClick={() => setView("home")} className="text-xs uppercase tracking-[0.2em] text-[#8e7447] hover:opacity-70">
                На главную
              </button>
              <a href={MAX_LINK} target="_blank" rel="noreferrer" className="text-xs uppercase tracking-[0.2em] text-[#8e7447] hover:opacity-70">
                Макс
              </a>
            </div>

            <h2 className="mt-8 text-4xl sm:text-6xl">Команда под ваш запрос</h2>
            <p className="mt-3 max-w-3xl text-[#4b4337]">
              Дата: {wedding.date || "не указана"}. Бюджет: {formatMoney(wedding.budgetAmount)}. Увеличение на 10%: {wedding.allowIncrease ? "да" : "нет"}. Площадка: {wedding.venue || "не указана"}.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {team.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-[#c1a97f]/40 bg-[#fcf8f0] p-6"
                >
                  <h3 className="text-2xl">{item.title}</h3>
                  <p className="mt-2 text-[#4b4337]">{item.text}</p>
                </motion.div>
              ))}
            </div>

            <a
              href={MAX_LINK}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex border border-[#181818] bg-[#181818] px-6 py-4 text-sm uppercase tracking-[0.14em] text-[#f7e9ce]"
            >
              Написать Максу
            </a>
          </motion.main>
        )}

        {view === "specialist" && (
          <motion.main key="specialist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
            <div className="flex items-center justify-between">
              <button onClick={() => setView("home")} className="text-xs uppercase tracking-[0.2em] text-[#8e7447] hover:opacity-70">
                На главную
              </button>
              <a href={MAX_LINK} target="_blank" rel="noreferrer" className="text-xs uppercase tracking-[0.2em] text-[#8e7447] hover:opacity-70">
                Макс
              </a>
            </div>

            <h2 className="mt-8 text-4xl sm:text-6xl">Кто ты?</h2>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setSelectedRole(role);
                    setSpecialist((p) => ({ ...p, role }));
                  }}
                  className={`rounded-xl border px-3 py-3 text-sm uppercase tracking-[0.08em] ${
                    selectedRole === role
                      ? "border-[#181818] bg-[#181818] text-[#f7e9ce]"
                      : "border-[#c1a97f]/45 bg-[#fcf8f0] text-[#2e271d]"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {selectedRole && (
              <form onSubmit={handleSpecialistSubmit} className="mt-7 space-y-4 rounded-2xl border border-[#c1a97f]/40 bg-[#fcf8f0] p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    required
                    value={specialist.name}
                    onChange={(e) => setSpecialist((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ваше имя"
                    className="border border-[#bfa57a]/45 bg-transparent px-4 py-3 outline-none placeholder:text-[#8e816d] focus:border-[#94784e]"
                  />
                  <input
                    required
                    value={specialist.experience}
                    onChange={(e) => setSpecialist((p) => ({ ...p, experience: e.target.value }))}
                    placeholder="Опыт работы"
                    className="border border-[#bfa57a]/45 bg-transparent px-4 py-3 outline-none placeholder:text-[#8e816d] focus:border-[#94784e]"
                  />
                  <input
                    required
                    type="url"
                    value={specialist.portfolio}
                    onChange={(e) => setSpecialist((p) => ({ ...p, portfolio: e.target.value }))}
                    placeholder="Ссылка на портфолио"
                    className="border border-[#bfa57a]/45 bg-transparent px-4 py-3 outline-none placeholder:text-[#8e816d] focus:border-[#94784e] sm:col-span-2"
                  />
                  <input
                    required
                    value={specialist.price}
                    onChange={(e) => setSpecialist((p) => ({ ...p, price: e.target.value }))}
                    placeholder="Стоимость услуг"
                    className="border border-[#bfa57a]/45 bg-transparent px-4 py-3 outline-none placeholder:text-[#8e816d] focus:border-[#94784e] sm:col-span-2"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.12em] text-[#746856]">Отметьте занятые даты</p>
                  <BusyCalendar
                    selected={specialist.busyDates}
                    onToggle={(iso) =>
                      setSpecialist((p) => ({
                        ...p,
                        busyDates: p.busyDates.includes(iso)
                          ? p.busyDates.filter((d) => d !== iso)
                          : [...p.busyDates, iso],
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button type="submit" className="bg-[#181818] px-7 py-4 text-sm uppercase tracking-[0.14em] text-[#f7e9ce]">
                    Отправить заявку
                  </button>
                  {specialistSent && <p className="text-sm text-[#4d4639]">Заявка отправлена.</p>}
                </div>
              </form>
            )}
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}