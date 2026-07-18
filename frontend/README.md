# Frontend Deployment Folder

This folder is prepared for separate frontend deployment.

## Recommended

To avoid breaking image paths, keep frontend deployment from project root (`E:/Referral`) where all HTML and image files already exist.

## If you still want frontend in this folder

Move/copy these files into `frontend/` before deploying:

- `index.html`
- `download.html`
- `contactus.html`
- `adminpanel.html` (optional, can stay on backend)
- `config.js`
- all image assets used by pages (`logo.png`, `floating object.png`, `website 1.png` ... etc)

Then deploy `frontend/` as a separate Vercel project.
