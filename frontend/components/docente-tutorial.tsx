'use client';

import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

const TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="user-profile"]',
    content: 'Desde aquí puedes ver tu rol activo e información básica.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="today-summary"]',
    content: 'Aquí verás un resumen rápido de las clases o accesos que tienes asignados para hoy.',
  },
  {
    target: '[data-tour="weekly-schedule"]',
    content: 'Revisa tu matriz de horarios de toda la semana. Cada color representa un aula distinta.',
  },
  {
    target: '[data-tour="otp-section"]',
    content: 'Aquí encontrarás herramientas como la generación de un código QR (OTP) para abrir puertas en caso de emergencia.',
  },
];

export function DocenteTutorial() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check if the user has seen the tutorial before
    const hasSeenTutorial = localStorage.getItem('docente-tutorial-seen');
    if (!hasSeenTutorial) {
      // Small delay to ensure the page has loaded visually before popping standard dialog
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartTour = () => {
    setShowWelcome(false);
    setRunTour(true);
  };

  const handleSkipTour = () => {
    localStorage.setItem('docente-tutorial-seen', 'true');
    setShowWelcome(false);
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('docente-tutorial-seen', 'true');
    }
  };

  if (!isMounted) return null;

  return (
    <>
      <Dialog open={showWelcome} onOpenChange={(open) => {
        if (!open) handleSkipTour();
      }}>
        <DialogContent className="sm:max-w-md bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-blue-400" />
              ¡Bienvenido a tu Panel!
            </DialogTitle>
            <DialogDescription className="text-slate-400 pt-2 text-base">
              Es la primera vez que ingresas. Hemos preparado un recorrido rápido de 1 minuto para mostrarte cómo funciona todo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 mt-6">
            <Button 
              onClick={handleStartTour} 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 text-lg rounded-xl shadow-lg shadow-blue-500/20"
            >
              Hacer tutorial ahora
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSkipTour}
              className="w-full border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Omitir por ahora
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Joyride
        steps={TOUR_STEPS}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        locale={{
          back: 'Atrás',
          close: 'Cerrar',
          last: 'Finalizar',
          next: 'Siguiente',
          skip: 'Omitir',
        }}
        styles={{
          options: {
            arrowColor: '#1e293b', // slate-800
            backgroundColor: '#1e293b',
            overlayColor: 'rgba(0, 0, 0, 0.7)',
            primaryColor: '#3b82f6', // blue-500
            textColor: '#f8fafc', // slate-50
            zIndex: 1000,
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          buttonNext: {
            backgroundColor: '#2563eb', // blue-600
            borderRadius: '8px',
          },
          buttonBack: {
            color: '#94a3b8', // slate-400
          },
          buttonSkip: {
            color: '#64748b', // slate-500
          }
        }}
      />
    </>
  );
}
