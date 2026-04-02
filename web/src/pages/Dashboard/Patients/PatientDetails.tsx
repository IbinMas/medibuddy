import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { PatientService } from '../../../services/patient.service';
import { PrescriptionService } from '../../../services/prescription.service';
import { ArrowLeft, Pill, CalendarClock, Plus, Trash2 } from 'lucide-react';

export default function PatientDetails() {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Prescription Form
  const defaultDrug = { medication: '', dosage: '', frequency: 'Once daily', mealTiming: '', startDate: '', endDate: '' };
  const [drugs, setDrugs] = useState([{ ...defaultDrug }]);

  useEffect(() => {
    if (id) {
      loadDetails();
      loadPrescriptions();
    }
  }, [id]);

  const loadDetails = async () => {
    try {
      const data = await PatientService.getHistory(id as string);
      setPatient(data);
    } catch (e) { }
  };

  const loadPrescriptions = async () => {
    try {
      const data = await PrescriptionService.getHistory(id as string);
      setPrescriptions(data);
    } catch (e) { }
  };

  const handlePrescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = drugs.map((drug) => {
        const { mealTiming, ...rest } = drug;
        return {
          ...rest,
          patientId: id as string,
          ...(mealTiming ? { mealTiming } : {}),
        };
      });
      
      await PrescriptionService.bulkCreate(payload);
      
      setShowModal(false);
      setDrugs([{ ...defaultDrug }]);
      loadPrescriptions();
    } catch (err) {
      alert('Failed to prescribe medication.');
    }
  };

  if (!patient) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div className="animate-fade-in">
      <Link to="/dashboard/patients" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Patients
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem' }}>{patient.firstName} {patient.lastName}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>Phone: {patient.phone} • Notification: {patient.notificationMedium}</p>
          {patient.allergies && <p style={{ color: 'var(--error)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Allergies: {patient.allergies}</p>}
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Pill size={18} /> Prescribe Drug
        </button>
      </div>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarClock color="var(--primary)" /> Prescription History
        </h2>

        {prescriptions.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No active or past prescriptions found.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {prescriptions.map(pr => (
              <div key={pr.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--primary-hover)' }}>{pr.medication}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {new Date(pr.startDate).toLocaleDateString()} - {new Date(pr.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <p style={{ color: 'var(--foreground)' }}>Dosage: {pr.dosage}</p>
                  <p style={{ color: 'var(--muted)' }}>Frequency: {pr.frequency}</p>
                  {pr.mealTiming && (
                    <p style={{ color: 'var(--primary)', fontWeight: 500 }}>
                      Timing: {pr.mealTiming === 'BEFORE_MEAL' ? 'Before Meal' : 'After Meal'}
                    </p>
                  )}
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Prescribed on: {new Date(pr.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', background: 'var(--background)' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Prescribe Medication(s)</h2>
            <form onSubmit={handlePrescribe}>
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {drugs.map((drug, index) => (
                  <div key={index} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', position: 'relative' }}>
                    {drugs.length > 1 && (
                      <button type="button" onClick={() => setDrugs(drugs.filter((_, i) => i !== index))} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'var(--surface-hover)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}

                    <div className="input-group">
                      <label>Medication Name</label>
                      <input type="text" list={`medication-options-${index}`} className="input-control" required value={drug.medication} onChange={e => { const newDrugs = [...drugs]; newDrugs[index].medication = e.target.value; setDrugs(newDrugs); }} placeholder="e.g. Lisinopril 10mg" />
                      <datalist id={`medication-options-${index}`}>
                        <option value="Amoxicillin 500mg" />
                        <option value="Paracetamol 500mg" />
                        <option value="Ibuprofen 400mg" />
                        <option value="Lisinopril 10mg" />
                        <option value="Metformin 500mg" />
                        <option value="Amlodipine 5mg" />
                        <option value="Omeprazole 20mg" />
                        <option value="Losartan 50mg" />
                        <option value="Azithromycin 250mg" />
                        <option value="Vitamin C 1000mg" />
                        <option value="Atorvastatin 20mg" />
                        <option value="Metoprolol 50mg" />
                        <option value="Levothyroxine 50mcg" />
                        <option value="Amoxicillin/Clavulanate (Augmentin)" />
                        <option value="Fluoxetine 20mg" />
                      </datalist>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="input-group">
                        <label>Dosage</label>
                        <input type="text" list={`dosage-options-${index}`} className="input-control" required value={drug.dosage} onChange={e => { const newDrugs = [...drugs]; newDrugs[index].dosage = e.target.value; setDrugs(newDrugs); }} placeholder="e.g. 1 Tablet" />
                        <datalist id={`dosage-options-${index}`}>
                          <option value="1 Tablet" />
                          <option value="2 Tablets" />
                          <option value="1/2 Tablet" />
                          <option value="1 Capsule" />
                          <option value="5 ml" />
                          <option value="10 ml" />
                          <option value="1 Drop" />
                          <option value="2 Drops" />
                          <option value="Apply topically" />
                          <option value="1 Puff" />
                          <option value="2 Puffs" />
                        </datalist>
                      </div>
                      <div className="input-group">
                        <label>Frequency</label>
                        <select className="input-control" required value={drug.frequency} onChange={e => { const newDrugs = [...drugs]; newDrugs[index].frequency = e.target.value; setDrugs(newDrugs); }}>
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="3 times daily">3 times daily</option>
                          <option value="4 times daily">4 times daily</option>
                          <option value="Every 4 hours">Every 4 hours</option>
                          <option value="Every 6 hours">Every 6 hours</option>
                          <option value="Every 8 hours">Every 8 hours</option>
                          <option value="Weekly">Weekly</option>
                          <option value="As needed (PRN)">As needed (PRN)</option>
                        </select>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Meal Timing (Optional)</label>
                      <select className="input-control" value={drug.mealTiming} onChange={e => { const newDrugs = [...drugs]; newDrugs[index].mealTiming = e.target.value; setDrugs(newDrugs); }}>
                        <option value="">N/A</option>
                        <option value="BEFORE_MEAL">Before Meal</option>
                        <option value="AFTER_MEAL">After Meal</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Start Date</label>
                        <input type="date" className="input-control" required value={drug.startDate} onChange={e => { const newDrugs = [...drugs]; newDrugs[index].startDate = e.target.value; setDrugs(newDrugs); }} />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>End Date</label>
                        <input type="date" className="input-control" required value={drug.endDate} onChange={e => { const newDrugs = [...drugs]; newDrugs[index].endDate = e.target.value; setDrugs(newDrugs); }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => setDrugs([...drugs, { ...defaultDrug }])} className="btn btn-outline" style={{ marginTop: '0.5rem', width: '100%', borderStyle: 'dashed' }}>
                <Plus size={16} /> Add Another Drug
              </button>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Prescription</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
