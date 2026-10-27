"use client";

import type { ReactNode } from "react";

export type MessageRole = "user" | "assistant";

export function MessageThread({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`novatek-message-thread ${className}`.trim()} aria-live="polite" aria-relevant="additions text">{children}</div>;
}

export function Message({ children, role, className = "" }: { children: ReactNode; role: MessageRole; className?: string }) {
  return <article className={`novatek-message novatek-message-${role} ${className}`.trim()} data-role={role}>{children}</article>;
}

export function MessageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`novatek-message-body ${className}`.trim()}>{children}</div>;
}

export function MessageAvatar({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <span className={`novatek-message-avatar ${className}`.trim()} aria-hidden="true">{children ?? "N"}</span>;
}

export function MessageContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`novatek-message-content ${className}`.trim()} dir="auto">{children}</div>;
}

export function MessageActions({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`novatek-message-actions ${className}`.trim()}>{children}</div>;
}

export function MessageAction({ children, onClick, disabled = false, label, className = "" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; label: string; className?: string }) {
  return <button type="button" className={`novatek-message-action ${className}`.trim()} onClick={onClick} disabled={disabled} aria-label={label} title={label}>{children}</button>;
}

export function MessageTimestamp({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <time className={`novatek-message-timestamp ${className}`.trim()}>{children}</time>;
}

export function MessageTyping({ label = "عم حضّر الرد", className = "" }: { label?: string; className?: string }) {
  return <div className={`novatek-message-typing ${className}`.trim()} role="status"><span className="novatek-typing-dots"><i /><i /><i /></span><span>{label}</span></div>;
}

export function MessageStreamingCursor() {
  return <span className="novatek-streaming-cursor" aria-hidden="true" />;
}
