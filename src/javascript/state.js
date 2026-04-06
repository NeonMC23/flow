(function () {
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const allowed = ["index.html", "upload.html", "settings.html"];
  if (!allowed.includes(page)) return;

  const lastPage = (localStorage.getItem("flow-last-page") || "").toLowerCase();
  const alreadyRedirected = sessionStorage.getItem("flow-page-redirected");
  if (lastPage && lastPage !== page && allowed.includes(lastPage) && !alreadyRedirected) {
    sessionStorage.setItem("flow-page-redirected", "1");
    location.href = lastPage;
    return;
  }

  localStorage.setItem("flow-last-page", page);

  const scrollKey = `flow-scroll-${page}`;
  const savedScroll = parseInt(localStorage.getItem(scrollKey) || "0", 10);
  if (savedScroll > 0) {
    window.scrollTo(0, savedScroll);
  }

  window.addEventListener("beforeunload", () => {
    localStorage.setItem("flow-last-page", page);
    localStorage.setItem(scrollKey, String(window.scrollY || 0));
  });
})();
