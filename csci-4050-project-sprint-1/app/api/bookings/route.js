import nodemailer from 'nodemailer'
import dbConnect from '../../../database/db'
import Booking from '../../../models/booking'
import Movie from '../../../models/movie'
import User from '../../../models/user'

function getTransporter() {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPass) {
    throw new Error('Missing Gmail SMTP configuration: set GMAIL_USER and GMAIL_APP_PASSWORD')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  })
}

function buildEmailContent({ userName, movieTitle, showtime, seats, totalPrice }) {
  const seatsText = seats.join(', ')
  return {
    subject: 'Booking Confirmation - Cinema E-Booking System',
    text: `Hi ${userName},\n\nYour booking is confirmed.\n\nMovie: ${movieTitle}\nShowtime: ${showtime}\nSeats: ${seatsText}\nTotal Price: $${Number(totalPrice).toFixed(2)}\n\nThank you for booking with us!`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
        <h2 style="color: #2d5016;">Booking Confirmed</h2>
        <p>Hi ${userName},</p>
        <p>Your booking is confirmed.</p>
        <ul>
          <li><strong>Movie:</strong> ${movieTitle}</li>
          <li><strong>Showtime:</strong> ${showtime}</li>
          <li><strong>Seats:</strong> ${seatsText}</li>
          <li><strong>Total Price:</strong> $${Number(totalPrice).toFixed(2)}</li>
        </ul>
        <p>Thank you for booking with us!</p>
      </div>
    `,
  }
}

export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()
    const userId = body.userId
    const movieId = body.movieId
    const showtime = body.showtime ? String(body.showtime).trim() : ''
    const seats = Array.isArray(body.seats) ? body.seats.map(seat => String(seat).trim()) : []
    const totalPrice = Number(body.totalPrice)

    if (!userId || !movieId || !showtime || seats.length === 0 || Number.isNaN(totalPrice)) {
      return Response.json(
        { success: false, error: 'userId, movieId, showtime, seats, and totalPrice are required' },
        { status: 400 },
      )
    }

    const [user, movie] = await Promise.all([
      User.findById(userId),
      Movie.findById(movieId),
    ])

    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (!movie) {
      return Response.json({ success: false, error: 'Movie not found' }, { status: 404 })
    }

    const booking = await Booking.create({
      userId,
      movieId,
      showtime,
      seats,
      totalPrice,
      createdAt: new Date(),
    })

    const transporter = getTransporter()
    const emailContent = buildEmailContent({
      userName: user.name || 'Customer',
      movieTitle: movie.title || 'Movie',
      showtime,
      seats,
      totalPrice,
    })

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    })

    return Response.json(
      {
        success: true,
        message: 'Booking saved and confirmation email sent',
        booking,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating booking:', error)
    return Response.json(
      { success: false, error: error.message || 'Failed to create booking' },
      { status: 500 },
    )
  }
}
