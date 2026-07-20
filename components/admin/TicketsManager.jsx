'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Send, Clock, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

function formatTanggal(iso) {
  const date = new Date(iso);
  const dd = String(date.getDate()).padStart(2, '0');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${dd} ${month}, ${hh}:${mm}`;
}

const statusStyle = {
  Terbuka: 'bg-blue-500/10 text-blue-400',
  Dibalas: 'bg-[#FFB800]/10 text-[#FFB800]',
  Ditutup: 'bg-gray-500/10 text-gray-400',
};

export default function TicketsManager() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/tickets');
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat tiket.');
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selected = tickets.find((t) => t.id === selectedId) || null;

  function handleOpenTicket(ticket) {
    setSelectedId(ticket.id);
    setReplyText(ticket.balasan || '');
  }

  async function patchTicket(id, patch) {
    const res = await fetch('/api/admin/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      console.error('Gagal update tiket:', data.error);
      return;
    }
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function handleSendReply() {
    if (!replyText.trim()) return;
    patchTicket(selectedId, { balasan: replyText.trim(), status: 'Dibalas' });
  }

  function handleCloseTicket() {
    patchTicket(selectedId, { status: 'Ditutup' });
  }

  if (selected) {
    return (
      <div className="max-w-2xl flex flex-col gap-4">
        <button
          onClick={() => setSelectedId(null)}
          className="text-sm text-gray-400 hover:text-[#FFB800] transition-colors w-fit"
        >
          &larr; Kembali ke daftar tiket
        </button>

        <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="font-mono text-sm text-gray-400">{selected.id.slice(0, 8)}</p>
              <p className="font-bold mt-1">{selected.kategori}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {selected.profiles?.email || selected.profiles?.full_name || '-'}
              </p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[selected.status]}`}>
              {selected.status}
            </span>
          </div>

          <div className="p-6 flex flex-col gap-4">
            {selected.order_id && (
              <div className="text-sm">
                <span className="text-gray-400">ID Pesanan terkait: </span>
                <span className="font-mono">{selected.order_id}</span>
              </div>
            )}

            <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Clock className="w-3.5 h-3.5" />
                {formatTanggal(selected.created_at)}
              </div>
              <p className="text-sm text-gray-300">{selected.pesan}</p>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Balasan</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="Tulis balasan untuk pengguna..."
                className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800] resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSendReply}
                className="flex items-center justify-center gap-2 bg-[#FFB800] text-black text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#e6a600] transition-colors"
              >
                <Send className="w-4 h-4" />
                Kirim Balasan
              </button>
              {selected.status !== 'Ditutup' && (
                <button
                  onClick={handleCloseTicket}
                  className="text-sm font-medium text-gray-400 hover:text-white px-4 py-2.5 transition-colors"
                >
                  Tutup Tiket
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#FFB800]" />
          <h2 className="text-lg font-bold">Tiket Support</h2>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Muat Ulang
        </button>
      </div>

      <p className="text-sm text-gray-400 -mt-4">Tiket asli dari semua pelanggan, langsung dari database.</p>

      {loading && (
        <div className="bg-[#191A19] border border-white/10 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
          <p className="text-sm text-gray-400">Memuat tiket...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-[#191A19] border border-red-500/30 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
          {tickets.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">Belum ada tiket dari pelanggan.</div>
          ) : (
            <div className="flex flex-col">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => handleOpenTicket(ticket)}
                  className="flex items-center justify-between px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] text-left transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{ticket.kategori}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {ticket.profiles?.email || '-'} · {formatTanggal(ticket.created_at)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}