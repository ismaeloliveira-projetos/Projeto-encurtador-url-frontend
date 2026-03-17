'use client';

import { useState, useEffect } from 'react';
import { ClipboardCopyIcon } from 'lucide-react';
import { useNotification } from './storeNotification';

interface UrlData {
  id: number;
  originalUrl: string;
  shortCode: string;
  clicks: number;
  rateLimit?: number;
  expiry?: string;
}

export default function Home() {
  const notification = useNotification();
  const [inputUrl, setInputUrl] = useState('');
  const [urls, setUrls] = useState<UrlData[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://projeto-encurtador-url-backend-3.onrender.com/';
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'teste123';

  const [typedText, setTypedText] = useState('');
  const fullText = 'Encurtador de Links';

  useEffect(() => {
    fetchUrls();

    let index = 0;
    const typingInterval = setInterval(() => {
      setTypedText(fullText.slice(0, index + 1));
      index++;
      if (index > fullText.length) clearInterval(typingInterval);
    }, 150);

    return () => clearInterval(typingInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUrls = async () => {
    try {
      const res = await fetch(`${API_URL}/urls`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      if (!res.ok) throw new Error('Erro ao buscar URLs');
      const data = await res.json();
      setUrls(Array.isArray(data.urls) ? data.urls : []);
    } catch {
      notification.setNotification('Erro ao buscar URLs', 'error');
      setUrls([]);
    }
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ originalUrl: inputUrl }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        notification.setNotification(errData?.message || 'Erro ao encurtar URL', 'error');
        return;
      }

      await res.json();
      setInputUrl('');
      notification.setNotification('URL encurtada com sucesso!', 'success');
      fetchUrls();
    } catch {
      notification.setNotification('Erro ao encurtar URL', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (shortCode: string) => {
    const fullShortUrl = `${API_URL}/redirect/${shortCode}`;
    navigator.clipboard.writeText(fullShortUrl);
    notification.setNotification(`Link copiado: ${fullShortUrl}`, 'success');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start p-8 font-mono text-black"
      style={{
        backgroundImage: 'url(/windows98.jpg)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="bg-gray-200 p-6 shadow-[3px_3px_0_#fff,6px_6px_0_#aaa] rounded border border-black w-full max-w-3xl">
        <h1 className="text-xl font-bold mb-2">{typedText}<span className="animate-pulse">|</span></h1>
        <p className="text-sm text-gray-800 mb-4">Simples, rápido e retrô</p>

        {/* Notificação */}
        {notification.show && (
          <div
            className={`mb-4 px-2 py-1 border border-black text-center font-bold ${
              notification.type === 'success' ? 'bg-green-400 text-black' : 'bg-red-400 text-black'
            }`}
            onClick={notification.clearNotification}
            style={{ cursor: 'pointer' }}
          >
            {notification.message}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleShorten} className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            type="url"
            placeholder="Cole sua URL aqui..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            required
            className="flex-1 px-2 py-1 border border-black bg-gray-100 text-black focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1 border border-black shadow-[2px_2px_0_#fff,4px_4px_0_#aaa] bg-gray-300 hover:bg-gray-400 font-bold"
          >
            {loading ? 'Encurtando...' : 'Encurtar'}
          </button>
        </form>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-black">
            <thead>
              <tr className="bg-gray-300">
                <th className="border border-black px-2 py-1">Original</th>
                <th className="border border-black px-2 py-1">Encurtada</th>
                <th className="border border-black px-2 py-1 text-center">Cliques</th>
                <th className="border border-black px-2 py-1 text-center">Rate Limit</th>
                <th className="border border-black px-2 py-1 text-center">Expira em</th>
                <th className="border border-black px-2 py-1 text-center">Ação</th>
              </tr>
            </thead>
            <tbody>
              {urls.length > 0 ? (
                urls.map((url) => (
                  <tr key={url.id} className="bg-gray-100 hover:bg-gray-200 transition">
                    <td className="border border-black px-2 py-1 truncate max-w-[150px]">{url.originalUrl}</td>
                    <td
                      className="border border-black px-2 py-1 text-blue-800 font-bold cursor-pointer hover:underline"
                      onClick={() => window.open(`${API_URL}/redirect/${url.shortCode}`, '_blank')}
                    >
                      {`${API_URL}/redirect/${url.shortCode}`}
                    </td>
                    <td className="border border-black px-2 py-1 text-center">{url.clicks}</td>
                    <td className="border border-black px-2 py-1 text-center">{url.rateLimit ?? '∞'}</td>
                    <td className="border border-black px-2 py-1 text-center">{url.expiry ? new Date(url.expiry).toLocaleString() : '-'}</td>
                    <td className="border border-black px-2 py-1 text-center">
                      <button
                        onClick={() => copyToClipboard(url.shortCode)}
                        className="flex items-center gap-1 px-2 py-1 border border-black shadow-[2px_2px_0_#fff] bg-gray-300 font-bold hover:bg-gray-400"
                      >
                        <ClipboardCopyIcon className="w-4 h-4" />
                        Copiar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-2">Nenhuma URL criada ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}