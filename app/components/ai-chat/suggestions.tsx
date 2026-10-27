"use client";

import type { ReactNode } from "react";

type SuggestionProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

export function Suggestions({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`novatek-suggestions ${className}`.trim()}>{children}</div>;
}

export function SuggestionList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`novatek-suggestion-list ${className}`.trim()}>{children}</div>;
}

export function Suggestion({ children, onClick, disabled = false, className = "" }: SuggestionProps) {
  return (
    <button type="button" className={`novatek-suggestion ${className}`.trim()} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function SuggestionPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`novatek-suggestion-panel ${className}`.trim()} aria-label="اقتراحات للمحادثة">{children}</section>;
}
