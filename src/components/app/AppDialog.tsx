import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";

type AppDialogVariant = "center" | "left" | "right";

const dialogPosition: Record<AppDialogVariant, string> = {
  center:
    "left-1/2 top-1/2 max-h-[90vh] -translate-x-1/2 -translate-y-1/2 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
  left: "inset-y-0 left-0 h-dvh data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  right:
    "inset-y-0 right-0 h-dvh data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
};

const AppDialogOpenContext = React.createContext<((open: boolean) => void) | undefined>(undefined);

export function AppDialog({
  onOpenChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
  return (
    <AppDialogOpenContext.Provider value={onOpenChange}>
      <DialogPrimitive.Root onOpenChange={onOpenChange} {...props} />
    </AppDialogOpenContext.Provider>
  );
}

export function AppDialogContent({
  id,
  title,
  description,
  variant = "center",
  contentClassName,
  overlayClassName,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  variant?: AppDialogVariant;
  contentClassName?: string;
  overlayClassName?: string;
  children: React.ReactNode;
}) {
  const descriptionId = React.useId();
  const onOpenChange = React.useContext(AppDialogOpenContext);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-app-dialog-overlay=""
        onClick={(event) => {
          if (event.target === event.currentTarget) onOpenChange?.(false);
        }}
        className={cn(
          "fixed inset-0 z-50 bg-[rgba(23,20,30,0.55)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          overlayClassName,
        )}
      />
      <DialogPrimitive.Content
        id={id}
        data-app-dialog-content={variant}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "aspen-scope fixed z-50 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          dialogPosition[variant],
          contentClassName,
        )}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description id={descriptionId} className="sr-only">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const AppDialogTrigger = DialogPrimitive.Trigger;
export const AppDialogClose = DialogPrimitive.Close;

export function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
}: {
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  confirmDisabled?: boolean;
}) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <AlertDialogPrimitive.Trigger asChild>{trigger}</AlertDialogPrimitive.Trigger>
      ) : null}
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          data-confirm-dialog-overlay=""
          className="fixed inset-0 z-50 bg-[rgba(23,20,30,0.55)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        />
        <AlertDialogPrimitive.Content
          data-confirm-dialog-content=""
          className="aspen-scope fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border-[1.5px] border-border bg-surface p-[24px] text-dark shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
        >
          <AlertDialogPrimitive.Title className="font-heading text-[19px] font-bold">
            {title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-[8px] text-[13.5px] leading-[1.55] text-muted">
            {description}
          </AlertDialogPrimitive.Description>
          <div className="mt-[22px] flex flex-col-reverse gap-[8px] sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel className="h-[40px] rounded-[11px] border-[1.5px] border-border bg-transparent px-[16px] text-[13px] font-bold text-muted cursor-pointer">
              Cancel
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              disabled={confirmDisabled}
              onClick={() => void onConfirm()}
              className="h-[40px] rounded-[11px] border-0 bg-danger-ink px-[16px] text-[13px] font-bold text-surface cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirmLabel}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
