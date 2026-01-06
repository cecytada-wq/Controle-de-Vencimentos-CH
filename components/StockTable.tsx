
import React from 'react';
import { StockItem } from '../types';

interface StockTableProps {
  items: StockItem[];
  onDelete: (id: string) => void;
  onEdit: (item: StockItem) => void;
}

const StockTable: React.FC<StockTableProps> = ({ items, onDelete, onEdit }) => {
  const isExpired = (date: string) => new Date(date) < new Date();
  const isExpiringSoon = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return diff > 0 && diff < (1000 * 60 * 60 * 24 * 7); // 7 days
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-bottom border-slate-200">
            <th className="px-6 py-4 font-semibold text-slate-700">Código</th>
            <th className="px-6 py-4 font-semibold text-slate-700">Produto</th>
            <th className="px-6 py-4 font-semibold text-slate-700">Categoria</th>
            <th className="px-6 py-4 font-semibold text-slate-700">Qtd.</th>
            <th className="px-6 py-4 font-semibold text-slate-700">Validade</th>
            <th className="px-6 py-4 font-semibold text-slate-700">Local</th>
            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm font-mono text-slate-500">{item.barcode}</td>
              <td className="px-6 py-4 font-medium text-slate-900">{item.productName}</td>
              <td className="px-6 py-4 text-sm">
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold">
                  {item.category}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-semibold">
                <span className={item.quantity < 5 ? "text-red-500" : "text-slate-700"}>
                  {item.quantity}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                  isExpired(item.expirationDate) ? "bg-red-100 text-red-700" :
                  isExpiringSoon(item.expirationDate) ? "bg-amber-100 text-amber-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 italic">{item.location}</td>
              <td className="px-6 py-4 text-right">
                <button 
                  onClick={() => onEdit(item)}
                  className="text-indigo-600 hover:text-indigo-800 p-2"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button 
                  onClick={() => onDelete(item.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                Nenhum item encontrado no estoque.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;
