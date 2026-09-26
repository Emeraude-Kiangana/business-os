export function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/health") {
    return Response.json(
      {
        ok: true,
        service: "business-os-gateway",
        version: "0.1.0"
      },
      { status: 200 }
    );
  }

  return Response.json(
    {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Route not found"
      }
    },
    { status: 404 }
  );
}

export default {
  fetch(request) {
    return handleRequest(request);
  }
};
