import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driverAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const STEPS = ['Personal', 'Vehicle', 'Documents', 'Review'];

const VEHICLE_TYPES = [
  { id:'bike',  emoji:'🏍️', label:'Bike'  },
  { id:'auto',  emoji:'🛺', label:'Auto'  },
  { id:'mini',  emoji:'🚗', label:'Mini'  },
  { id:'sedan', emoji:'🚙', label:'Sedan' },
  { id:'suv',   emoji:'🚐', label:'SUV'   },
];

const DriverRegister = () => {
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({
    name: '', phone: '', email: '',
    vehicleType: '', make: '', model: '', year: '', plateNumber: '', color: '',
    licenseNumber: '', aadhaarNumber: '',
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await driverAPI.register(form);
      toast.success('Registration submitted! We\'ll review and approve within 24 hours.');
      navigate('/auth/login?role=driver');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const Input = ({ label, field, placeholder, type = 'text', ...props }) => (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">{label}</label>
      <input
        type={type}
        className="input-field"
        placeholder={placeholder}
        value={form[field]}
        onChange={(e) => update(field, e.target.value)}
        {...props}
      />
    </div>
  );

  const steps = [
    // Step 0: Personal
    <div key="personal" className="space-y-4 animate-fade-up">
      <Input label="Full Name"    field="name"  placeholder="Rahul Kumar" />
      <Input label="Phone Number" field="phone" placeholder="+91 98765 43210" type="tel" />
      <Input label="Email"        field="email" placeholder="rahul@email.com" type="email" />
    </div>,

    // Step 1: Vehicle
    <div key="vehicle" className="space-y-4 animate-fade-up">
      <div>
        <label className="block text-xs text-white/40 uppercase tracking-widest mb-3">Vehicle Type</label>
        <div className="grid grid-cols-5 gap-2">
          {VEHICLE_TYPES.map((v) => (
            <button key={v.id} onClick={() => update('vehicleType', v.id)}
              className={`p-3 rounded-2xl border-2 text-center transition-all active:scale-95
                ${form.vehicleType === v.id
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                }`}>
              <div className="text-2xl mb-1">{v.emoji}</div>
              <div className="text-[10px] text-white/60">{v.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Make"  field="make"  placeholder="Maruti" />
        <Input label="Model" field="model" placeholder="Alto" />
        <Input label="Year"  field="year"  placeholder="2022" type="number" />
        <Input label="Color" field="color" placeholder="White" />
      </div>
      <Input label="Number Plate" field="plateNumber" placeholder="KA01AB1234" />
    </div>,

    // Step 2: Documents
    <div key="docs" className="space-y-4 animate-fade-up">
      <Input label="Driving License Number" field="licenseNumber" placeholder="KA0120230012345" />
      <Input label="Aadhaar Number"         field="aadhaarNumber" placeholder="XXXX XXXX XXXX" />
      <div className="card-glass p-4 border-dashed">
        <p className="text-xs text-white/40 text-center">
          📎 Document uploads can be completed after account approval via the driver app.
        </p>
      </div>
    </div>,

    // Step 3: Review
    <div key="review" className="space-y-4 animate-fade-up">
      {[
        { label: 'Name',         value: form.name                                                  },
        { label: 'Phone',        value: form.phone                                                 },
        { label: 'Vehicle',      value: form.vehicleType + ' · ' + form.make + ' ' + form.model   },
        { label: 'Plate Number', value: form.plateNumber                                           },
        { label: 'License',      value: form.licenseNumber                                         },
      ].map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between py-3 border-b border-white/[0.06]">
          <span className="text-white/40 text-sm">{label}</span>
          <span className="text-white font-medium text-sm">{value || '—'}</span>
        </div>
      ))}
      <div className="card-glass p-4 mt-4">
        <p className="text-xs text-white/50 text-center leading-relaxed">
          By submitting, you agree to Thara Ride's driver terms. Your account will be reviewed within 24 hours.
        </p>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/8 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-12 pb-4 bg-dark-800/60 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => step === 0 ? navigate(-1) : setStep(step - 1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
              <ChevronLeft size={20} className="text-white/60" />
            </button>
            <div>
              <h1 className="font-display font-bold text-xl text-white">Driver Registration</h1>
              <p className="text-white/40 text-xs">Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-emerald-500' : 'bg-white/10'}`} />
                <p className={`text-[10px] mt-1 text-center ${i === step ? 'text-emerald-400' : 'text-white/20'}`}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative z-10 max-w-md mx-auto w-full px-4 py-6">
        {steps[step]}
      </div>

      {/* Footer */}
      <div className="relative z-10 max-w-md mx-auto w-full px-4 pb-8">
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
              bg-emerald-500 hover:bg-emerald-600 text-white font-bold
              shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.97]">
            Continue <ChevronRight size={18} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
              bg-emerald-500 hover:bg-emerald-600 text-white font-bold
              shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.97] disabled:opacity-50">
            {loading
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Check size={18} /> Submit Application</>
            }
          </button>
        )}
      </div>
    </div>
  );
};

export default DriverRegister;