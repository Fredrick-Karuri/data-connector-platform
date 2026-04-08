"use client";
import { nav } from "@/styles/components";
import { Menu, X } from "lucide-react";


interface Props {
  open: boolean;
  onToggle: () => void;
}

export function PanelToggle({ open, onToggle }: Props) {
  return (
    <button className={nav.hamburger} onClick={onToggle} aria-label="Toggle panel">
      {open ? <X size={14} /> : <Menu size={14} />}
    </button>
  );
}