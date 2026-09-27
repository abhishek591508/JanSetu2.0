# JanSetu
```
A hyperlocal bridge between civilians and government authorities. A person reports a nearby problem with a photo and GPS. Neighbours upvote it. The post ranks by distance, upvote count, and how fast votes arrive, then reaches a wider area and higher authorities until someone resolves it.
```

# Basic Flow

![Flow Of Project](<Screenshot 2026-09-25 215015.png>)

## Stack
```
MongoDB, Express, React, Node, JWT, Mongoose. The React app is Vite.
```

## Run

MongoDB must be running locally.

```powershell
cd backend
npm install
npm run dev
```

`backend/.env`:

```text
PORT=5000
MONGO_URI=mongodb://localhost:27017/jansetu-Bridge-the-gap
JWT_SECRET=your_secret
```

```powershell
cd frontend
npm install
npm run dev
```

API: `http://localhost:5000`  
App: `http://localhost:5173`

## API in place

| Method | Path | Who |
|---|---|---|
| POST | `/api/auth/signup` | Public. Creates a civilian. |
| POST | `/api/auth/login` | Public. Returns a JWT. |
| GET | `/api/auth/me` | Any logged-in user. `Authorization: Bearer <token>` |
| POST | `/api/post` | Civilian only. Body: `description`, `category`, `latitude`, `longitude`. |

Categories: `roads`, `lights`, `water`, `garbage`, `safety`, `other`.  
The server stores the map point as `[longitude, latitude]`, sets the department from the category, and opens the post at a 1 km radius.

## Roles

 Role | What they do |
|------|------|
 Civilian | Sign up, report an issue, see nearby posts, upvote |
 Authority | See issues for their department and level, claim one, upload proof, resolve it |
 Admin | Manages users and roles |

Levels are `local`, `district`, and `higher`. Visibility starts at 1 km and can grow through 5, 10, and 20 km. Escalation lines are 10, 25, and 40 upvotes.


# my mistakes:
```
1. I kept app.use(cors()) after the routes call inside index.js, due to which error was comming => then i keep it above.

2. I forgot to make login async due to which problem was comming => i made login function in frontend async.

```