import React from "react"

// Helper component to display Material Icons
export default function MaterialIcon({ name, size = "24px", filled = false, className = "" }) {
  const iconClass = filled ? "material-icons" : "material-icons-outlined"
  return (
    <span
      className={`${iconClass} ${className}`}
      style={{ fontSize: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    >
      {name}
    </span>
  )
}
