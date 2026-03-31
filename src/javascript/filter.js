function toggleFilterMenu() {
  const menu = document.getElementById("filterMenu");
  if (menu) {
    menu.classList.toggle("show");
  }
}

document.addEventListener("click", function (e) {
  const menu = document.getElementById("filterMenu");
  const trigger = document.querySelector(".filter-trigger");
  if (menu && trigger && !menu.contains(e.target) && !trigger.contains(e.target)) {
    menu.classList.remove("show");
  }
});

const searchInput = document.getElementById("search");
if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

let musicData = [];
let currentTracks = [];
let currentIndex = -1;
let currentSort = { key: "title", dir: "asc" };
let queue = [];
let currentPlaylist = "all";
let favorites = new Set(JSON.parse(localStorage.getItem("flow-favorites") || "[]"));
let recent = JSON.parse(localStorage.getItem("flow-recent") || "[]");
let isSeeking = false;
let rafId = null;

function updateMarquee(nowTitle) {
  const marquee = nowTitle?.querySelector(".title-marquee");
  if (!marquee) return;
  const overflow = marquee.scrollWidth - nowTitle.clientWidth;
  const shouldScroll = overflow > 8;
  nowTitle.classList.toggle("is-marquee", shouldScroll);
  if (shouldScroll) {
    const distance = overflow + 24;
    const duration = Math.max(8, distance / 40);
    nowTitle.style.setProperty("--marquee-distance", `${distance}px`);
    nowTitle.style.setProperty("--marquee-duration", `${duration}s`);
  } else {
    nowTitle.style.removeProperty("--marquee-distance");
    nowTitle.style.removeProperty("--marquee-duration");
  }
}

function scheduleMarqueeUpdate() {
  const nowTitle = document.getElementById("nowplaying-title");
  if (!nowTitle) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => updateMarquee(nowTitle));
  });
  setTimeout(() => updateMarquee(nowTitle), 120);
}

