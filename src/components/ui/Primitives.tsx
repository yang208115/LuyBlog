import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const variantClass: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] border border-transparent shadow-xs",
    secondary:
      "bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--surface-subtle)]",
    ghost: "bg-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)]",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 border border-transparent dark:bg-rose-500 dark:hover:bg-rose-600",
  };
  const sizeClass: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
    md: "h-9 px-4 text-sm rounded-xl gap-2",
  };

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${sizeClass[size]} ${variantClass[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: "neutral" | "accent" | "sakura" | "success" | "warning" | "danger";
  className?: string;
  children: ReactNode;
}) {
  const toneClass: Record<string, string> = {
    neutral: "bg-[var(--surface-subtle)] text-[var(--muted)] border-[var(--border)]",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)] border-transparent",
    sakura: "bg-[var(--sakura-soft)] text-[var(--sakura)] border-transparent",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-transparent",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`astral-card rounded-xl ${className}`}>{children}</div>;
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] ${className}`}
    />
  );
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] ${className}`}
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className={`astral-card w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭弹窗"
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "确认删除",
  loading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-md">
      <p className="text-sm leading-relaxed text-[var(--muted)]">{description}</p>
      <div className="mt-6 flex items-center justify-end gap-2.5">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          取消
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? "处理中…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        上一页
      </Button>
      <span className="px-3 font-mono text-xs text-[var(--muted)]">
        {page} / {totalPages}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        下一页
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="astral-card flex flex-col items-center justify-center rounded-xl px-6 py-14 text-center">
      <p className="text-base font-semibold text-[var(--ink)]">{title}</p>
      {description && <p className="mt-1.5 max-w-md text-sm text-[var(--muted)]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
