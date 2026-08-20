import React from 'react';
import { Plus, Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatting';

export const ItemTable = ({ items, onChange, defaultTax = 18, currencySymbol = '₹' }) => {
  const addItem = () => {
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      description: '',
      quantity: 1,
      rate: 0,
      taxRate: defaultTax
    };
    onChange([newItem, ...items]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const duplicateItem = (index) => {
    const itemToCopy = items[index];
    const copy = {
      ...itemToCopy,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    };
    const updated = [...items];
    updated.splice(index + 1, 0, copy);
    onChange(updated);
  };

  const moveItem = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-800">Items & Particulars</label>
        <Button size="sm" variant="outline" icon={Plus} onClick={addItem}>
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
          <p className="text-xs text-slate-500">No items added to invoice.</p>
          <Button size="sm" variant="outline" className="mt-2" icon={Plus} onClick={addItem}>
            Add First Item
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const lineAmount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);

            return (
              <div key={item.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item #{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveItem(idx, -1)}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => moveItem(idx, 1)}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateItem(idx)}
                      className="p-1 text-slate-400 hover:text-purple-600"
                      title="Duplicate item"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Item Name (e.g. Web Development Service)"
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="Description (Optional)"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 items-center">
                  <Input
                    label="Qty"
                    type="number"
                    min="0"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  />
                  <Input
                    label="Rate"
                    type="number"
                    min="0"
                    step="any"
                    value={item.rate}
                    onChange={(e) => updateItem(idx, 'rate', e.target.value)}
                  />
                  <Input
                    label="Tax (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={item.taxRate !== undefined ? item.taxRate : defaultTax}
                    onChange={(e) => updateItem(idx, 'taxRate', e.target.value)}
                  />
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 font-medium uppercase">Amount</span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(lineAmount, currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