function generateFilterOptions(tracks) {
  const artistSet = new Set();
  const albumSet = new Set();

  tracks.forEach((track) => {
    artistSet.add(track.artist);
    albumSet.add(track.album);
  });

  const artistSelect = document.getElementById("artist-filter");
  const albumSelect = document.getElementById("album-filter");

  if (!artistSelect || !albumSelect) return;

  artistSelect.innerHTML = '<option value="">All</option>';
  albumSelect.innerHTML = '<option value="">All</option>';

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

function parseDuration(duration) {
  if (!duration) return 0;
  const parts = duration.split(":").map((part) => parseInt(part, 10));
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function sortTracks(tracks) {
  const sorted = [...tracks];
  sorted.sort((a, b) => {
    let aVal = a[currentSort.key];
    let bVal = b[currentSort.key];

    if (currentSort.key === "duration") {
      aVal = parseDuration(aVal);
      bVal = parseDuration(bVal);
    } else {
      aVal = (aVal || "").toString().toLowerCase();
      bVal = (bVal || "").toString().toLowerCase();
    }

    if (aVal < bVal) return currentSort.dir === "asc" ? -1 : 1;
    if (aVal > bVal) return currentSort.dir === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}

function filterByPlaylist(tracks) {
  if (currentPlaylist === "favorites") {
    return tracks.filter((track) => favorites.has(track.src));
  }
  if (currentPlaylist === "recent") {
    const recentSet = new Set(recent);
    const bySrc = new Map(tracks.map((track) => [track.src, track]));
    return recent
      .filter((src) => recentSet.has(src) && bySrc.has(src))
      .map((src) => bySrc.get(src));
  }
  return tracks;
}

function applyFilters() {
  const artistFilter = document.getElementById("artist-filter");
  const albumFilter = document.getElementById("album-filter");
  const searchTerm = (document.getElementById("search")?.value || "").toLowerCase();

  const selectedArtist = (artistFilter?.value || "").toLowerCase();
  const selectedAlbum = (albumFilter?.value || "").toLowerCase();

  const filtered = filterByPlaylist(musicData).filter((track) => {
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

function updateStats(tracks) {
  const trackCount = document.getElementById("track-count");
  const artistCount = document.getElementById("artist-count");
  const albumCount = document.getElementById("album-count");

  if (!trackCount || !artistCount || !albumCount) return;

  const artists = new Set(tracks.map((track) => track.artist));
  const albums = new Set(tracks.map((track) => track.album));

  trackCount.textContent = tracks.length.toString();
  artistCount.textContent = artists.size.toString();
  albumCount.textContent = albums.size.toString();
}

function updateSortUI() {
  document.querySelectorAll(".sort-btn").forEach((btn) => {
    const isActive = btn.dataset.sort === currentSort.key;
    const label = btn.dataset.label || btn.textContent;
    btn.classList.toggle("active", isActive);
    btn.innerHTML = isActive
      ? `${label} <span>${currentSort.dir === "asc" ? "^" : "v"}</span>`
      : label;
  });
}

function setSort(key) {
  if (currentSort.key === key) {
    currentSort.dir = currentSort.dir === "asc" ? "desc" : "asc";
  } else {
    currentSort.key = key;
    currentSort.dir = "asc";
  }
  applyFilters();
  updateSortUI();
}

function playTrack(track, index) {
  const audio = document.getElementById("audio");
  const nowTitle = document.getElementById("nowplaying-title");
  const cover = document.getElementById("player-cover");
  const playBtn = document.getElementById("play-btn");

  if (!audio) return;

  audio.src = track.src;
  audio.play();
  if (playBtn) {
    playBtn.textContent = "Pause";
  }
  if (nowTitle) {
    const marquee = nowTitle.querySelector(".title-marquee");
    const text = `${track.title} - ${track.artist}`;
    if (marquee) {
      marquee.textContent = text;
      scheduleMarqueeUpdate();
    } else {
      nowTitle.textContent = text;
    }
  }
  if (cover) {
    cover.src = track.cover;
    cover.alt = `${track.album} cover`;
  }
  recent = [track.src, ...recent.filter((src) => src !== track.src)].slice(0, 30);
  localStorage.setItem("flow-recent", JSON.stringify(recent));
  currentIndex = index ?? currentTracks.findIndex((t) => t.src === track.src);
  document.querySelectorAll(".track-row").forEach((row) => {
    row.classList.toggle("active", row.dataset.src === track.src);
  });
}

function playNext() {
  if (queue.length > 0) {
    const nextTrack = queue.shift();
    renderQueue();
    playTrack(nextTrack, currentTracks.findIndex((t) => t.src === nextTrack.src));
    return;
  }

  if (currentIndex < currentTracks.length - 1) {
    const nextIndex = currentIndex + 1;
    playTrack(currentTracks[nextIndex], nextIndex);
  }
}

function playPrev() {
  if (currentIndex > 0) {
    const prevIndex = currentIndex - 1;
    playTrack(currentTracks[prevIndex], prevIndex);
  }
}

function addToQueue(track) {
  queue.push(track);
  renderQueue();
}

function removeFromQueue(index) {
  queue.splice(index, 1);
  renderQueue();
}

function moveQueueItem(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  const [item] = queue.splice(fromIndex, 1);
  queue.splice(toIndex, 0, item);
  renderQueue();
}

function renderQueue() {
  const queueList = document.getElementById("queue-list");
  if (!queueList) return;
  queueList.innerHTML = "";

  if (queue.length === 0) {
    const empty = document.createElement("li");
    empty.classList.add("queue-item");
    empty.innerHTML =
      "<div class=\"meta\"><strong>Queue is empty</strong><span>Add tracks from the library.</span></div>";
    queueList.appendChild(empty);
    return;
  }

  queue.forEach((track, idx) => {
    const li = document.createElement("li");
    li.classList.add("queue-item");
    li.setAttribute("draggable", "true");
    li.dataset.index = idx.toString();
    li.innerHTML = `
      <img src="${track.cover}" alt="${track.album} cover">
      <div class="meta">
        <strong>${track.title}</strong>
        <span>${track.artist}</span>
      </div>
      <button class="queue-remove" type="button" aria-label="Remove from queue">x</button>
    `;
    li.querySelector(".queue-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromQueue(idx);
    });
    li.addEventListener("dragstart", (e) => {
      li.classList.add("dragging");
      e.dataTransfer.setData("text/plain", idx.toString());
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });
    li.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      const toIndex = parseInt(li.dataset.index || "0", 10);
      moveQueueItem(fromIndex, toIndex);
    });
    li.onclick = () => {
      playTrack(track, currentTracks.findIndex((t) => t.src === track.src));
    };
    queueList.appendChild(li);
  });
}

function renderTracks(tracks) {
  const trackList = document.getElementById("track-list");
  if (!trackList) return;

  const sortedTracks = currentPlaylist === "recent" ? [...tracks] : sortTracks(tracks);
  currentTracks = sortedTracks;

  trackList.innerHTML = "";
  updateStats(sortedTracks);

  sortedTracks.forEach((track, index) => {
    const li = document.createElement("li");
    li.classList.add("track-row");
    const isFavorite = favorites.has(track.src);

    li.innerHTML = `
      <div class="cell title">
        <img class="cover" src="${track.cover}" alt="${track.album} cover">
        <div class="title-text">
          <strong>${track.title}</strong>
          <span>${track.artist}</span>
        </div>
        <button class="fav-btn ${isFavorite ? "active" : ""}" type="button">${
          isFavorite ? "Fav" : "Fav"
        }</button>
        <button class="queue-add" type="button">Queue</button>
      </div>
      <div class="cell artist">${track.artist}</div>
      <div class="cell album">${track.album}</div>
      <div class="cell time">${track.duration}</div>
    `;

    li.querySelector(".fav-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (favorites.has(track.src)) {
        favorites.delete(track.src);
      } else {
        favorites.add(track.src);
      }
      localStorage.setItem("flow-favorites", JSON.stringify([...favorites]));
      applyFilters();
    });

    li.querySelector(".queue-add").addEventListener("click", (e) => {
      e.stopPropagation();
      addToQueue(track);
    });

    li.dataset.src = track.src;
    li.onclick = () => {
      playTrack(track, index);
    };

    trackList.appendChild(li);
  });

  const audio = document.getElementById("audio");
  if (audio && audio.src) {
    const currentSrc = audio.src;
    document.querySelectorAll(".track-row").forEach((row) => {
      const rowSrc = row.dataset.src || "";
      row.classList.toggle("active", currentSrc.endsWith(rowSrc));
    });
  }
}

function attachSortHandlers() {
  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setSort(btn.dataset.sort);
    });
  });
  updateSortUI();
}

