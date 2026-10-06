import { useRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

export function FullscreenDialog({
  title,
  onClose,
  className,
  overlayClassName = "fixed inset-0 z-[79] bg-black/30",
  portalled = true,
  children,
  ...props
}: Readonly<{
  title: string;
  onClose: () => void;
  className: string;
  overlayClassName?: string;
  portalled?: boolean;
  children: ReactNode;
  "data-level"?: string;
}>) {
  const returnFocus = useRef(typeof document !== "undefined" ? document.activeElement : null);
  const content = (
    <>
      <Dialog.Overlay className={overlayClassName} />
      <Dialog.Content
        {...props}
        aria-label={title}
        aria-labelledby={undefined}
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
    </>
  );
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {portalled ? <Dialog.Portal>{content}</Dialog.Portal> : content}
    </Dialog.Root>
  );
}
