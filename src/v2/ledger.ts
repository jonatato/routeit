import type { ScheduleItem, TravelItinerary } from '../data/itinerary';

export type LedgerMember = {
  id: string;
  name: string;
};

export type LedgerExpense = {
  id: string;
  label: string;
  amount: number;
  payerId: string;
  currency: string;
};

export type LedgerPayment = {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
};

export type Settlement = {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  amount: number;
};

export type Ledger = {
  expenses: LedgerExpense[];
  total: number;
  currency: string;
  balances: Array<{ member: LedgerMember; balance: number }>;
  settlements: Settlement[];
};

const round = (value: number) => Math.round(value * 100) / 100;

export function expensesFromItinerary(itinerary: TravelItinerary, fallbackPayerId: string): LedgerExpense[] {
  const expenses: LedgerExpense[] = [];
  itinerary.days.forEach((day, dayIndex) => {
    day.schedule.forEach((item, itemIndex) => {
      if (!item.cost || item.cost <= 0) return;
      expenses.push({
        id: `${day.id || dayIndex}-${itemIndex}`,
        label: item.activity,
        amount: item.cost,
        payerId: item.costPayerId || fallbackPayerId,
        currency: item.costCurrency || 'EUR',
      });
    });
  });
  return expenses;
}

export function buildLedger(
  members: LedgerMember[],
  expenses: LedgerExpense[],
  payments: LedgerPayment[] = [],
): Ledger {
  const currency = expenses[0]?.currency ?? 'EUR';
  const paid = new Map(members.map(member => [member.id, 0]));
  const owed = new Map(members.map(member => [member.id, 0]));
  const shareCount = Math.max(members.length, 1);

  expenses.forEach(expense => {
    paid.set(expense.payerId, (paid.get(expense.payerId) ?? 0) + expense.amount);
    const share = expense.amount / shareCount;
    members.forEach(member => {
      owed.set(member.id, (owed.get(member.id) ?? 0) + share);
    });
  });

  payments.forEach(payment => {
    paid.set(payment.fromId, (paid.get(payment.fromId) ?? 0) + payment.amount);
    paid.set(payment.toId, (paid.get(payment.toId) ?? 0) - payment.amount);
  });

  const balances = members.map(member => ({
    member,
    balance: round((paid.get(member.id) ?? 0) - (owed.get(member.id) ?? 0)),
  }));

  return {
    expenses,
    total: round(expenses.reduce((sum, expense) => sum + expense.amount, 0)),
    currency,
    balances,
    settlements: suggestSettlements(balances),
  };
}

export function suggestSettlements(balances: Array<{ member: LedgerMember; balance: number }>): Settlement[] {
  const credits = balances.filter(entry => entry.balance > 0.009).map(entry => ({ ...entry }));
  const debits = balances.filter(entry => entry.balance < -0.009).map(entry => ({ ...entry, balance: Math.abs(entry.balance) }));
  credits.sort((a, b) => b.balance - a.balance);
  debits.sort((a, b) => b.balance - a.balance);

  const settlements: Settlement[] = [];
  let creditIndex = 0;
  let debitIndex = 0;

  while (creditIndex < credits.length && debitIndex < debits.length) {
    const credit = credits[creditIndex];
    const debit = debits[debitIndex];
    const amount = round(Math.min(credit.balance, debit.balance));
    if (amount > 0) {
      settlements.push({
        fromId: debit.member.id,
        toId: credit.member.id,
        fromName: debit.member.name,
        toName: credit.member.name,
        amount,
      });
    }
    credit.balance = round(credit.balance - amount);
    debit.balance = round(debit.balance - amount);
    if (credit.balance <= 0.009) creditIndex += 1;
    if (debit.balance <= 0.009) debitIndex += 1;
  }

  return settlements;
}

export function paymentsForSettlements(settlements: Settlement[]): LedgerPayment[] {
  return settlements.map(settlement => ({
    id: `settle-${settlement.fromId}-${settlement.toId}`,
    fromId: settlement.fromId,
    toId: settlement.toId,
    amount: settlement.amount,
  }));
}

export function withActivity(
  itinerary: TravelItinerary,
  dayIndex: number,
  item: ScheduleItem,
  itemIndex?: number,
): TravelItinerary {
  return {
    ...itinerary,
    days: itinerary.days.map((day, index) => {
      if (index !== dayIndex) return day;
      const schedule = [...day.schedule];
      if (itemIndex === undefined) schedule.push(item);
      else schedule[itemIndex] = item;
      return { ...day, schedule };
    }),
  };
}

export function withoutActivity(itinerary: TravelItinerary, dayIndex: number, itemIndex: number): TravelItinerary {
  return {
    ...itinerary,
    days: itinerary.days.map((day, index) => {
      if (index !== dayIndex) return day;
      return { ...day, schedule: day.schedule.filter((_, scheduleIndex) => scheduleIndex !== itemIndex) };
    }),
  };
}
