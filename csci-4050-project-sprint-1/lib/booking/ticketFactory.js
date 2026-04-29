export const TICKET_PRICES = {
  adult: 12,
  child: 8,
  senior: 10,
}

export function createTicketEntry({ booking, seat, ticketType }) {
  const normalizedType = TICKET_PRICES[ticketType] ? ticketType : 'adult'
  const price = TICKET_PRICES[normalizedType]

  return {
    booking: booking._id,
    showing: booking.showingId,
    seat,
    ticketType: normalizedType,
    basePrice: price,
    price,
  }
}

export function createTicketEntriesFromBooking(booking) {
  const seatSelections =
    booking.seatSelections instanceof Map
      ? Object.fromEntries(booking.seatSelections)
      : booking.seatSelections || {}

  return (booking.seats || []).map((seat) =>
    createTicketEntry({
      booking,
      seat,
      ticketType: seatSelections[seat] || 'adult',
    })
  )
}
