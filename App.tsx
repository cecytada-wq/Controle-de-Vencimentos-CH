
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StockItem } from './types';
import StockTable from './components/StockTable';
import { getSmartInventoryInsights, autoCategorize } from './services/geminiService';

const App: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('stock_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    barcode: '',
    productName: '',
    expirationDate: '',
    category: '',
    quantity: 1,
    location: ''
  });

  useEffect(() => {
    localStorage.setItem('stock_items', JSON.stringify(items));
  }, [items]);

  const handleFetchInsights = async () => {
    if (items.length === 0) return;
    setLoadingInsights(true);
    const insights = await getSmartInventoryInsights(items);
    setAiInsights(insights || "Nenhuma sugestão no momento.");
    setLoadingInsights(false);
  };

  const handleAutoCategorize = async () => {
    if (!formData.productName) return;
    const cat = await autoCategorize(formData.productName);
    setFormData(prev => ({ ...prev, category: cat }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...formData, id: i.id, createdAt: i.createdAt } : i));
    } else {
      const newItem: StockItem = {
        ...formData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      setItems(prev => [...prev, newItem]);
    }
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      barcode: '',
      productName: '',
      expirationDate: '',
      category: '',
      quantity: 1,
      location: ''
    });
    setEditingItem(null);
  };

  const deleteItem = (id: string) => {
    if (confirm("Tem certeza que deseja remover este item?")) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const startEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      barcode: item.barcode,
      productName: item.productName,
      expirationDate: item.expirationDate,
      category: item.category,
      quantity: item.quantity,
      location: item.location
    });
    setShowModal(true);
  };

  const filteredItems = useMemo(() => {
    return items.filter(i => 
      i.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.barcode.includes(searchTerm) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const stats = useMemo(() => {
    const now = new Date();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return {
      total: items.length,
      low: items.filter(i => i.quantity < 5).length,
      expiring: items.filter(i => {
        const d = new Date(i.expirationDate);
        return d.getTime() - now.getTime() < sevenDays;
      }).length
    };
  }, [items]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <i className="fa-solid fa-calendar-check text-indigo-600"></i>
            Controle de Vencimentos CH
          </h1>
          <p className="text-slate-500">Gestão de Validade e Estoque Inteligente</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
          >
            <i className="fa-solid fa-plus"></i> Novo Item
          </button>
          <button 
            onClick={handleFetchInsights}
            disabled={loadingInsights}
            className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <i className={`fa-solid fa-wand-magic-sparkles text-amber-500 ${loadingInsights ? 'animate-pulse' : ''}`}></i>
            Insights AI
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 text-sm font-medium">Total de Itens</span>
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><i className="fa-solid fa-layer-group"></i></div>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 text-sm font-medium">Estoque Baixo</span>
            <div className="bg-rose-100 p-2 rounded-lg text-rose-600"><i className="fa-solid fa-triangle-exclamation"></i></div>
          </div>
          <div className="text-2xl font-bold">{stats.low}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 text-sm font-medium">Próximo ao Vencimento</span>
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><i className="fa-solid fa-clock"></i></div>
          </div>
          <div className="text-2xl font-bold">{stats.expiring}</div>
        </div>
      </div>

      {/* AI Insights Panel */}
      {aiInsights && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-6 rounded-2xl mb-8 relative">
          <button onClick={() => setAiInsights("")} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
          <h3 className="text-indigo-900 font-bold flex items-center gap-2 mb-2">
            <i className="fa-solid fa-robot"></i> Sugestões da Gemini AI
          </h3>
          <div className="text-indigo-800 text-sm leading-relaxed whitespace-pre-line">
            {aiInsights}
          </div>
        </div>
      )}

      {/* Search and Table */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Buscar por produto, categoria ou código..." 
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <StockTable items={filteredItems} onDelete={deleteItem} onEdit={startEdit} />

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {editingItem ? 'Editar Produto' : 'Adicionar Novo Produto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Código de Barras</label>
                  <div className="relative">
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.barcode}
                      onChange={e => setFormData({...formData, barcode: e.target.value})}
                      placeholder="Ex: 7891234567"
                    />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-700">
                      <i className="fa-solid fa-barcode"></i>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Nome do Produto</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.productName}
                    onChange={e => setFormData({...formData, productName: e.target.value})}
                    placeholder="Ex: Arroz Tio João 5kg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Data de Validade</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.expirationDate}
                    onChange={e => setFormData({...formData, expirationDate: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                    Categoria
                    <button 
                      type="button" 
                      onClick={handleAutoCategorize}
                      className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider hover:underline"
                    >
                      Classificar com AI
                    </button>
                  </label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="Ex: Alimentos"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Quantidade</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Localização</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="Ex: Prateleira B12"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  {editingItem ? 'Salvar Alterações' : 'Cadastrar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Controle de Vencimentos CH - Todos os direitos reservados.</p>
        <p className="mt-1">Powered by Gemini AI Engine</p>
      </footer>
    </div>
  );
};

export default App;
