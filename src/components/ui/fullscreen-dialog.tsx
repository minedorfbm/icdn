import { useRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

export function FullscreenDialog({
  title,
  onClose,
  className,
  children,
  ...props
}: Readonly<{
  title: string;
  onClose: () => void;
  className: string;
  children: ReactNode;
  "data-level"?: string;
}>) {
  const returnFocus = useRef(typeof document !== "undefined" ? document.activeElement : null);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[79] bg-black/30" />
        <Dialog.Content
          {...props}
          aria-describedby={undefined}
          className={className}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = returnFocus.current;
            if (target instanceof HTMLElement && target.isConnected)
              target.focus({ preventScroll: true });
          }}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
