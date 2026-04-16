import Showroom from '../../models/showroom';

const DEFAULT_SHOWROOMS = [
  { cinema: 'Showroom 1', seatcount: 40 },
  { cinema: 'Showroom 2', seatcount: 60 },
  { cinema: 'Showroom 3', seatcount: 80 },
];

export async function ensureDefaultShowrooms() {
  const existingShowrooms = await Showroom.find({}).select('cinema').lean();
  const existingNames = new Set(
    existingShowrooms.map((showroom) => String(showroom.cinema || '').trim().toLowerCase())
  );

  const missingShowrooms = DEFAULT_SHOWROOMS.filter(
    (showroom) => !existingNames.has(showroom.cinema.toLowerCase())
  );

  if (missingShowrooms.length > 0) {
    await Showroom.insertMany(missingShowrooms, { ordered: false });
  }

  return Showroom.find({}).sort({ cinema: 1 });
}
