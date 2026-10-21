
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SAVEAPI_KEY = process.env.SAVEAPI_KEY;

app.use(cors());
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

function isInstagramUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    return (
      ["http:", "https:"].includes(url.protocol) &&
      (
        host === "instagram.com" ||
        host.endsWith(".instagram.com") ||
        host === "instagr.am" ||
        host.endsWith(".instagr.am")
      )
    );
  } catch {
    return false;
  }
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "Neko Downloader",
    apiConfigured: Boolean(SAVEAPI_KEY)
  });
});

app.post("/api/download", async (req, res) => {
  try {
    if (!SAVEAPI_KEY) {
      return res.status(503).json({
        success: false,
        error: "API não configurada no servidor."
      });
    }

    const { url } = req.body || {};

    if (!url || typeof url !== "string" || !isInstagramUrl(url)) {
      return res.status(400).json({
        success: false,
        error: "Informe um link válido do Instagram."
      });
    }

    const endpoint = new URL(
      "https://api.saveapi.org/v1/download"
    );
    endpoint.searchParams.set("url", url);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SAVEAPI_KEY}`,
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(30000)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success !== true) {
      const status = response.status === 429 ? 429 : 502;

      return res.status(status).json({
        success: false,
        error:
          data.error?.message ||
          data.message ||
          "Não foi possível obter o vídeo. Tente novamente.",
        code: data.error?.code || null
      });
    }

    const videos = Array.isArray(data.medias)
      ? data.medias.filter(
          media =>
            media.type === "video" &&
            typeof media.url === "string" &&
            /^https:\/\//i.test(media.url)
        )
      : [];

    if (videos.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Nenhum vídeo disponível nesse link público."
      });
    }

    // Prefere a maior resolução informada pela API.
    videos.sort((a, b) => {
      const resolutionA = (a.width || 0) * (a.height || 0);
      const resolutionB = (b.width || 0) * (b.height || 0);
      return resolutionB - resolutionA;
    });

    const selected = videos[0];

    return res.json({
      success: true,
      url: selected.url,
      download_url: selected.url,
      medias: videos,
      platform: data.platform || "instagram",
      type: data.type || "video",
      caption: data.meta?.caption || data.caption || "",
      thumbnail:
        data.meta?.thumbnail ||
        data.meta?.thumbnail_url ||
        data.thumb ||
        null
    });
  } catch (error) {
    console.error("Erro no download:", error.message);

    return res.status(502).json({
      success: false,
      error: error.name === "TimeoutError"
        ? "A API demorou demais para responder. Tente novamente."
        : "Falha ao consultar o serviço de download."
    });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      error: "Rota da API não encontrada."
    });
  }

  res.sendFile(
    path.join(__dirname, "public", "index.html"),
    err => {
      if (err) next(err);
    }
  );
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Neko Downloader rodando na porta ${PORT}`);
});
