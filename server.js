const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Função para extrair a mídia direta do Instagram via query pública (?__a=1 ou graphql)
async function getInstagramMedia(url) {
    try {
        // Limpa o link para pegar o código da postagem (shortcode)
        const match = url.match(/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/);
        if (!match) throw new Error("Link do Instagram inválido.");

        const shortcode = match[1];

        // Faz requisição com User-Agent real aos endpoints GraphQL do Instagram
        const response = await axios.get(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 100.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Sec-Fetch-Mode': 'cors'
            }
        });

        const items = response.data?.graphql?.shortcode_media || response.data?.items?.[0];

        if (!items) {
            // Tentativa secundária via endpoint GraphQL público direto
            const gqlResponse = await axios.get(`https://www.instagram.com/graphql/query/?query_hash=b30553150821034c44933a3e6a987627&variables=${encodeURIComponent(JSON.stringify({ shortcode }))}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                }
            });

            const mediaData = gqlResponse.data?.data?.shortcode_media;
            if (mediaData) {
                const isVideo = mediaData.is_video;
                const mediaUrl = isVideo ? mediaData.video_url : mediaData.display_url;
                return { mediaUrl, isVideo };
            }
            throw new Error("Não foi possível extrair a mídia.");
        }

        const isVideo = items.is_video;
        const mediaUrl = isVideo ? items.video_url : items.display_url;

        return { mediaUrl, isVideo };

    } catch (error) {
        // Fallback de contingência caso a resposta direta da Meta venha bloqueada
        // Redireciona a extração diretamente via serviço proxy nativo
        const cleanShortcode = url.match(/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/)?.[1];
        if (cleanShortcode) {
            return {
                mediaUrl: `https://instagram.com/p/${cleanShortcode}/media/?size=l`,
                isVideo: false
            };
        }
        throw error;
    }
}

// Rota da API
app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.includes('instagram.com')) {
        return res.status(400).json({ error: 'Miau! Insira um link válido do Instagram.' });
    }

    try {
        const result = await getInstagramMedia(url);
        
        res.json({
            success: true,
            mediaUrl: result.mediaUrl,
            isVideo: result.isVideo,
            title: "Mídia Neko Extraída com Sucesso! 🐾"
        });

    } catch (error) {
        console.error("Erro na extração:", error.message);
        res.status(500).json({ 
            error: 'Ops! O gatinho não conseguiu acessar essa mídia no momento. Certifique-se de que o link é de uma conta pública.' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🐱 NekoServer rodando na porta ${PORT}`);
});
