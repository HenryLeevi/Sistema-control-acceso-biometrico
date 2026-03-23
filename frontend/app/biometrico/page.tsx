'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Phone, Shield, RefreshCw, CheckCircle, XCircle, AlertCircle, Fingerprint, Hash, Key, DoorOpen, DoorClosed } from 'lucide-react';
import { RoleGuard } from '@/components/role-guard';
import { useAulas, useValidateAccess } from '@/lib/api-hooks';
import { useDeviceStatus } from '@/hooks/use-device-status';

type AuthStage = 'biometrico' | 'pin' | 'otp' | 'exito' | 'denegado';
type BiometricStatus = 'scanning' | 'detected' | 'validating' | 'success' | 'fail' | 'not_detected';

const AUDITORIA_AULA = '-';
const SOPORTE_TELEFONO = '+503 7111-2300';

function BiometricoContent() {
  const { toast } = useToast();
  const { data: aulasData, refetch: refetchAulas } = useAulas();
  const validateAccess = useValidateAccess();
  
  const currentAula = aulasData?.results?.[0] as any;
  const currentAulaId = currentAula?.id || '00000000-0000-0000-0000-000000000000';
  const deviceStatus = useDeviceStatus(currentAula?.device_id);

  // Sync with WebSocket for instant updates
  useEffect(() => {
    if (deviceStatus) {
      refetchAulas();
    }
  }, [deviceStatus, refetchAulas]);

  const [stage, setStage] = useState<AuthStage>('biometrico');
  const [bioStatus, setBioStatus] = useState<BiometricStatus>('scanning');
  const [bioIntentos, setBioIntentos] = useState(0);
  const [pinIntentos, setPinIntentos] = useState(0);
  const [pinValue, setPinValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [showSupport, setShowSupport] = useState(false);
  const [authUserNombre, setAuthUserNombre] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isValidatingRef = useRef(false);

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast({ title: 'Error de cámara', description: 'No se pudo acceder a la cámara.', variant: 'destructive' });
      setBioStatus('fail');
    }
  };

  // Attempt Face Validation
  const captureAndValidate = async () => {
    if (isValidatingRef.current || !videoRef.current || !canvasRef.current || !currentAulaId || currentAulaId === '00000000-0000-0000-0000-000000000000') return;
    
    isValidatingRef.current = true;
    setBioStatus('validating');
    
    // Draw to canvas and get base64
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64Data = dataUrl.split(',')[1];
    
    try {
      const res = await validateAccess.mutateAsync({
        method: 'FACE',
        data: base64Data,
        aula_id: currentAulaId
      });
      
      if (res.result === 'SUCCESS') {
        setBioStatus('success');
        setAuthUserNombre(res.user_full_name || 'Usuario');
        // Refresh aula state to show it opening
        setTimeout(() => refetchAulas(), 500);
        setTimeout(() => setStage('exito'), 1000);
      } else {
        handleBioFail(res.reason || 'Rostro no verificado');
      }
    } catch (err) {
      console.error(err);
      handleBioFail('Error de red al validar rostro');
    } finally {
      isValidatingRef.current = false;
    }
  };

  const handleBioFail = (msg: string) => {
    const intento = bioIntentos + 1;
    setBioIntentos(intento);
    
    if (intento >= 3) {
      setBioStatus('fail');
      toast({ title: '🔒 Biometría fallida', description: 'Demasiados intentos. Usa tu PIN.', variant: 'destructive' });
      setTimeout(() => setStage('pin'), 1500);
    } else {
      setBioStatus('not_detected');
      toast({ title: '⚠️ Fallo', description: `${msg} (Intento ${intento}/3)` });
    }
  };

  // Effect to manage camera and scan interval
  useEffect(() => {
    if (stage === 'biometrico') {
      startCamera();
      
      // Auto-scan every 4 seconds if scanning or not detected
      scanIntervalRef.current = setInterval(() => {
        setBioStatus(prev => {
          if (prev === 'scanning' || prev === 'not_detected') {
            captureAndValidate();
            return 'validating';
          }
          return prev;
        });
      }, 4000);
      
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [stage, currentAulaId, bioIntentos]);

  // Visual scan progress animation
  useEffect(() => {
    if (stage === 'biometrico' && bioStatus === 'scanning') {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress(prev => (prev >= 100 ? 0 : prev + 2));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [stage, bioStatus]);

  const handleBioRetry = () => {
    setBioStatus('scanning');
    setScanProgress(0);
  };

  const handlePinKey = (key: string) => {
    if (key === 'DEL') {
      setPinValue(prev => prev.slice(0, -1));
    } else if (pinValue.length < 6) {
      setPinValue(prev => prev + key);
    }
  };

  const handlePinSubmit = async () => {
    if (isValidatingRef.current || !currentAulaId || currentAulaId === '00000000-0000-0000-0000-000000000000') {
      return;
    }
    
    isValidatingRef.current = true;
    const intento = pinIntentos + 1;
    
    try {
      const res = await validateAccess.mutateAsync({
        method: 'PIN',
        data: pinValue,
        aula_id: currentAulaId
      });
      
      if (res.result === 'SUCCESS') {
        setAuthUserNombre(res.user_full_name || 'Usuario');
        refetchAulas();
        setStage('exito');
      } else {
        setPinIntentos(intento);
        setPinValue('');
        if (intento >= 3) {
          toast({ title: '🔒 PIN bloqueado', description: 'Solicita un código OTP al docente.', variant: 'destructive' });
          setTimeout(() => setStage('otp'), 1500);
        } else {
          toast({ title: '❌ PIN incorrecto', description: `${res.reason} - Intento ${intento}/3`, variant: 'destructive' });
        }
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'No se pudo validar el PIN', variant: 'destructive' });
    } finally {
      isValidatingRef.current = false;
    }
  };

  const handleOTPSubmit = async () => {
    if (otpValue.length === 6) {
      isValidatingRef.current = true;
      try {
        const res = await validateAccess.mutateAsync({
          method: 'OTP',
          data: otpValue,
          aula_id: currentAulaId
        });
        
        if (res.result === 'SUCCESS') {
          setStage('exito');
        } else {
          toast({ title: '❌ Código OTP incorrecto', description: res.reason, variant: 'destructive' });
          setOtpValue('');
        }
      } catch (err) {
        toast({ title: 'Error', description: 'No se pudo validar el OTP', variant: 'destructive' });
      } finally {
        isValidatingRef.current = false;
      }
    }
  };

  const handleReset = () => {
    setStage('biometrico');
    setBioStatus('scanning');
    setBioIntentos(0);
    setPinIntentos(0);
    setPinValue('');
    setOtpValue('');
    setScanProgress(0);
    setAuthUserNombre(null);
  };

  const pinPad = ['1','2','3','4','5','6','7','8','9','DEL','0','OK'];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden relative">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-sm border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Control de Acceso</p>
            <p className="text-sm font-semibold">{aulasData?.results?.[0]?.description || AUDITORIA_AULA}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Estado Puerta</p>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${
              currentAula?.actual_state === 'OPEN' 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}>
              {currentAula?.actual_state === 'OPEN' ? (
                <>
                  <DoorOpen className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">ABIERTA</span>
                </>
              ) : (
                <>
                  <DoorClosed className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">CERRADA</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
            <p className="text-sm font-mono font-bold text-blue-400">
              {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Stage Indicator */}
      <div className="flex justify-center gap-2 py-3 bg-black/20 z-10">
        {(['biometrico', 'pin', 'otp'] as AuthStage[]).map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full transition-all ${
              stage === s ? 'bg-blue-400 scale-125' :
              (['exito', 'denegado'].includes(stage) || i < (['biometrico','pin','otp'] as AuthStage[]).indexOf(stage))
                ? 'bg-green-500' : 'bg-white/20'
            }`} />
            <span className={`text-xs capitalize ${stage === s ? 'text-blue-300 font-medium' : 'text-white/30'}`}>
              {s === 'biometrico' ? 'Facial' : s === 'pin' ? 'PIN' : 'OTP'}
            </span>
            {i < 2 && <div className="w-4 h-px bg-white/10" />}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">

        {/* ========= BIOMÉTRICO ========= */}
        {stage === 'biometrico' && (
          <div className="w-full max-w-sm flex flex-col items-center gap-5">
            {/* Camera Viewfinder */}
            <div className="relative w-72 h-72 rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-2xl shadow-blue-500/20 bg-gray-900">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Face outline */}
                  <div className={`w-36 h-44 rounded-full border-4 transition-all duration-300 ${
                    bioStatus === 'scanning' ? 'border-blue-400/60 animate-pulse' :
                    bioStatus === 'validating' ? 'border-yellow-400 animate-pulse' :
                    bioStatus === 'success' ? 'border-green-400' :
                    bioStatus === 'not_detected' ? 'border-orange-400' :
                    'border-red-500'
                  }`} />
                  {/* Corner brackets */}
                  <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl" />
                  <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr" />
                  <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl" />
                  <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br" />
                </div>
              </div>
              
              {/* Scan line */}
              {bioStatus === 'scanning' && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-blue-400 shadow-lg shadow-blue-400/80 transition-all"
                  style={{ top: `${scanProgress}%` }}
                />
              )}
              {/* Overlay overlay */}
              <div className={`absolute inset-0 transition-opacity duration-500 ${
                bioStatus === 'success' ? 'bg-green-500/20 opacity-100' :
                bioStatus === 'fail' ? 'bg-red-500/20 opacity-100' :
                bioStatus === 'not_detected' ? 'bg-orange-500/20 opacity-100' :
                'opacity-0'
              }`} />
            </div>

            {/* Status Message */}
            <div className="text-center h-16">
              {bioStatus === 'scanning' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-blue-300">
                    <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-sm font-medium">Buscando rostro...</span>
                  </div>
                  <p className="text-xs text-gray-500">Mira directamente a la cámara</p>
                </div>
              )}
              {bioStatus === 'validating' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-yellow-300">
                    <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-yellow-400 animate-spin" />
                    <span className="text-sm font-medium">Validando con AWS...</span>
                  </div>
                </div>
              )}
              {bioStatus === 'fail' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Biometría no validada</span>
                  </div>
                  <p className="text-xs text-gray-500">Reintentando...</p>
                </div>
              )}
              {bioStatus === 'not_detected' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-orange-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">No se detectó un rostro</span>
                  </div>
                  <button onClick={handleBioRetry} className="mt-1 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                    <RefreshCw className="h-3.5 w-3.5" /> Reintentar
                  </button>
                </div>
              )}
            </div>
            {/* Switch to PIN only after failure or manual override if desired (user requested only after 3 fails) */}
            {bioIntentos >= 3 && (
              <button 
                onClick={() => {
                  stopCamera();
                  setStage('pin');
                }} 
                className="text-xs text-white/50 hover:text-white underline"
              >
                Acceder con PIN
              </button>
            )}
          </div>
        )}

        {/* ========= PIN ========= */}
        {stage === 'pin' && (
          <div className="w-full max-w-xs flex flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="h-14 w-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <Hash className="h-7 w-7 text-purple-400" />
              </div>
              <h2 className="text-lg font-bold">Ingresa tu PIN</h2>
              <p className="text-xs text-gray-400">Intento {pinIntentos + 1}/3</p>
            </div>

            <div className="h-6 text-xl tracking-widest font-mono text-white flex justify-center items-center gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-3 w-3 rounded-full border-2 transition-all duration-300 ${
                    i < pinValue.length 
                      ? 'bg-purple-500 border-purple-400 scale-110 shadow-[0_0_10px_rgba(168,85,247,0.5)]' 
                      : 'bg-white/5 border-white/10'
                  }`}
                />
              ))}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3 w-full">
              {pinPad.map((key) => (
                <button
                  key={key}
                  onClick={() => key === 'OK' ? handlePinSubmit() : handlePinKey(key)}
                  disabled={key === 'OK' && pinValue.length < 4}
                  className={`
                    h-14 rounded-xl font-semibold text-lg transition-all active:scale-95
                    ${key === 'OK'
                      ? 'bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white'
                      : key === 'DEL'
                      ? 'bg-white/10 hover:bg-white/20 text-gray-300 text-sm'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                    }
                  `}
                >
                  {key}
                </button>
              ))}
            </div>
            
            {bioIntentos < 3 && (
              <button onClick={() => setStage('biometrico')} className="text-xs text-white/50 hover:text-white underline mt-2">
                Volver a reconocimiento facial
              </button>
            )}
          </div>
        )}

        {/* ========= OTP ========= */}
        {stage === 'otp' && (
          <div className="w-full max-w-xs flex flex-col items-center gap-5 text-center">
            <div className="h-14 w-14 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
              <Key className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Código OTP</h2>
              <p className="text-sm text-gray-400 mt-1">Solicita el código al docente encargado</p>
            </div>

            <div className="w-full bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 text-left">
              <p className="text-xs text-amber-300 font-medium mb-1">📌 Instrucciones</p>
              <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                <li>Contacta al docente de esta aula</li>
                <li>El docente generará un código OTP</li>
                <li>Ingresa el código de 6 dígitos</li>
              </ol>
            </div>

            <input
              type="number"
              maxLength={6}
              placeholder="Código de 6 dígitos"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.slice(0, 6))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-400/60"
            />

            <button
              onClick={handleOTPSubmit}
              disabled={otpValue.length < 6}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed font-semibold transition-all active:scale-95"
            >
              Verificar OTP
            </button>
    
            {/* Only allow restart if NOT fully blocked */}
            {(bioIntentos < 3 || pinIntentos < 3) && (
              <button 
                onClick={handleReset} 
                className="text-xs text-white/50 hover:text-white underline"
              >
                Reiniciar terminal
              </button>
            )}
          </div>
        )}

        {/* ========= ÉXITO ========= */}
        {stage === 'exito' && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <div className="h-28 w-28 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center animate-bounce">
                <CheckCircle className="h-14 w-14 text-green-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-400">Acceso Permitido</h2>
              <p className="text-lg font-medium text-white mb-2">{authUserNombre}</p>
              <div className="flex items-center justify-center gap-2 text-blue-300 mt-2">
                <DoorOpen className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-semibold italic">Abriendo puerta...</span>
              </div>
              <p className="text-gray-400 mt-4">{currentAula?.description || AUDITORIA_AULA}</p>
            </div>
            <button
               onClick={handleReset}
               className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
             >
               <RefreshCw className="h-4 w-4" /> Nueva verificación
             </button>
          </div>
        )}

        {/* ========= DENEGADO ========= */}
        {stage === 'denegado' && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="h-28 w-28 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center">
              <XCircle className="h-14 w-14 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-400">Acceso Denegado</h2>
              <p className="text-gray-400 mt-1">Contacta al personal de seguridad</p>
            </div>
            <button
              onClick={handleReset}
              className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Reiniciar
            </button>
          </div>
        )}
      </div>

      {/* Footer - Soporte */}
      <div className="px-6 py-4 bg-black/40 backdrop-blur-sm border-t border-white/10 flex items-center justify-between z-10">
        <button
          onClick={() => setShowSupport(!showSupport)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <Phone className="h-4 w-4" />
          Contactar encargado
        </button>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          
        </div>
      </div>

      {/* Support Popup */}
      {showSupport && (
        <div className="absolute bottom-16 left-4 right-4 bg-gray-900 border border-white/20 rounded-2xl p-4 z-20 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Phone className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Soporte Técnico</p>
              <p className="text-lg font-mono font-bold text-blue-400 mt-0.5">{SOPORTE_TELEFONO}</p>
              <p className="text-xs text-gray-500 mt-1">Disponible Lun–Vie 07:00–20:00</p>
            </div>
            <button onClick={() => setShowSupport(false)} className="text-gray-500 hover:text-white text-lg leading-none">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccesoPage() {
  return (
    <RoleGuard allowedRoles={['BIOMETRICO']}>
      <BiometricoContent />
    </RoleGuard>
  );
}
