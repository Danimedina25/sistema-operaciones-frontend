import { createContext, useContext, useId, useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from 'react';

/** Los portales conservan este contexto aunque su DOM sea hermano del panel padre. */
export const OverlayParentContext = createContext<string | null>(null);
interface Entry {
  id: string;
  parent: string | null;
  root: RefObject<HTMLElement | null>;
  close: () => void;
  modal: boolean;
  previousFocus: HTMLElement | null;
  autoFocus: boolean;
}
const stack: Entry[] = [];
const listeners = new Set<() => void>();
let revision = 0;
let savedOverflow: string | null = null;
const priorInert = new Map<HTMLElement, boolean>();
const top = () => stack[stack.length - 1];
function modalScope() {
  const modal = [...stack].reverse().find(entry => entry.modal);
  return modal ? { modal, entries: stack.slice(stack.indexOf(modal)) } : null;
}
const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function focusable(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(node =>
    node.tabIndex >= 0 && !node.closest('[hidden], [inert]') && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden');
}
function focusEntry(entry: Entry) {
  const root = entry.root.current;
  if (!root || root.contains(document.activeElement)) return;
  (focusable(root)[0] ?? root).focus({ preventScroll: true });
}
function sync() {
  for (const [node, inert] of priorInert) node.inert = inert;
  priorInert.clear();
  const scope = modalScope();
  if (scope) {
    for (const entry of stack) {
      const node = entry.root.current;
      if (node && !scope.entries.includes(entry) && !scope.entries.some(item => node.contains(item.root.current))) {
        priorInert.set(node, node.inert);
        node.inert = true;
      }
    }
  }
  if (stack.some(entry => entry.modal)) {
    if (savedOverflow === null) savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  } else if (savedOverflow !== null) {
    document.body.style.overflow = savedOverflow;
    savedOverflow = null;
  }
  revision++;
  listeners.forEach(listener => listener());
}
function onKeyDown(event: KeyboardEvent) {
  const entry = top();
  if (!entry || event.defaultPrevented) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopImmediatePropagation();
    entry.close();
    return;
  }
  const scope = modalScope();
  if (event.key !== 'Tab' || !scope) return;
  const roots = scope.entries.map(item => item.root.current).filter((node): node is HTMLElement => !!node);
  const fields = [...new Set(roots.flatMap(root => focusable(root)))];
  const first = fields[0], last = fields[fields.length - 1];
  if (!first) { event.preventDefault(); scope.modal.root.current?.focus(); return; }
  if (!roots.some(root => root.contains(document.activeElement)) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}

function onFocusIn(event: FocusEvent) {
  const scope = modalScope();
  if (scope && event.target instanceof HTMLElement && !scope.entries.some(entry => entry.root.current?.contains(event.target as Node))) {
    const mounting = event.target.closest('[data-overlay-root]');
    if (mounting && !stack.some(item => item.root.current === mounting)) return;
    focusEntry(scope.modal);
  }
}

function descendantOf(entry: Entry, id: string): boolean {
  let parent = entry.parent;
  const seen = new Set<string>();
  while (parent && !seen.has(parent)) {
    if (parent === id) return true;
    seen.add(parent);
    parent = stack.find(item => item.id === parent)?.parent ?? null;
  }
  return false;
}
function register(entry: Entry) {
  if (!stack.length) {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn, true);
  }
  // Un padre que se monta junto con un hijo debe quedar debajo de él.
  const child = stack.findIndex(item => descendantOf(item, entry.id));
  stack.splice(child === -1 ? stack.length : child, 0, entry);
  sync();
  if (top() === entry && entry.autoFocus) focusEntry(entry);
  return () => {
    const wasTop = top() === entry;
    const index = stack.indexOf(entry);
    if (index !== -1) stack.splice(index, 1);
    sync();
    if (!stack.length) {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn, true);
    }
    if (wasTop) {
      const previous = entry.previousFocus;
      const active = top();
      if (previous?.isConnected && !previous.closest('[inert]') && (!active?.modal || active.root.current?.contains(previous))) previous.focus({ preventScroll: true });
      else if (active?.modal) focusEntry(active);
    }
  };
}

/** Orden, Escape, foco y scroll compartidos por todas las ventanas del sistema. */
export function useOverlay(open: boolean, root: RefObject<HTMLElement | null>, onClose: () => void, options: { modal?: boolean; autoFocus?: boolean } = {}) {
  const id = useId();
  const parent = useContext(OverlayParentContext);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const opener = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current) opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  wasOpen.current = open;
  const modal = options.modal ?? true;
  const autoFocus = options.autoFocus ?? modal;
  useLayoutEffect(() => {
    if (!open) return;
    return register({ id, parent, root, close: () => closeRef.current(), modal, autoFocus, previousFocus: opener.current });
  }, [open, id, parent, root, modal, autoFocus]);
  useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => revision, () => 0);
  const index = stack.findIndex(entry => entry.id === id);
  return { overlayId: id, zIndex: 1000 + Math.max(0, index) * 10 };
}
