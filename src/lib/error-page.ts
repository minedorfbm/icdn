import { UI, type Lang } from "../i18n/dictionary";

export function renderErrorPage(lang: Lang = "en"): string {
  const copy = UI[lang];
  const translations = Object.fromEntries(
    Object.entries(UI).map(([locale, labels]) => [
      locale,
      {
        title: labels.error_page_title,
        body: labels.error_page_body,
        retry: labels.retry,
        home: labels.go_home,
      },
    ]),
  );
  const serialized = JSON.stringify(translations).replaceAll("<", String.raw`\u003c`);
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <title>${copy.error_page_title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 id="error-title">${copy.error_page_title}</h1>
      <p id="error-body">${copy.error_page_body}</p>
      <div class="actions">
        <button id="error-retry" class="primary">${copy.retry}</button>
        <a id="error-home" class="secondary" href="/">${copy.go_home}</a>
      </div>
    </div>
    <script>
      (() => {
        document.getElementById("error-retry").addEventListener("click", () => location.reload());
        const translations = ${serialized};
        let saved;
        try { saved = localStorage.getItem("adj-lang"); } catch {}
        const browser = navigator.language.split(/[-_]/)[0].toLowerCase();
        const locale = Object.hasOwn(translations, saved) ? saved : Object.hasOwn(translations, browser) ? browser : document.documentElement.lang;
        const copy = translations[locale];
        document.documentElement.lang = locale;
        document.title = copy.title;
        for (const key of ["title", "body", "retry", "home"]) {
          document.getElementById("error-" + key).textContent = copy[key];
        }
      })();
    </script>
  </body>
</html>`;
}
