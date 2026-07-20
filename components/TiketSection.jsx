'use client';

import { useEffect, useState } from 'react';
import { Ticket, Plus, Send, X, MessageCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { createClient } from '../lib/supabase/client';

const KATEGORI_TIKET = ['Pesanan Belum Selesai', 'Masalah Saldo/Deposit', 'Pertanyaan Layanan', 'Lainnya'];

const statusStyle = {
  Terbuka: 'bg-blue-500/10 text-blue-400',
  Dibalas: 'bg-[#B9FF66]/10 text-[#B9FF66]',
  Ditutup: 'bg-gray-500/10 text-gray-400',
};

function formatTanggal(iso) {
  const date = new Date(iso);
  const dd = String(date.getDate()).padStart(2, '0');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][
    date.getMonth()
  ];
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${dd} ${month}, ${hh}:${mm}`;
}

export default function TiketSection() {
  const [supabase] = useState(() => createClient());
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [kategori, setKategori] = useState(KATEGORI_TIKET[0]);
  const [orderId, setOrderId] = useState('');
  const [pesan, setPesan] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!pesan.trim()) {
      setFormError('Pesan tiket wajib diisi.');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setFormError('Sesi login kamu habis, coba refresh halaman.');
      return;
    }

    setSubmitting(true);

    const { data, error: insertError } = await supabase
      .from('tickets')
      .insert({
        user_id: user.id,
        kategori,
        order_id: orderId.trim() || null,
        pesan: pesan.trim(),
        status: 'Terbuka',
      })
      .select()
      .single();

    setSubmitting(false);

    if (insertError) {
      setFormError(insertError.message);
      return;
    }

    setTickets((prev) => [data, ...prev]);
    setKategori(KATEGORI_TIKET[0]);
    setOrderId('');
    setPesan('');
    setShowForm(false);
  }

  if (selectedTicket) {
    return (
      <div className="max-w-2xl flex flex-col gap-4">
        <button
          onClick={() => setSelectedTicket(null)}
          className="text-sm text-gray-400 hover:text-[#B9FF66] transition-colors w-fit"
        >
          &larr; Kembali ke daftar tiket
        </button>

        <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="font-mono text-sm text-gray-400">{selectedTicket.id.slice(0, 8)}</p>
              <p className="font-bold mt-1">{selectedTicket.kategori}</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[selectedTicket.status]}`}>
              {selectedTicket.status}
            </span>
          </div>

          <div className="p-6 flex flex-col gap-4">
            {selectedTicket.order_id && (
              <div className="text-sm">
                <span className="text-gray-400">ID Pesanan terkait: </span>
                <span className="font-mono">{selectedTicket.order_id}</span>
              </div>
            )}

            <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Clock className="w-3.5 h-3.5" />
                {formatTanggal(selectedTicket.created_at)}
              </div>
              <p className="text-sm text-gray-300">{selectedTicket.pesan}</p>
            </div>

            {selectedTicket.balasan ? (
              <div className="bg-[#B9FF66]/5 border border-[#B9FF66]/20 rounded-xl p-4">
                <p className="text-xs font-medium text-[#B9FF66] mb-2">Balasan dari tim support</p>
                <p className="text-sm text-gray-300">{selectedTicket.balasan}</p>
              </div>
            ) : (
              <div className="bg-[#B9FF66]/5 border border-[#B9FF66]/20 rounded-xl p-4 text-sm text-gray-400">
                Tim dukungan akan membalas tiket ini secepatnya. Balasan akan muncul di sini.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-[#B9FF66] text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#a0e655] transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          Buat Tiket Baru
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#B9FF66]" />
              <h2 className="text-lg font-bold">Buat Tiket Baru</h2>
            </div>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {formError}
            </div>
          )}

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Kategori</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B9FF66]"
            >
              {KATEGORI_TIKET.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              ID Pesanan <span className="text-gray-600">(opsional)</span>
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Contoh: ORD-10241"
              className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B9FF66]"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Pesan</label>
            <textarea
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              rows={4}
              placeholder="Jelaskan kendala kamu di sini..."
              className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B9FF66] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 bg-[#B9FF66] text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#a0e655] transition-colors disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Mengirim...' : 'Kirim Tiket'}
          </button>
        </form>
      )}

      <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-sm font-bold">Tiket Kamu</h3>
        </div>

        {loading && (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-6 h-6 text-[#B9FF66] animate-spin" />
            <p className="text-sm text-gray-500">Memuat tiket...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <MessageCircle className="w-8 h-8 text-gray-600" />
            <p className="text-sm text-gray-500">Belum ada tiket. Buat tiket baru kalau ada kendala.</p>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="flex flex-col">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="flex items-center justify-between px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] text-left transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{ticket.kategori}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {ticket.id.slice(0, 8)} · {formatTanggal(ticket.created_at)}
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
    </div>
  );
}