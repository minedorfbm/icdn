import { ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import { useHub } from "@/data/hub-context";
import { useI18n } from "@/i18n";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** Messaging accounts are configured separately from the resort's telephone line. */
function messagingUrl(value: string | undefined, hosts: readonly string[]) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      hosts.includes(url.hostname)
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

export function ConciergeContact() {
  const { contact, whatsapp, zalo } = useHub();
  const { t, linkLabel } = useI18n();
  const phone = /^tel:\+?[0-9 ()-]+$/.test(contact) ? contact : undefined;
  const options = [
    { label: t("contact_call"), url: phone, Icon: Phone },
    {
      label: "WhatsApp",
      url: messagingUrl(whatsapp, ["wa.me", "api.whatsapp.com"]),
      Icon: MessageCircle,
    },
    { label: "Zalo", url: messagingUrl(zalo, ["zalo.me"]), Icon: MessageCircle },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={linkLabel("Contact")}
          className="brand-floating fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95"
        >
          <Phone size={14} strokeWidth={1.3} aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        closeLabel={t("close")}
        aria-describedby={undefined}
        className="brand-ui mx-auto max-w-lg rounded-t-[28px] border-current/10 bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-[#30302d] [&>button]:flex [&>button]:size-11 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full"
      >
        <SheetHeader className="mb-6 text-left">
          <SheetTitle className="pr-12 font-serif text-2xl font-normal">
            {linkLabel("Contact")}
          </SheetTitle>
          {phone && <p className="text-sm text-black/55">{phone.slice(4)}</p>}
        </SheetHeader>
        <div className="flex flex-col gap-3">
          {options.map(({ label, url, Icon }) => {
            const content = (
              <>
                <Icon className="size-5 shrink-0" strokeWidth={1.3} aria-hidden />
                <span className="flex-1">{label}</span>
                {url ? (
                  <ArrowUpRight className="size-4" strokeWidth={1.3} aria-hidden />
                ) : (
                  <span className="text-xs">{t("contact_unavailable")}</span>
                )}
              </>
            );
            const className =
              "flex min-h-14 items-center gap-4 rounded-full border border-current/15 px-5 text-sm";
            return url ? (
              <a
                key={label}
                href={url}
                className={className}
                target={url.startsWith("tel:") ? undefined : "_blank"}
                rel={url.startsWith("tel:") ? undefined : "noopener noreferrer"}
              >
                {content}
              </a>
            ) : (
              <div key={label} aria-disabled="true" className={`${className} opacity-45`}>
                {content}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
