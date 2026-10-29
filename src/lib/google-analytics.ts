export const GOOGLE_ANALYTICS_ID = "G-8R7L6LCJVX";

/** Queue the supplied Google commands without fetching any third-party code.
 * The hub releases the download only after its content and photos are ready. */
export function googleAnalyticsBootstrap(): string {
  return `(function(w){
if(w.location.hostname!=="icdn.artdigitaljourney.com"||/^\\/admin(?:\\/|$)/.test(w.location.pathname)||w.__adjGoogleTag)return;
w.__adjGoogleTag=true;
w.dataLayer=w.dataLayer||[];
w.gtag=w.gtag||function(){w.dataLayer.push(arguments);};
w.gtag('js',new Date());
w.gtag('config','${GOOGLE_ANALYTICS_ID}');
})(window);`;
}
