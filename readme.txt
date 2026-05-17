================================================================================
  NOTEAPP - FINAL PROJECT 503073
  Full-Stack Note-Taking Web Application
================================================================================

TEAM INFORMATION
----------------
[Fill in team member names and student IDs here]

Example folder name: id1_fullname1_id2_fullname2/
Example ZIP file   : id1_fullname1_id2_fullname2.zip


================================================================================
  PROJECT OVERVIEW
================================================================================

NoteApp is a full-stack note-taking web application implementing all 28
required project criteria. Built with a modern technology stack:

  Frontend  : React 19 + Vite + TailwindCSS 3
  Backend   : Laravel 11 (PHP 8.2) - RESTful API
  Database  : MySQL 8.0
  Real-time : Socket.IO (Node.js WebSocket server)
  Auth      : Laravel Sanctum (token-based sessions)
  Email     : PHPMailer via Gmail SMTP (real emails)
  Deployment: Docker Compose (4 containers, single command)


================================================================================
  HOW TO RUN - DOCKER COMPOSE
================================================================================

PREREQUISITES:
  - Docker Desktop must be installed and running
  - The following ports must be free on your machine:
      5173  (Frontend)
      8000  (Backend API)
      3001  (WebSocket)
      3306  (MySQL)
      8080  (phpMyAdmin)

STEP-BY-STEP INSTRUCTIONS:

  Step 1: Extract the submitted ZIP file to any folder on your computer.

  Step 2: Open a terminal in that folder:
            - Windows: Right-click -> "Open in Terminal" or PowerShell
            - Mac/Linux: Open Terminal and cd to the folder

  Step 3: Build and start all containers:

            docker compose up -d --build

          Wait approximately 60 seconds for all services to initialize.

  Step 4: Run database migrations (REQUIRED on first run only):

            docker exec www-backend-1 php artisan migrate --force

  Step 5: Open your browser and navigate to:

            http://localhost:5173

  The application is now fully running and ready for evaluation.

USEFUL COMMANDS:
  Stop all services  : docker compose down
  View service logs  : docker compose logs -f
  Check status       : docker compose ps
  Restart a service  : docker compose restart backend

SERVICE URLS:
  Main App    -> http://localhost:5173
  API         -> http://localhost:8000/api
  phpMyAdmin  -> http://localhost:8080  (user: root, pass: root)


================================================================================
  PRE-LOADED ACCOUNTS FOR EVALUATION
================================================================================

Two activated accounts are available for immediate testing:

  ACCOUNT 1 (primary - has sample notes, labels, and shared data):
    Email    : demo@noteapp.com
    Password : password

  ACCOUNT 2 (secondary - for testing share/receive features):
    Email    : hoquoctien0811@gmail.com
    Password : password

HOW TO TEST THE SHARING FEATURE:
  1. Log in as Account 1 (demo@noteapp.com)
  2. Open any note, click the Share button (chain link icon)
  3. Enter: hoquoctien0811@gmail.com, choose Viewer or Editor role
  4. Click Save - Account 2 will receive an email notification
  5. Log out, then log in as Account 2
  6. Go to "Da chia se" tab to see the shared note

HOW TO REGISTER A NEW ACCOUNT:
  1. Go to http://localhost:5173/register
  2. Fill in: Display Name, Username, Email, Password (x2)
  3. Check your email inbox for the activation link
  4. Click the link to activate, then log in


================================================================================
  EMAIL SYSTEM NOTES
================================================================================

The application sends REAL emails via Gmail SMTP for:
  - Account activation after registration
  - Password reset link
  - Share notification when a note is shared

Email config is stored in server-laravel/.env
Sender account: nguyentrongquoc11062006@gmail.com

If emails are not received: check the Spam/Junk folder.

NOTE FOR INSTRUCTOR: SMTP credentials are left in .env intentionally
to allow full evaluation of the email features without extra setup.


================================================================================
  FEATURE GUIDE
================================================================================

