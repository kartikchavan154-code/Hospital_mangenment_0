import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { Calendar, Plus, Activity, Heart, ShieldAlert, Sparkles, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Diagnosis wizard form fields
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [vitals, setVitals] = useState({ bp: '', temp: '', pulse: '' });
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([{ medication: '', dosage: '', frequency: '', duration: '' }]);
  const [submittingRecord, setSubmittingRecord] = useState(false);

  // ML State
  const [mlPredictions, setMlPredictions] = useState(null);
  const [predictingRisk, setPredictingRisk] = useState(false);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const [patientRes, historyRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/patients/${id}/medical-history`)
      ]);
      if (patientRes.data.success) setPatient(patientRes.data.data);
      if (historyRes.data.success) setHistory(historyRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const handleVitalsChange = (e) => {
    setVitals({ ...vitals, [e.target.name]: e.target.value });
  };

  const handlePrescriptionChange = (index, e) => {
    const updated = [...prescriptions];
    updated[index][e.target.name] = e.target.value;
    setPrescriptions(updated);
  };

  const addPrescriptionRow = () => {
    setPrescriptions([...prescriptions, { medication: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removePrescriptionRow = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleAddMedicalRecord = async (e) => {
    e.preventDefault();
    if (!diagnosis) return alert('Diagnosis is required.');
    
    setSubmittingRecord(true);
    try {
      const payload = {
        patientId: id,
        doctorId: authUser.role === 'doctor' ? authUser.id : 1, // fallback to doc id
        diagnosis,
        symptoms,
        vitals,
        notes,
        prescriptions: prescriptions.filter(p => p.medication)
      };

      const res = await api.post('/medical-records', payload);
      if (res.data.success) {
        alert('Diagnostic record logged successfully.');
        setDiagnosis('');
        setSymptoms('');
        setVitals({ bp: '', temp: '', pulse: '' });
        setNotes('');
        setPrescriptions([{ medication: '', dosage: '', frequency: '', duration: '' }]);
        fetchPatientData();
      }
    } catch (err) {
      alert('Error logging medical record.');
    } finally {
      setSubmittingRecord(false);
    }
  };

  const handlePredictDiseaseRisk = async () => {
    if (!symptoms) return alert('Please enter active symptoms first.');
    setPredictingRisk(true);
    setMlPredictions(null);
    try {
      const birthYear = patient?.dateOfBirth ? new Date(patient.dateOfBirth).getFullYear() : null;
      const age = birthYear ? new Date().getFullYear() - birthYear : 35;
      
      const res = await api.post('/ml/predict/disease-risk', {
        symptoms,
        age,
        gender: patient?.gender || 'male'
      });
      if (res.data.success) {
        setMlPredictions(res.data.data.risks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPredictingRisk(false);
    }
  };

  if (loading) return <div style={{ color: 'hsl(var(--muted))' }}>Loading patient clinical profile...</div>;
  if (!patient) return <div style={{ color: 'red' }}>Patient profile not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800 }}>
            Patient: {patient.user?.firstName} {patient.user?.lastName}
          </h1>
          <p style={{ color: 'hsl(var(--muted))' }}>Comprehensive medical chart history.</p>
        </div>
        <button onClick={() => navigate('/patients')} className="btn btn-secondary">
          Back to List
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        {/* Left Side: Demographics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Patient Vitals & Demographics">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div><strong>Age:</strong> {patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 'N/A'} yrs</div>
              <div><strong>Gender:</strong> <span style={{ textTransform: 'capitalize' }}>{patient.gender}</span></div>
              <div><strong>Blood Type:</strong> <span className="badge badge-info">{patient.bloodGroup}</span></div>
              <div><strong>Allergies:</strong> <span style={{ color: patient.allergies ? '#f87171' : 'inherit' }}>{patient.allergies || 'None declared'}</span></div>
              <div><strong>Address:</strong> {patient.address || 'N/A'}</div>
              <div><strong>Emergency Person:</strong> {patient.emergencyContact}</div>
              <div><strong>Emergency Phone:</strong> {patient.emergencyPhone}</div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '10px' }}>
                <strong>Insurance Provider:</strong> {patient.insuranceProvider || 'Self-pay'}
                {patient.insuranceNumber && <div>Policy: {patient.insuranceNumber}</div>}
              </div>
            </div>
          </Card>

          {/* ML prediction panel */}
          {['admin', 'doctor'].includes(authUser.role) && (
            <Card title="ML Disease Risk Estimator">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
                  Analyze patient risks based on currently entered symptom flags.
                </p>
                <textarea
                  placeholder="Enter symptoms (e.g. fever, chest pain, cough)..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows="3"
                />
                <button 
                  onClick={handlePredictDiseaseRisk} 
                  className="btn btn-secondary" 
                  disabled={predictingRisk} 
                  style={{ gap: '6px', color: 'hsl(var(--accent))', border: '1px solid hsl(var(--accent))' }}
                >
                  <Sparkles size={16} />
                  {predictingRisk ? 'Analyzing...' : 'Predict Risks'}
                </button>

                {mlPredictions && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#fff' }}>Predicted Risks:</h4>
                    {mlPredictions.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '4px' }}>
                        <span>{r.disease}</span>
                        <span style={{ color: r.severity === 'high' ? '#f87171' : '#fbbf24', fontWeight: 600 }}>{(r.probability * 100).toFixed(0)}% ({r.severity})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Side: Medical records */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Diagnostic record log form (Doctor/Admin only) */}
          {['admin', 'doctor'].includes(authUser.role) && (
            <Card title="Log Clinical Consultation">
              <form onSubmit={handleAddMedicalRecord} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem' }}>Diagnosis</label>
                    <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Diagnosis details" required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem' }}>Blood Pressure</label>
                    <input type="text" name="bp" value={vitals.bp} onChange={handleVitalsChange} placeholder="120/80" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem' }}>Pulse Rate</label>
                    <input type="text" name="pulse" value={vitals.pulse} onChange={handleVitalsChange} placeholder="72" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem' }}>Temp (°F)</label>
                    <input type="text" name="temp" value={vitals.temp} onChange={handleVitalsChange} placeholder="98.6" />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem' }}>Prescriptions</label>
                  {prescriptions.map((p, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 30px', gap: '8px', alignItems: 'center' }}>
                      <input type="text" name="medication" value={p.medication} onChange={(e) => handlePrescriptionChange(idx, e)} placeholder="Med name" />
                      <input type="text" name="dosage" value={p.dosage} onChange={(e) => handlePrescriptionChange(idx, e)} placeholder="Dosage" />
                      <input type="text" name="frequency" value={p.frequency} onChange={(e) => handlePrescriptionChange(idx, e)} placeholder="Frequency" />
                      <input type="text" name="duration" value={p.duration} onChange={(e) => handlePrescriptionChange(idx, e)} placeholder="Duration" />
                      {prescriptions.length > 1 && (
                        <button type="button" onClick={() => removePrescriptionRow(idx)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addPrescriptionRow} className="btn btn-secondary" style={{ alignSelf: 'flex-start', padding: '4px 8px', fontSize: '0.75rem', marginTop: '6px' }}>+ Add Row</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem' }}>Consultation Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="Symptomatic descriptions, guidelines..." />
                </div>

                <button type="submit" disabled={submittingRecord} className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
                  {submittingRecord ? 'Saving Consultation...' : 'Log Consultation'}
                </button>
              </form>
            </Card>
          )}

          {/* Historical clinical chart */}
          <Card title="Historical Medical Records & Prescriptions">
            {history.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--muted))' }}>No medical history records logged.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {history.map((record) => (
                  <div key={record.id} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{record.diagnosis}</span>
                      <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>Consulted on {record.createdAt.split('T')[0]}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
                      <div>BP: <strong>{record.vitals?.bp || 'N/A'}</strong></div>
                      <div>Pulse: <strong>{record.vitals?.pulse || 'N/A'} bpm</strong></div>
                      <div>Temp: <strong>{record.vitals?.temp || 'N/A'} °F</strong></div>
                    </div>

                    {record.symptoms && (
                      <div style={{ fontSize: '0.85rem' }}>
                        <strong>Symptoms:</strong> {record.symptoms}
                      </div>
                    )}

                    {record.notes && (
                      <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))' }}>
                        <strong>Notes:</strong> {record.notes}
                      </div>
                    )}

                    {record.prescriptions && record.prescriptions.length > 0 && (
                      <div style={{ marginTop: '6px' }}>
                        <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Prescriptions:</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {record.prescriptions.map((presc, idx) => (
                            <div key={idx} style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px' }}>
                              🧪 <strong>{presc.medication}</strong> - {presc.dosage} | {presc.frequency} | {presc.duration}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
