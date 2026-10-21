const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota de Extração (Busca o link real do MP4 nos servidores secretos da Meta)
app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.includes('instagram.com')) {
        return res.status(400).json({ error: 'Miau! Insira um link válido do Instagram.' });
    }

    try {
        // Utilizamos a API pública do Cobalt com headers específicos para evitar bloqueios do Render
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': 'https://cobalt.tools',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        if (response.data && response.data.url) {
            // Sucesso! Temos o link direto do arquivo (ex: scontent.cdninstagram.com)
            return res.json({
                success: true,
                mediaUrl: response.data.url, 
                title: "Mídia Neko Extraída! 🐾"
            });
        } else {
            throw new Error("Falha na extração limpa");
        }
    } catch (error) {
        console.error("Erro na extração:", error.message);
        // Sem plano B com link do Instagram! Se falhar, avisa o usuário.
        return res.status(500).json({ 
            error: 'Ops! O Instagram bloqueou a extração. Verifique se o perfil é público.' 
        });
    }
});

// ROTA MÁGICA: Força o navegador do celular a baixar o arquivo em vez de abrir!
app.get('/api/stream', async (req, res) => {
    const fileUrl = req.query.url;
    if (!fileUrl) return res.status(400).send('URL ausente');

    try {
        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'stream'
        });
        
        // Estes cabeçalhos dizem ao celular: "Isto é um arquivo para salvar na galeria!"
        res.setHeader('Content-Disposition', 'attachment; filename="Neko_Reels_Kawaii.mp4"');
        res.setHeader('Content-Type', 'video/mp4');
        
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send('Erro ao processar o download direto.');
    }
});

app.listen(PORT, () => {
    console.log(`🐱 NekoServer rodando na porta ${PORT} com Forçador de Download!`);
});
