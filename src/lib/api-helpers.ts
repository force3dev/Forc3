export function dbErrorResponse(error: unknown): Response {
  const err = error as { code?: string; message?: string };
  console.error("Database error:", err?.message ?? String(error));
  if (err?.code === "P1001")
    return Response.json({ error: "Database temporarily unavailable. Please try again." }, { status: 503 });
  if (err?.code === "P2024")
    return Response.json({ error: "Server busy. Please try again in a moment." }, { status: 503 });
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
