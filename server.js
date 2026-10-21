const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota inteligente que faz o trabalho igual ao SnapInsta
app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.includes('instagram.com')) {
        return res.status(400).json({ error: 'Miau! Insira um link válido do Instagram.' });
    }

    try {
        // Usamos a API pública e gratuita Cobalt.tools (especialista em extrair mídias sem API Keys)
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            filenamePattern: "classic"
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'NekoDownloader/1.0'
            }
        });

        // O Cobalt retorna o URL direto (raw) do vídeo/foto nos servidores do Instagram
        if (response.data && response.data.url) {
            res.json({
                success: true,
                mediaUrl: response.data.url, // Este é o link real do MP4/JPG!
                title: "Mídia Neko Extraída com Sucesso! 🐾"
            });
        } else {
            res.status(500).json({ error: 'Ops! O Instagram escondeu essa mídia do gatinho.' });
        }

    } catch (error) {
        console.error("Erro na extração:", error.message);
        res.status(500).json({ error: 'Erro ao extrair a mídia. Verifique se o link não é de uma conta privada!' });
    }
});

app.listen(PORT, () => {
    console.log(`🐱 NekoServer rodando na porta ${PORT} com extrator ativo!`);
});
