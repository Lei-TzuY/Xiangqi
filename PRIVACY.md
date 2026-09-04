# Privacy Policy

Last updated: 2026-09-04

Xiangqi does not require user accounts and does not intentionally request names, email addresses, phone numbers, payment information, precise location, contacts, or other personal profile data.

Game state consists of a random game identifier, board position, move history, selected user/model colors, timestamps, and game status. When a shared Redis/Valkey backend is configured, each game is stored under its random identifier with a 24-hour time-to-live and the expiry is refreshed when the game changes. Without a shared backend, state remains process-local memory.

The hosted service may generate ordinary infrastructure logs for reliability, security, abuse prevention, and debugging. Application logs include request identifiers, request method/path, status code, duration, service events, and error messages. The application does not intentionally log Xiangqi board state or move history in normal request logs.

The public staging configuration uses Render. Render may process ordinary infrastructure metadata according to its own service terms and privacy practices. This policy must be reviewed again before public OpenAI submission if authentication, analytics, additional hosting providers, or new data collection is introduced.

Questions or privacy requests can be filed at https://github.com/Lei-TzuY/Xiangqi/issues.
