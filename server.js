const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve a página estática kawaii da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Rota da API para processar o link do Instagram
app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.includes('instagram.com')) {
        return res.status(400).json({ error: 'Miau! Insira um link válido do Instagram.' });
    }

    try {
        // Simulação de processamento de alta qualidade tratada pelo servidor
        setTimeout(() => {
            res.json({
                success: true,
                title: "Reel / Mídia do Instagram capturada com sucesso! 🐾",
                type: "video",
                quality: "HD 1080p",
                mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            });
        }, 1500);

    } catch (error) {
        res.status(500).json({ error: 'Ops! O gatinho não conseguiu processar este link agora. Tente novamente.' });
    }
});

app.listen(PORT, () => {
    console.log(`🐱 NekoServer rodando na porta ${PORT}`);
});
