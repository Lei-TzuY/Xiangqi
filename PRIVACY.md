# Privacy Policy

Last updated: 2026-09-04

Xiangqi is currently an open-source prototype. The current game service does not require user accounts and does not intentionally request names, email addresses, phone numbers, payment information, precise location, contacts, or other personal profile data.

Game state consists of a random game identifier, board position, move history, selected user/model colors, timestamps, and game status. In the current implementation this state is held in process memory and expires after 24 hours or when the process restarts.

A future production deployment may generate ordinary infrastructure logs needed for reliability, security, abuse prevention, and debugging. This policy must be reviewed and updated before public deployment if hosting, analytics, authentication, persistent storage, or any additional data collection is introduced.

Questions or privacy requests can be filed at https://github.com/Lei-TzuY/Xiangqi/issues.
