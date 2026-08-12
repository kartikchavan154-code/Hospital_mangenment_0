import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import { DollarSign, FileDown, Plus, Eye, X } from 'lucide-react';

const BillingList = () => {
  const { user: authUser } = useAuth();
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Bill Generation Modal/Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    items: [{ name: '', description: '', quantity: 1, rate: 0, amount: 0 }],
    tax: 0,
    discount: 0,
    dueDate: '',
    notes: ''
  });

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bills?page=${page}&limit=10`);
      if (res.data.success) {
        setBills(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientsList = async () => {
    try {
      const res = await api.get('/patients?limit=50');
      if (res.data.success) setPatients(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [page]);

  useEffect(() => {
    if (showForm) {
      fetchPatientsList();
    }
  }, [showForm]);

  const handleDownloadPDF = async (id, invoiceNumber) => {
    try {
      const res = await api.get(`/bills/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `invoice-${invoiceNumber}.pdf`;
      link.click();
    } catch (err) {
      alert('Error downloading PDF receipt.');
    }
  };

  const handleItemChange = (index, e) => {
    const updated = [...formData.items];
    const field = e.target.name;
    const value = e.target.value;
    updated[index][field] = value;

    if (field === 'rate' || field === 'quantity') {
      const rate = parseFloat(updated[index].rate || 0);
      const qty = parseInt(updated[index].quantity || 1);
      updated[index].amount = rate * qty;
    }
    setFormData({ ...formData, items: updated });
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', description: '', quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const removeItemRow = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleRecordPayment = async (billId, totalAmount) => {
    if (window.confirm(`Record payment of ₹${parseFloat(totalAmount).toFixed(2)} cash/card/UPI?`)) {
      try {
        const res = await api.post('/payments', {
          billId,
          amount: totalAmount,
          method: 'cash',
          transactionId: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          notes: 'Recorded manually at reception'
        });
        if (res.data.success) {
          alert('Payment recorded successfully.');
          fetchBills();
        }
      } catch (err) {
        alert('Error recording payment.');
      }
    }
  };

  const handleSubmitBill = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.items.length) return alert('Please enter patient and items.');

    try {
      const res = await api.post('/bills', formData);
      if (res.data.success) {
        alert('Invoice generated successfully.');
        setShowForm(false);
        setFormData({
          patientId: '',
          items: [{ name: '', description: '', quantity: 1, rate: 0, amount: 0 }],
          tax: 0,
          discount: 0,
          dueDate: '',
          notes: ''
        });
        fetchBills();
      }
    } catch (err) {
      alert('Error creating invoice.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800 }}>Billing Ledger & Receipts</h1>
          <p style={{ color: 'hsl(var(--muted))' }}>Generate clinical invoices, issue receipts and review payment ledger statements.</p>
        </div>
        {['admin', 'receptionist'].includes(authUser.role) && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={16} />
            Generate Invoice
          </button>
        )}
      </div>

      {showForm && (
        <Card title="Generate Medical Invoice" style={{ position: 'relative' }}>
          <button onClick={() => setShowForm(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'hsl(var(--muted))', cursor: 'pointer' }}>
            <X size={18} />
          </button>

          <form onSubmit={handleSubmitBill} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Select Patient</label>
                <select name="patientId" value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} required>
                  <option value="">-- Select Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Due Date</label>
                <input type="date" name="dueDate" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
              </div>
            </div>

            {/* Line items rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <strong style={{ fontSize: '0.85rem', color: '#fff' }}>Bill Line Items</strong>
              {formData.items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 30px', gap: '8px', alignItems: 'center' }}>
                  <input type="text" name="name" value={item.name} onChange={(e) => handleItemChange(idx, e)} placeholder="Item / Service Name" required />
                  <input type="text" name="description" value={item.description} onChange={(e) => handleItemChange(idx, e)} placeholder="Description" />
                  <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(idx, e)} placeholder="Qty" min="1" required />
                  <input type="number" name="rate" value={item.rate} onChange={(e) => handleItemChange(idx, e)} placeholder="Rate" min="0" required />
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--accent))' }}>₹{parseFloat(item.amount || 0).toFixed(2)}</div>
                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => removeItemRow(idx)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItemRow} className="btn btn-secondary" style={{ alignSelf: 'flex-start', padding: '4px 8px', fontSize: '0.75rem', marginTop: '6px' }}>+ Add Item Row</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Tax (₹)</label>
                <input type="number" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value || 0) })} min="0" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Discount (₹)</label>
                <input type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value || 0) })} min="0" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label>Billing Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="2" placeholder="Insurance guidelines, payment instructions..." />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', marginTop: '10px' }}>
              Generate Invoice
            </button>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div style={{ color: 'hsl(var(--muted))', textAlign: 'center', padding: '40px' }}>Loading billing logs...</div>
        ) : (
          <>
            <Table headers={['Invoice Number', 'Patient Name', 'Gross Total', 'Tax / Discount', 'Due Date', 'Status', 'Actions']}>
              {bills.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No invoices registered.</td></tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id}>
                    <td style={{ color: '#fff', fontWeight: 600 }}>{b.invoiceNumber}</td>
                    <td>{b.patient.user.firstName} {b.patient.user.lastName}</td>
                    <td style={{ color: 'hsl(var(--accent))', fontWeight: 600 }}>₹{parseFloat(b.totalAmount).toFixed(2)}</td>
                    <td>₹{parseFloat(b.tax).toFixed(2)} / -₹{parseFloat(b.discount).toFixed(2)}</td>
                    <td>{b.dueDate || 'N/A'}</td>
                    <td>
                      <span className={`badge badge-${b.status === 'paid' ? 'success' : 'warning'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleDownloadPDF(b.id, b.invoiceNumber)} className="icon-btn" title="Download PDF Receipt">
                          <FileDown size={16} />
                        </button>
                        {['admin', 'receptionist'].includes(authUser.role) && b.status !== 'paid' && (
                          <button onClick={() => handleRecordPayment(b.id, b.totalAmount)} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                            Collect Payment
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </Table>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
};

export default BillingList;
