export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET /api/records
    if (request.method === "GET" && url.pathname === "/api/records") {
      try {
        const { results } = await env.DB
          .prepare(`
            SELECT id, record_date, count, created_at
            FROM records
            ORDER BY record_date DESC, id DESC
          `)
          .all();

        return Response.json({
          success: true,
          records: results
        });
      } catch (error) {
        return Response.json(
          {
            success: false,
            error: error.message
          },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};