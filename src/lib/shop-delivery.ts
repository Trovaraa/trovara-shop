import type { ShopDeliverySlot } from './shop'

export type ScheduledDeliverySlot = ShopDeliverySlot & {
  nextDeliveryDate: string
  nextOrderCutoffAt: string
}

const deliveryDateFormat = new Intl.DateTimeFormat('en-NG', {
  timeZone: 'UTC',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function deliveryCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  // A calendar date supplied by OS is already in Lagos. Formatting this UTC
  // midnight in UTC preserves the day for shoppers browsing in any time zone.
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null
}

function isScheduled(slot: ShopDeliverySlot, now: number): slot is ScheduledDeliverySlot {
  return slot.active !== false &&
    typeof slot.nextDeliveryDate === 'string' &&
    deliveryCalendarDate(slot.nextDeliveryDate) !== null &&
    typeof slot.nextOrderCutoffAt === 'string' &&
    Date.parse(slot.nextOrderCutoffAt) >= now
}

export function bookableDeliverySlots(slots: ShopDeliverySlot[], now: number) {
  return slots
    .filter((slot): slot is ScheduledDeliverySlot => isScheduled(slot, now))
    .sort((a, b) =>
      a.nextDeliveryDate.localeCompare(b.nextDeliveryDate) ||
      a.startTime.localeCompare(b.startTime),
    )
}

export function formatDeliveryDate(value: string) {
  const date = deliveryCalendarDate(value)
  return date ? deliveryDateFormat.format(date) : ''
}

export function formatDeliveryHours(slot: ShopDeliverySlot) {
  return `${slot.startTime.slice(0, 5)}–${slot.endTime.slice(0, 5)}`
}