CREATING NOTES:
  - Click "+ Ghi chu moi" button (bottom left or top area)
  - Enter a title and content
  - Note saves automatically after 600ms of inactivity (debounced auto-save)
  - No "Save" button needed

LIST VIEW / GRID VIEW:
  - Toggle icons at the top right of the notes area
  - Grid view is the default

SEARCH:
  - Type in the search bar at the top
  - Results update within 300ms (no Submit button required)
  - Searches both title and content

LABELS:
  - Click the label icon on any note card to attach labels
  - Click the gear icon inside the label panel to create/edit/delete labels
  - Click a label in the sidebar to filter notes by that label

PIN / UNPIN:
  - Click the pin icon on a note card
  - Pinned notes always appear at the top, sorted server-side

PASSWORD LOCK:
  - Click the lock icon on a note to set a password (enter twice)
  - To view a locked note, click the lock and enter the password
  - After refreshing the page, the note re-locks automatically
  - A LOCKED NOTE CANNOT BE SHARED until it is unlocked
  - Removing the password requires entering the current password first

SHARING NOTES:
  - The note must be unlocked before sharing
  - Click the chain link icon on a note card
  - Enter recipient email (must be a registered and activated account)
  - Set role: Viewer (read-only) or Editor (can modify content)
  - Recipient receives an email notification automatically

REAL-TIME COLLABORATION:
  - Open the same shared note on two different accounts simultaneously
  - Edits from one account appear instantly on the other (via WebSocket)
  - Works in two separate browser windows or on two devices

DARK MODE:
  - Toggle the moon/sun icon in the top right corner

PROFILE & ACCOUNT:
  - Click your avatar in the sidebar to go to the Profile page
  - Edit display name, bio, avatar image, and accent color
  - Change account password (requires entering current password first)

ATTACH IMAGES:
  - Open a note for editing, click the attachment icon
  - Uploaded images are stored on the server and previewed in the note

PWA / OFFLINE MODE:
  - The app can be installed as a Progressive Web App (PWA)
  - When offline, previously viewed notes remain accessible from cache


================================================================================
  TECHNOLOGY & ARCHITECTURE
================================================================================

FRONTEND (frontend-react/):
  - Framework   : React 19 with Vite
  - Styling     : TailwindCSS 3
  - Real-time   : Socket.IO client (port 3001)
  - PWA         : manifest.json + Service Worker (sw.js)
  - Key pages   : Home.jsx (main app), User.jsx (profile),
                  Login/Register/ForgotPassword/ResetPassword

BACKEND (server-laravel/):
  - Framework   : Laravel 11 (PHP 8.2)
  - Auth        : Laravel Sanctum (token-based)
  - ORM         : Eloquent with MySQL
  - Email       : PHPMailer
  - API style   : RESTful (api.php routes)

WEBSOCKET SERVER (websocket-server/):
  - Runtime     : Node.js
  - Library     : Socket.IO
  - Events      : join-note, leave-note, edit-note, note-updated
  - Pattern     : Room-based (one room per note ID)

DATABASE (7 tables):
  - users                 : accounts, tokens, preferences
  - personal_access_tokens: Sanctum session tokens
  - notes                 : content, pin, password hash
  - labels                : user-defined label tags
  - note_labels           : pivot (notes <-> labels)
  - note_attachments      : uploaded file metadata
  - shared_notes          : share relationships + roles


================================================================================
  PROJECT STRUCTURE
================================================================================

