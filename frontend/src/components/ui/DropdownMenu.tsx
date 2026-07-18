import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface DropdownMenuContextValue {
  close: () => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  label: string;
  triggerTestId?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  label,
  triggerTestId,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    setMenuStyle(null);
  }, []);

  const updatePosition = useCallback(() => {
    const triggerEl = containerRef.current;
    if (!triggerEl) {
      return;
    }

    const rect = triggerEl.getBoundingClientRect();
    // Ignore zero-size triggers (not laid out yet / detached) so we don't pin to (8,0).
    if (rect.width === 0 && rect.height === 0) {
      return;
    }

    const menuWidth = Math.max(menuRef.current?.offsetWidth ?? 0, 192);
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    const gap = 8;
    const viewportPadding = 8;

    let top = rect.bottom + gap;
    if (menuHeight > 0 && top + menuHeight > window.innerHeight - viewportPadding) {
      const above = rect.top - gap - menuHeight;
      if (above >= viewportPadding) {
        top = above;
      }
    }

    const nextStyle: CSSProperties = {
      position: "fixed",
      top,
      zIndex: 1000,
      minWidth: "12rem",
    };

    if (align === "end") {
      // Anchor to the trigger's right edge — avoids left:8 when width math goes wrong.
      const right = Math.max(viewportPadding, window.innerWidth - rect.right);
      const overflowsLeft = rect.right - menuWidth < viewportPadding;
      if (overflowsLeft) {
        nextStyle.left = viewportPadding;
        nextStyle.right = "auto";
      } else {
        nextStyle.right = right;
        nextStyle.left = "auto";
      }
    } else {
      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        window.innerWidth - menuWidth - viewportPadding,
      );
      nextStyle.left = left;
      nextStyle.right = "auto";
    }

    setMenuStyle(nextStyle);
  }, [align]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updatePosition();
    // Remeasure after the menu paints at full width (first pass may use the 192 fallback).
    const frame = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(frame);
  }, [open, updatePosition, children]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    const onReposition = () => updatePosition();

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, close, updatePosition]);

  return (
    <DropdownMenuContext.Provider value={{ close }}>
      <div ref={containerRef} className="relative inline-flex">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={label}
          data-testid={triggerTestId}
          onClick={() =>
            setOpen((value) => {
              if (value) {
                setMenuStyle(null);
              }
              return !value;
            })
          }
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
        >
          {trigger}
        </button>

        {open
          ? createPortal(
              <div
                ref={menuRef}
                id={menuId}
                role="menu"
                style={menuStyle ?? { position: "fixed", top: 0, left: 0, visibility: "hidden" }}
                className="min-w-[12rem] overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-stone-900"
              >
                {children}
              </div>,
              document.body,
            )
          : null}
      </div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onSelect?: () => void;
  className?: string;
  testId?: string;
}

export function DropdownMenuItem({
  children,
  onSelect,
  className = "",
  testId,
}: DropdownMenuItemProps) {
  const menu = useContext(DropdownMenuContext);

  return (
    <button
      type="button"
      role="menuitem"
      data-testid={testId}
      onClick={() => {
        onSelect?.();
        menu?.close();
      }}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800 ${className}`}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div role="separator" className="my-1 border-t border-stone-200 dark:border-stone-700" />;
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
      {children}
    </div>
  );
}
