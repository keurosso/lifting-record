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

    // POST /api/records
    if (request.method === "POST" && url.pathname === "/api/records") {
      try {
        const body = await request.json();

        const recordDate = body.record_date;
        const count = body.count;

        if (!recordDate || !Number.isInteger(count) || count < 0) {
          return Response.json(
            {
              success: false,
              error: "record_date and count are required"
            },
            { status: 400 }
          );
        }

        const result = await env.DB
          .prepare(`
            INSERT INTO records (record_date, count)
            VALUES (?, ?)
          `)
          .bind(recordDate, count)
          .run();

        return Response.json({
          success: true,
          id: result.meta.last_row_id,
          record_date: recordDate,
          count: count
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

    // DELETE /api/records (全件削除)
    if (request.method === "DELETE" && url.pathname === "/api/records") {
      try {
        await env.DB
          .prepare(`DELETE FROM records`)
          .run();

        return Response.json({
          success: true
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

    // DELETE /api/records/:id (1件削除)
    if (request.method === "DELETE" && url.pathname.startsWith("/api/records/")) {
      try {
        const idStr = url.pathname.replace("/api/records/", "");
        const id = Number(idStr);

        // idが整数でない場合は 400 エラー
        if (!Number.isInteger(id) || idStr.trim() === "") {
          return Response.json(
            {
              success: false,
              error: "invalid id"
            },
            { status: 400 }
          );
        }

        const result = await env.DB
          .prepare(`
            DELETE FROM records WHERE id = ?
          `)
          .bind(id)
          .run();

        // 削除対象のレコードが存在しなかった場合（変更件数が 0）は 404 エラー
        if (result.meta.changes === 0) {
          return Response.json(
            {
              success: false,
              error: "record not found"
            },
            { status: 404 }
          );
        }

        return Response.json({
          success: true
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