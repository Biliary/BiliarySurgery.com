# Biliary Surgery Mastery

Operative videos, courses and training in complex laparoscopic gallbladder and bile duct surgery.

**Live site:** https://biliary.github.io/BiliarySurgery.com/

## Editing the site (no code needed)

1. Go to **https://app.pagescms.org** and click **Sign in with GitHub**.
2. Choose the repository **Biliary/BiliarySurgery.com**.
3. Pick a section on the left (Programmes, Video library, Courses, Home page, About…), make changes and click **Save**.
4. The live site updates by itself within about a minute.

### Adding a course programme with photos
Programmes → **Add an entry** under Courses → fill in the title, dates, venue and description → add a main photo and as many gallery photos as you like → Save.
Courses move from *Upcoming* to *Past courses* automatically once their end date has passed.

### Adding a video
1. Upload the video to **Vimeo** (recommended, with privacy set to "Hide from Vimeo" and embedding limited to this site) or as an unlisted **YouTube** video.
2. Video library → Videos → open an entry (or add one) → paste the video link → Save.
Do not upload video files to GitHub itself; it is not built for streaming and limits file size to 100 MB.

## How it is built
Plain HTML, CSS and JavaScript, hosted free on GitHub Pages. All text lives in `content/*.json`; photos and documents go in `media/`. The editor forms are defined in `.pages.yml`.
