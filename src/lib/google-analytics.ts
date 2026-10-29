export const GOOGLE_ANALYTICS_ID = "G-8R7L6LCJVX";

/** The root head supplies the response nonce. Keep third-party work behind the
 * page load/idle boundary, and keep previews and administration out of reports. */
export function googleAnalyticsBootstrap(): string {
  return `(function(w,d){
if(w.location.hostname!=="icdn.artdigitaljourney.com"||/^\\/admin(?:\\/|$)/.test(w.location.pathname)||w.__adjGoogleTag)return;
w.__adjGoogleTag=true;
w.dataLayer=w.dataLayer||[];
w.gtag=w.gtag||function(){w.dataLayer.push(arguments);};
w.gtag('js',new Date());
w.gtag('config','${GOOGLE_ANALYTICS_ID}');
function load(){var s=d.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}';d.head.appendChild(s);}
function defer(){if(w.requestIdleCallback)w.requestIdleCallback(load,{timeout:2000});else w.setTimeout(load,0);}
if(d.readyState==='complete')defer();else w.addEventListener('load',defer,{once:true});
})(window,document);`;
}
