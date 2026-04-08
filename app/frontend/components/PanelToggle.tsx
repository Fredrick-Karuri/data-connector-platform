"use client";
import { nav } from "@/styles/components";

interface Props {
  open: boolean;
  onToggle: () => void;
}

export function PanelToggle({ open, onToggle }: Props) {
  return (
    <button className={nav.hamburger} onClick={onToggle} aria-label="Toggle panel">
      <span className={open ? nav.hamburgerLineTop : nav.hamburgerLine} />
      <span className={open ? nav.hamburgerLineMid : nav.hamburgerLine} />
      <span className={open ? nav.hamburgerLineBot : nav.hamburgerLine} />
    </button>
  );
}