function attachPlaylistHandlers() {
  document.querySelectorAll(".playlist-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPlaylist = btn.dataset.playlist || "all";
      document
        .querySelectorAll(".playlist-btn")
        .forEach((button) => button.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    });
  });
}

function attachQueueHandlers() {
  const clearBtn = document.getElementById("clear-queue");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      queue = [];
      renderQueue();
    });
  }
  const queueList = document.getElementById("queue-list");
  if (queueList) {
    queueList.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
    queueList.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!queueList.hasChildNodes()) return;
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (Number.isNaN(fromIndex)) return;
      moveQueueItem(fromIndex, queue.length - 1);
    });
  }
  renderQueue();
}

function attachKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    const target = e.target;
    const isInput =
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.tagName === "BUTTON");

    if (e.ctrlKey && e.key.toLowerCase() === "f") {
      e.preventDefault();
      document.getElementById("search")?.focus();
      return;
    }

    if (isInput) return;

    if (e.code === "Space") {
      e.preventDefault();
      const audio = document.getElementById("audio");
      const playBtn = document.getElementById("play-btn");
      if (audio) {
        if (audio.paused) {
          audio.play();
          if (playBtn) playBtn.textContent = "Pause";
        } else {
          audio.pause();
          if (playBtn) playBtn.textContent = "Play";
        }
      }
    }

    if (e.key === "ArrowRight") {
      playNext();
    }

    if (e.key === "ArrowLeft") {
      playPrev();
    }
  });
}

const audioEl = document.getElementById("audio");
if (audioEl) {
  audioEl.addEventListener("ended", () => {
    const autoplay =
      window.flowSettings?.autoplayNext !== undefined ? window.flowSettings.autoplayNext : true;
    if (autoplay) playNext();
  });
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function attachPlayerControls() {
  const audio = document.getElementById("audio");
  if (!audio) return;

  const playBtn = document.getElementById("play-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const progress = document.getElementById("progress");
  const currentTime = document.getElementById("current-time");
  const duration = document.getElementById("duration");
  const volume = document.getElementById("volume");

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (audio.paused) {
        audio.play();
        playBtn.textContent = "Pause";
      } else {
        audio.pause();
        playBtn.textContent = "Play";
      }
    });
  }

  if (prevBtn) prevBtn.addEventListener("click", playPrev);
  if (nextBtn) nextBtn.addEventListener("click", playNext);

  if (volume) {
    volume.addEventListener("input", () => {
      audio.volume = parseFloat(volume.value);
    });
  }

  if (progress) {
    progress.addEventListener("input", () => {
      isSeeking = true;
      const pct = parseFloat(progress.value) / 100;
      audio.currentTime = pct * audio.duration;
      if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
    });
    progress.addEventListener("change", () => {
      isSeeking = false;
      if (!audio.paused) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const update = () => {
            if (isSeeking) return;
            if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
            if (progress && audio.duration) {
              progress.value = ((audio.currentTime / audio.duration) * 100).toFixed(2);
            }
            if (!audio.paused) rafId = requestAnimationFrame(update);
          };
          update();
        });
      }
    });
  }

  audio.addEventListener("seeking", () => {
    if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener("seeked", () => {
    if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    if (duration) duration.textContent = formatTime(audio.duration);
  });

  const updateProgress = () => {
    if (isSeeking) return;
    if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
    if (progress && audio.duration) {
      progress.value = ((audio.currentTime / audio.duration) * 100).toFixed(2);
    }
    if (!audio.paused) {
      rafId = requestAnimationFrame(updateProgress);
    }
  };

  audio.addEventListener("play", () => {
    if (playBtn) playBtn.textContent = "Pause";
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(updateProgress);
  });
  audio.addEventListener("pause", () => {
    if (playBtn) playBtn.textContent = "Play";
    if (rafId) cancelAnimationFrame(rafId);
  });
}

attachSortHandlers();
attachPlaylistHandlers();
attachQueueHandlers();
attachKeyboardShortcuts();
attachPlayerControls();

window.addEventListener("resize", () => {
  const nowTitle = document.getElementById("nowplaying-title");
  if (nowTitle) updateMarquee(nowTitle);
});

window.addEventListener("load", () => {
  scheduleMarqueeUpdate();
});
