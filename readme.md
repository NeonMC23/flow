# Flow – Music Player

Flow is a lightweight, browser-based music player built with vanilla JavaScript, HTML, and CSS. It supports a dynamic music library, album-based organization, real-time filtering, and waveform visualization using [Tone.js](https://tonejs.github.io/).

---

## Features

- Play local audio files (MP3, WAV, FLAC)
- Organize tracks by album and artist
- Live search and filtering by album or artist
- Album cover display
- Real-time oscilloscope waveform using Web Audio API
- Simple JSON-based music database
- Responsive, dark-themed UI

---

## Project Structure

```

flow/
├── index.html # Main music player UI
├── upload.html # Instructions to add music
├── src/
│ ├── css/
│ │ └── style.css
│ ├── icon/
│ │ └── (SVGs + logo)
│ ├── javascript/
│ │ ├── script.js # Core logic (player + fetch)
│ │ ├── filter.js # Filtering logic
│ │ └── effect.js # Oscilloscope + Tone.js
│ └── data/
│ ├── album.json # List of album folder names
│ └── album/
│ └── your-album/
│ ├── infos.json
│ ├── cover.png
│ └── \*.mp3

```

---

## How to Add Music

To add new albums to the player, follow this workflow:

1. Navigate to `src/data/album/`
2. Create a new folder for your album (e.g. `my-album`)
3. Add the audio tracks and a `cover.png` image to this folder
4. Create an `infos.json` file in the same folder with the following structure:

```json
{
  "title": "Album Title",
  "artist": "Artist Name",
  "cover": "cover.png",
  "tracks": [
    { "title": "Track 1", "file": "track1.mp3", "duration": "3:21" },
    { "title": "Track 2", "file": "track2.mp3", "duration": "4:05" }
  ]
}
```

5. Open `src/data/album.json` and add your new folder name to the array:

```json
["album1", "album2", "your-album"]
```

6. Reload the web player. Your new album should now appear in the library.

For a step-by-step visual guide, see the `upload.html` page included in the project.

---

## Tech Stack

- HTML / CSS / JavaScript (no framework)
- Web Audio API
- [Tone.js](https://tonejs.github.io/) for audio scheduling and visualization
- JSON for music metadata
- No dependencies or build tools required

---

## Local Development

To run this project locally:

1. Clone the repository

---

2. Install Python (if you don't have it)

---

3. Navigate to your project directory using your terminal or command prompt:

```bash
cd path/to/your/project
```

Then run the following command:

- **Python 3.x (recommended)**:

```bash
python3 -m http.server 5500
```

Or on Windows if `python3` doesn’t work:

```bash
python -m http.server 5500
```

- This starts a local server at:
  `http://127.0.0.1:5500/`

---

4. View the App in Your Browser : Open your browser and go to:

```
http://127.0.0.1:5500/index.html
```

Your Flow music player should now be up and running locally. Changes you make to the files will reflect automatically when you refresh the page.

---

## License

This project is open-source and available under the MIT License.

---

## Credits

Created by \[Neon]. Contributions are welcome via pull requests or issues on GitHub.
