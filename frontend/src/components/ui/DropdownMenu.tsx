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
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const updatePosition = useCallback(() => {
    const triggerEl = containerRef.current;
    if (!triggerEl) {
      return;
    }

    const rect = triggerEl.getBoundingClientRect();
    const width = Math.max(menuRef.current?.offsetWidth ?? 192, 192);
    const left =
      align === "end"
        ? Math.min(rect.right - width, window.innerWidth - width - 8)
        : Math.max(8, rect.left);

    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: Math.max(8, left),
      zIndex: 1000,
    });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updatePosition();
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
      <div ref={containerRef} className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={label}
          data-testid={triggerTestId}
          onClick={() => setOpen((value) => !value)}
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
                style={menuStyle}
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
