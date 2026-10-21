
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Verifica se a API está configurada.
function getApiConfig() {
    const base = process.env.COBALT_API_URL;

    if (!base) return null;

    const parsed = new URL(base);

    if (parsed.protocol !== 'https:') {
        throw new Error('A API precisa utilizar HTTPS.');
    }

    return {
        url: parsed.toString().replace(/\/+$/, '') + '/',
        key: process.env.COBALT_API_KEY || '',
        scheme: process.env.COBALT_AUTH_SCHEME || 'Api-Key'
    };
}

// Diagnóstico básico do servidor.
app.get('/api/health', (req, res) => {
    res.json({
        online: true,
        apiConfigured: Boolean(process.env.COBALT_API_URL)
    });
});

// Solicita a extração à instância Cobalt configurada.
app.post('/api/download', async (req, res) => {
    const input = req.body?.url;

    if (typeof input !== 'string' || input.length > 2048) {
        return res.status(400).json({
            error: 'Cole um link válido do Instagram.'
        });
    }

    let source;

    try {
        source = new URL(input.trim());
    } catch {
        return res.status(400).json({
            error: 'O link informado não é válido.'
        });
    }

    if (
        source.protocol !== 'https:' ||
        !['instagram.com', 'www.instagram.com',
          'm.instagram.com'].includes(source.hostname)
    ) {
        return res.status(400).json({
            error: 'Use um link HTTPS do Instagram.'
        });
    }

    let config;

    try {
        config = getApiConfig();
    } catch (error) {
        console.error('Configuração inválida:', error.message);
        return res.status(500).json({
            error: 'A configuração da API é inválida.'
        });
    }

    if (!config) {
        return res.status(503).json({
            error: 'API não configurada. Consulte o README.'
        });
    }

    try {
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        };

        if (config.key) {
            headers.Authorization =
                `${config.scheme} ${config.key}`;
        }

        const response = await axios.post(
            config.url,
            {
                url: source.toString(),
                videoQuality: 'max',
                filenameStyle: 'pretty'
            },
            {
                headers,
                timeout: 45000,
                maxRedirects: 0,
                validateStatus: status =>
                    status >= 200 && status < 300
            }
        );

        const data = response.data;

        if (!data || typeof data.status !== 'string') {
            throw new Error('Resposta inesperada da API.');
        }

        if (
            ['tunnel', 'redirect'].includes(data.status) &&
            typeof data.url === 'string'
        ) {
            const media = new URL(data.url);

            if (media.protocol !== 'https:') {
                throw new Error('A API retornou uma URL insegura.');
            }

            return res.json({
                success: true,
                mediaUrl: media.toString(),
                filename: data.filename || 'Neko_Download'
            });
        }

        if (data.status === 'picker') {
            const items = Array.isArray(data.picker)
                ? data.picker
                    .filter(item =>
                        item &&
                        ['video', 'photo', 'gif'].includes(item.type) &&
                        typeof item.url === 'string' &&
                        item.url.startsWith('https://')
                    )
                    .map(item => ({
                        type: item.type,
                        url: item.url,
                        thumb: typeof item.thumb === 'string'
                            ? item.thumb : null
                    }))
                : [];

            return res.status(200).json({
                success: true,
                picker: items,
                message: 'Escolha uma das mídias disponíveis.'
            });
        }

        console.error(
            'Erro retornado pela API:',
            JSON.stringify(data).slice(0, 1000)
        );

        return res.status(502).json({
            error: data.status === 'error'
                ? 'A API não conseguiu extrair esta publicação.'
                : 'A API retornou um formato não suportado.',
            code: data.error?.code || data.status
        });

    } catch (error) {
        console.error('Erro na extração:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });

        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                error: 'A extração demorou demais. Tente novamente.'
            });
        }

        return res.status(502).json({
            error: 'Falha ao consultar a API. Verifique os logs do Render.'
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🐱 Neko Downloader ativo na porta ${PORT}`);
});
