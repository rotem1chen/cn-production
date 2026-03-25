---
name: add-content
description: Add portfolio videos or clients to the CN Production website. Prompts for type (video/client), file selection, metadata, and position. Updates the JSON data files.
disable-model-invocation: true
---

# Add Content to CN Production

Interactive skill to add portfolio videos or clients to the website data files.

## Flow

1. Ask the user: **"What would you like to add? (video / client)"**

2. **If video:**
   - List files in `assets/videos/` and ask which MP4 to use
   - Ask for the **video title**
   - Ask for **orientation**: vertical or horizontal
   - Ask for **category**: restaurants, music, or others
   - Show current items in that category (read from `data/portfolio.json`) and ask for **position** (number)
   - Ask for optional **thumbnail image path** (leave empty to skip)
   - Ask for optional **external link URL** (leave empty to skip)
   - Read `data/portfolio.json`, insert the new object at the specified position in the chosen category array, and save

3. **If client:**
   - List files in `assets/clients/` and ask which logo file to use
   - Ask for the **client/company name**
   - Ask for **background color** for the logo (e.g. `#F5C518`, `#ffffff`, or empty for none)
   - Ask for **padding** around the logo (e.g. `10px`, or empty for none)
   - If background color or padding provided, build the `logoStyle` string (e.g. `background: #F5C518; padding: 10px; border-radius: 8px;`). Always include `border-radius: 8px` when there's a background.
   - Ask for optional **Instagram URL**
   - Ask for optional **Website URL**
   - Show current clients (read from `data/clients.json`) and ask for **position** (number)
   - Read `data/clients.json`, insert the new object at the specified position, remove any empty placeholder entries, and save

## Important rules

- Always read the current JSON file before modifying it
- Use `AskUserQuestion` for each prompt — do NOT assume or skip any field
- File paths in JSON should be relative to the site root (e.g. `assets/videos/myfile.mp4`, `assets/clients/logo.jpg`)
- After saving, show the user a summary of what was added
- After saving, run `node build.js` to update the cache-busting version hash
