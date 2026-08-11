"use client"

import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence, Transition } from "motion/react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface NavigationContextType {
  activeTab: string | null;
  setActiveTab: (tab: string | null) => void;
  direction: number;
  registerTab: (id: string, element: HTMLElement | null) => void;
  tabElements: Map<string, HTMLElement>;
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
  roundedStyle: string;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("Navigation components must be used within a MotionNavigationMenu");
  }
  return context;
};

export interface MotionNavigationMenuProps {
  children: React.ReactNode;
  className?: string;
  topGap?: number; // Gap from top in pixels (default 30px)
  roundedStyle?: "none" | "sm" | "md" | "lg" | "full";
  transition?: Transition;
}

export function MotionNavigationMenu({
  children,
  className,
  topGap = 30,
  roundedStyle = "none",
  transition = { type: "spring", stiffness: 380, damping: 30 },
}: MotionNavigationMenuProps) {
  const [activeTab, setActiveTabState] = useState<string | null>(null);
  const [prevTab, setPrevTab] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tabOrder, setTabOrder] = useState<string[]>([]);
  const tabElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  const registerTab = (id: string, element: HTMLElement | null) => {
    if (element) {
      tabElementsRef.current.set(id, element);
      setTabOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      tabElementsRef.current.delete(id);
    }
  };

  const direction = (() => {
    if (!prevTab || !activeTab) return 0;
    const prevIndex = tabOrder.indexOf(prevTab);
    const currentIndex = tabOrder.indexOf(activeTab);
    if (prevIndex === -1 || currentIndex === -1) return 0;
    return currentIndex > prevIndex ? 1 : -1;
  })();

  const setActiveTab = (tab: string | null) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (tab !== activeTab) {
      setPrevTab(activeTab);
      setActiveTabState(tab);
    }
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveTabState(null);
      setIsHovered(false);
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        direction,
        registerTab,
        tabElements: tabElementsRef.current,
        isHovered,
        setIsHovered,
        roundedStyle: roundedClasses[roundedStyle],
      }}
    >
      <div
        className={cn(
          "relative z-50 w-full transition-all duration-300",
          className
        )}
        style={{ marginTop: `${topGap}px` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </NavigationContext.Provider>
  );
}

export interface NavigationBarProps {
  children: React.ReactNode;
  className?: string;
}

export function NavigationBar({ children, className }: NavigationBarProps) {
  const { roundedStyle } = useNavigationContext();

  return (
    <div
      className={cn(
        "relative flex items-center justify-between border border-zinc-200 bg-white text-zinc-900 px-6 py-3.5 shadow-md transition-all duration-200 rounded-none",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface NavigationMenuListProps {
  children: React.ReactNode;
  className?: string;
}

export function NavigationMenuList({ children, className }: NavigationMenuListProps) {
  return (
    <ul className={cn("relative flex items-center gap-1 list-none m-0 p-0", className)}>
      {children}
    </ul>
  );
}

export interface NavigationMenuItemProps {
  id: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
  hasDropdown?: boolean;
  onClick?: () => void;
  badge?: string;
}

export function NavigationMenuItem({
  id,
  title,
  children,
  className,
  hasDropdown = true,
  onClick,
  badge,
}: NavigationMenuItemProps) {
  const { activeTab, setActiveTab, registerTab } = useNavigationContext();
  const itemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    registerTab(id, itemRef.current);
    return () => registerTab(id, null);
  }, [id, registerTab]);

  const isActive = activeTab === id;

  const handleMouseEnter = () => {
    if (hasDropdown) {
      setActiveTab(id);
    }
  };

  const handleClick = () => {
    if (onClick) onClick();
    if (hasDropdown) {
      setActiveTab(isActive ? null : id);
    }
  };

  return (
    <li
      ref={itemRef}
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "relative flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold tracking-tight transition-all focus:outline-none cursor-pointer select-none",
          isActive
            ? "text-zinc-950 font-black"
            : "text-zinc-600 hover:text-zinc-900 opacity-70 hover:opacity-100"
        )}
      >
        {isActive && (
          <motion.div
            layoutId="active-nav-pill"
            className="absolute inset-0 border-b-2 border-amber-500 bg-zinc-100 -z-10"
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
          />
        )}
        <span>{title}</span>
        {badge && (
          <span className="ml-1 font-mono text-[9px] font-extrabold uppercase tracking-widest bg-zinc-900 text-white px-1.5 py-0.5">
            {badge}
          </span>
        )}
        {hasDropdown && (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200 opacity-60",
              isActive && "rotate-180 opacity-100"
            )}
          />
        )}
      </button>

      {/* Dropdown Content Registration handled via NavigationMenuViewport */}
    </li>
  );
}

export interface DropdownContentItem {
  id: string;
  content: React.ReactNode;
}

export interface NavigationMenuViewportProps {
  items: DropdownContentItem[];
  className?: string;
}

export function NavigationMenuViewport({ items, className }: NavigationMenuViewportProps) {
  const { activeTab, direction, tabElements, roundedStyle } = useNavigationContext();
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
  const activeContentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeItem = items.find((item) => item.id === activeTab);

  // Measure active content height
  useEffect(() => {
    if (activeContentRef.current) {
      setContentHeight(activeContentRef.current.offsetHeight);

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContentHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(activeContentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [activeTab]);

  const activeTabElement = activeTab ? tabElements.get(activeTab) : null;
  const parentContainer = containerRef.current?.parentElement;

  let pointerLeft = 0;
  if (activeTabElement && parentContainer) {
    const activeRect = activeTabElement.getBoundingClientRect();
    const parentRect = parentContainer.getBoundingClientRect();
    pointerLeft = activeRect.left + activeRect.width / 2 - parentRect.left;
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <AnimatePresence>
        {activeTab && activeItem && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.98 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="absolute top-2 left-0 w-full z-50 pointer-events-auto"
          >
            {/* Single Full-Width Submenu Container Box */}
            <motion.div
              animate={{
                height: contentHeight ? `${contentHeight}px` : "auto",
              }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className={cn(
                "relative w-full overflow-hidden border border-zinc-200 bg-white text-zinc-900 p-0 shadow-xl rounded-none",
                className
              )}
            >
              {/* Arrow Pointer */}
              {pointerLeft > 0 && (
                <motion.div
                  className="absolute -top-1.5 h-3 w-3 rotate-45 border-t border-l border-zinc-200 bg-white z-10"
                  animate={{
                    left: `${Math.max(24, Math.min(pointerLeft - 6, (parentContainer?.clientWidth || 800) - 24))}px`,
                  }}
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}

              {/* Direction-aware Animated Content */}
              <div ref={activeContentRef} className="w-full">
                <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                  <motion.div
                    key={activeTab}
                    custom={direction}
                    variants={{
                      initial: (dir: number) => ({
                        x: dir === 0 ? 0 : dir > 0 ? 40 : -40,
                        opacity: 0,
                        filter: "blur(4px)",
                      }),
                      animate: {
                        x: 0,
                        opacity: 1,
                        filter: "blur(0px)",
                      },
                      exit: (dir: number) => ({
                        x: dir === 0 ? 0 : dir > 0 ? -40 : 40,
                        opacity: 0,
                        filter: "blur(4px)",
                      }),
                    }}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                      mass: 0.8,
                    }}
                    className="w-full"
                  >
                    {activeItem.content}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
