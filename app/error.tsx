"use client";
import React from "react";

export default function Error() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <h1>Coś poszło nie tak</h1>
      <p>Wystąpił nieoczekiwany błąd. Spróbuj ponownie.</p>
    </div>
  );
}