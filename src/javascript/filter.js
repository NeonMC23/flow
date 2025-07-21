function toggleFilterMenu() {
  const menu = document.getElementById("filterMenu");
  menu.classList.toggle("show");
}

document.addEventListener("click", function (e) {
  const menu = document.getElementById("filterMenu");
  const icon = document.querySelector(".filter-icon");
  if (!menu.contains(e.target) && !icon.contains(e.target)) {
    menu.classList.remove("show");
  }
});

document.getElementById("search").addEventListener("input", applyFilters);

let musicData = [];

function generateFilterOptions(tracks) {
  const artistSet = new Set();
  const albumSet = new Set();

  tracks.forEach((track) => {
    artistSet.add(track.artist);
    albumSet.add(track.album);
  });

  const artistSelect = document.getElementById("artist-filter");
  const albumSelect = document.getElementById("album-filter");

  artistSet.forEach((artist) => {
    const option = document.createElement("option");
    option.value = artist;
    option.textContent = artist;
    artistSelect.appendChild(option);
  });

  albumSet.forEach((album) => {
    const option = document.createElement("option");
    option.value = album;
    option.textContent = album;
    albumSelect.appendChild(option);
  });
}

function applyFilters() {
  const selectedArtist = document
    .getElementById("artist-filter")
    .value.toLowerCase();
  const selectedAlbum = document
    .getElementById("album-filter")
    .value.toLowerCase();
  const searchTerm = document.getElementById("search").value.toLowerCase();

  const filtered = musicData.filter((track) => {
    const matchArtist =
      selectedArtist === "" || track.artist.toLowerCase() === selectedArtist;
    const matchAlbum =
      selectedAlbum === "" || track.album.toLowerCase() === selectedAlbum;
    const matchSearch =
      track.title.toLowerCase().includes(searchTerm) ||
      track.artist.toLowerCase().includes(searchTerm) ||
      track.album.toLowerCase().includes(searchTerm);

    return matchArtist && matchAlbum && matchSearch;
  });

  renderTracks(filtered);
}

function renderTracks(tracks) {
  const trackList = document.getElementById("track-list");
  trackList.innerHTML = "";

  tracks.forEach((track) => {
    const li = document.createElement("li");
    li.classList.add("track-item");

    li.innerHTML = `
      <img class="cover" src="${track.cover}" alt="${track.album} cover">
      <div class="track-info">
        <strong>${track.title}</strong>
        <p>${track.artist} • ${track.album}</p>
      </div>
      <span class="duration">${track.duration}</span>
    `;

    li.onclick = () => {
      const audio = document.getElementById("audio");
      const nowTitle = document.getElementById("nowplaying-title");
      audio.src = track.src;
      audio.play();
      nowTitle.textContent = `${track.title} – ${track.artist}`;
    };

    trackList.appendChild(li);
  });
}
