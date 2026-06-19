// Единая формула расчёта стоимости банкета. Все цены в копейках.
//
// Стоимость = (сумма позиций «за гостя» × количество гостей)
//           + (сумма позиций «за мероприятие», фикс)
//
// Позиции «за гостя» (perEvent === false) умножаются на число гостей.
// Позиции «за мероприятие» (perEvent === true), например оформление зала,
// прибавляются один раз и НЕ зависят от числа гостей.

export type CostItem = {
  pricePerGuest: number;
  perEvent: boolean;
  // Информационная позиция (отметка «нужно/не нужно») в стоимость не входит.
  informational?: boolean;
};

export type CostBreakdown = {
  perGuest: number; // сумма «за гостя» (на одного)
  guestTotal: number; // perGuest × guests
  eventFees: number; // сумма фиксов «за мероприятие»
  total: number; // итог
};

export function computeCost(items: CostItem[], guests: number): CostBreakdown {
  let perGuest = 0;
  let eventFees = 0;
  for (const it of items) {
    if (it.informational) continue; // отметка, в стоимость не входит
    if (it.perEvent) eventFees += it.pricePerGuest;
    else perGuest += it.pricePerGuest;
  }
  const guestTotal = perGuest * guests;
  return { perGuest, guestTotal, eventFees, total: guestTotal + eventFees };
}