www/
|-- docker-compose.yml          <- Run everything with one command
|-- readme.txt                  <- This file
|-- README.md                   <- Technical documentation
|-- frontend-react/
|   |-- src/
|   |   |-- pages/
|   |   |   |-- Home.jsx        <- Main app (notes, calendar, share)
|   |   |   |-- User.jsx        <- Profile & password management
|   |   |   |-- Login.jsx
|   |   |   |-- Register.jsx    <- Username field + validation
|   |   |   |-- ForgotPassword.jsx
|   |   |   `-- ResetPassword.jsx
|   |   `-- api.js              <- API client (all HTTP calls)
|   `-- public/
|       |-- manifest.json       <- PWA config
|       `-- sw.js               <- Service Worker (offline)
|-- server-laravel/
|   |-- app/Http/Controllers/
|   |   |-- AuthController.php       <- Register, login, reset
|   |   |-- NoteController.php       <- CRUD, search, pin, lock
|   |   |-- NoteShareController.php  <- Share, notify, real-time poll
|   |   |-- LabelController.php      <- Label CRUD
|   |   |-- UserController.php       <- Profile, preferences
|   |   `-- NoteAttachmentController.php <- File upload
|   |-- routes/api.php          <- All 30+ API endpoints
|   `-- .env                    <- DB + Mail configuration
`-- websocket-server/
    `-- server.js               <- Socket.IO server


================================================================================
  SELF-ASSESSMENT - 28 CRITERIA
================================================================================

ACCOUNT MANAGEMENT:
  [x]  1. User registration - email, username, display name, password x2
  [x]  2. Account activation via email (PHPMailer - real SMTP email)
  [x]  3. User login and logout (Sanctum token auth)
  [x]  4. Password reset via email (token-based secure link)
  [x]  5. View profile and avatar
  [x]  6. Edit profile and avatar (with file upload support)
  [x]  7. Change password (requires entering current password)
  [x]  8. User preferences (dark/light theme, default font and color)

SIMPLE NOTE MANAGEMENT:
  [x]  9. Display notes in list view
  [x] 10. Display notes in grid view
  [x] 11. Create notes (title + content only - clean interface)
  [x] 12. Update notes (same interface as create)
  [x] 13. Delete notes (confirmation dialog required)
  [x] 14. Auto-save notes (debounced 600ms - no Save button)
  [x] 15. Attach images to notes (real server-side file storage)
  [x] 16. Pin notes to top (server-side ordering)
  [x] 17. Search notes (debounced 300ms, full-text, no Submit button)
  [x] 18. Label management CRUD (create, edit color, delete)
  [x] 19. Attach labels to notes (supports multiple labels per note)
  [x] 20. Filter notes based on labels
  [x] 21. Enable and disable password on notes (confirmation required)
  [x] 22. Password protection, change password (old password + new x2)

ADVANCED FEATURES:
  [x] 23. Share and receive notes (email validation + email notification)
  [x] 24. Real-time collaboration (WebSocket via Socket.IO)
  [x] 25. UI and UX (animations, dark mode, toast alerts, modal design)
  [x] 26. Responsive design (mobile and tablet breakpoints)
  [x] 27. Offline capabilities (PWA with Service Worker caching)
  [x] 28. Docker Compose deployment (4 containers, one command)

BETTER APPROACH HIGHLIGHTS (extra quality points):
  - Recipient receives a real email notification when a note is shared
  - Note password change: must enter old password + new password twice
  - Locked notes CANNOT be shared until unlocked (security rule)
  - WebSocket real-time (not just polling) - changes appear instantly
  - Unseen shared notes shown as notification badges on login
  - Username field on registration form (separate from email)


================================================================================
  TROUBLESHOOTING
================================================================================

Problem: "Port already in use" error
Solution: Close any apps using ports 5173, 8000, 3001, or 3306.
          Or edit the port mappings in docker-compose.yml.

Problem: Backend cannot connect to database
Solution: Wait 30 more seconds for MySQL to initialize, then run:
          docker exec www-backend-1 php artisan migrate --force

Problem: Emails not arriving
Solution: Check the Spam/Junk folder.
          Sender is: nguyentrongquoc11062006@gmail.com
          Errors are logged but won't crash the app.

Problem: "Offline" warning appears on the frontend
Solution: The backend is still starting. Wait ~30 seconds and refresh.

Problem: Real-time editing not syncing
Solution: Make sure port 3001 is open. Check WebSocket container:
          docker compose ps
          docker compose logs websocket

================================================================================
  END OF README
================================================================================
