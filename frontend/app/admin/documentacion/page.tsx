'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Settings, 
  Users, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Smartphone, 
  Target,
  Network,
  Cloud,
  Fingerprint,
  CalendarDays,
  LayoutDashboard,
  BarChart3,
  Coins,
  CheckCircle2,
  Activity,
  UserCircle
} from 'lucide-react';
import Image from 'next/image';
import Mermaid from '@/components/mermaid';

export default function DocumentacionPage() {
  const [activeTab, setActiveTab] = useState('tecnica');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-900 text-white p-10 md:p-14 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 opacity-20 blur-[120px] -mr-48 -mt-48" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xl border border-white/20 shadow-inner">
            <BookOpen className="h-10 w-10 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Portal de Documentación</h1>
            <p className="text-indigo-200 text-sm md:text-base font-light opacity-80 mt-1">
              Guía técnica, operativa y de gestión del Sistema de Control de Accesos Biométrico.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="tecnica" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-10 h-16 bg-slate-100 p-2 rounded-[1.5rem] shadow-inner gap-2">
          <TabsTrigger value="tecnica" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg flex gap-3 transition-all font-bold">
            <Cpu className="h-4 w-4" /> 1. Documentación Técnica
          </TabsTrigger>
          <TabsTrigger value="general" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg flex gap-3 transition-all font-bold">
            <BarChart3 className="h-4 w-4" /> 2. Documentación General
          </TabsTrigger>
          <TabsTrigger value="usuario" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg flex gap-3 transition-all font-bold">
            <Smartphone className="h-4 w-4" /> 3. Manual de Usuario
          </TabsTrigger>
        </TabsList>

        {/* --- SECCIÓN 1: DOCUMENTACIÓN TÉCNICA --- */}
        <TabsContent value="tecnica" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">
          <section className="space-y-8">
            <div className="flex items-center gap-3 border-l-4 border-indigo-600 pl-4">
              <h2 className="text-2xl font-bold text-slate-900">Arquitectura y Lógica del Sistema</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl bg-white rounded-3xl p-8 overflow-hidden">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Network className="h-5 w-5 text-indigo-600" /> Vista Lógica en Capas
                  </CardTitle>
                </CardHeader>
                <Mermaid chart={`
graph TD
    subgraph PRESENTACION ["Capa de Presentación"]
        PWA["PWA (Tablet/Móvil)"]
        ADMIN["Panel Admin Web"]
    end
    subgraph APLICACION ["Capa de Aplicación"]
        API["API REST (Django DRF)"]
        AUTH["Auth JWT"]
    end
    subgraph NEGOCIO ["Capa de Dominio"]
        DECISION["Motor de Decisión"]
        LOGICA["Validación de Permisos"]
    end
    PRESENTACION --> API
    API --> AUTH
    AUTH --> LOGICA
    LOGICA --> DECISION
                `} />
              </Card>

              <Card className="border-none shadow-xl bg-slate-900 rounded-3xl p-8 text-white overflow-hidden">
                <CardHeader className="p-0 mb-6 text-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-indigo-400" /> Infraestructura Cloud (Azure)
                  </CardTitle>
                </CardHeader>
                <Mermaid chart={`
graph LR
    subgraph EDGE ["Local"]
        Tablet["Tablet UI"]
    end
    subgraph AZURE ["Azure Services"]
        App["Web App API"]
        Face["AI Face API"]
        DB["PostgreSQL"]
        Storage["Blob Storage"]
    end
    Tablet -- Request --> App
    App -- Identificar --> Face
    App -- Datos --> DB
    App -- Imágenes --> Storage
                `} />
              </Card>
            </div>
          </section>

          <section className="space-y-8">
             <div className="flex items-center gap-3 border-l-4 border-indigo-600 pl-4">
               <h2 className="text-2xl font-bold text-slate-900">Diagrama de Base de Datos (ERD)</h2>
             </div>
             <Card className="border-none shadow-2xl bg-white rounded-[2rem] p-10 overflow-x-auto">
               <Mermaid chart={`
erDiagram
    USUARIO {
        uuid id PK
        string nombre
        string email
        boolean is_active
    }
    ROL {
        uuid id PK
        string name
    }
    BIOMETRIA {
        uuid id PK
        string face_id
    }
    AULA {
        uuid id PK
        string code
    }
    PERMISO_ACCESO {
        uuid id PK
        uuid user_id FK
        uuid aula_id FK
    }
    ACCESO_EVENTO {
        uuid id PK
        datetime timestamp
        string result
    }
    USUARIO ||--o{ BIOMETRIA : "asocia"
    USUARIO ||--o{ USUARIO_ROL : "tiene"
    ROL ||--o{ USUARIO_ROL : "define"
    USUARIO ||--o{ PERMISO_ACCESO : "recibe"
    AULA ||--o{ PERMISO_ACCESO : "controla"
    USUARIO ||--o{ ACCESO_EVENTO : "genera"
               `} />
             </Card>
             <div className="bg-slate-50 p-6 rounded-2xl text-xs text-slate-500">
               <strong>Nota Técnica:</strong> La base de datos está normalizada bajo estándares institucionales, utilizando UUIDs como llaves primarias para garantizar la escalabilidad y seguridad de los datos.
             </div>
          </section>
        </TabsContent>

        {/* --- SECCIÓN 2: DOCUMENTACIÓN GENERAL --- */}
        <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="border-none shadow-xl bg-indigo-600 text-white p-10 rounded-[2.5rem]">
               <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                 <Target className="h-6 w-6 text-indigo-300" /> Objetivos Generales
               </h3>
               <ul className="space-y-4 font-light opacity-90">
                 <li className="flex gap-3 items-start leading-relaxed">
                   <CheckCircle2 className="h-5 w-5 text-indigo-300 mt-1 shrink-0" />
                   <span>Automatización del control de acceso institucional para eliminar métodos manuales.</span>
                 </li>
                 <li className="flex gap-3 items-start leading-relaxed">
                   <CheckCircle2 className="h-5 w-5 text-indigo-300 mt-1 shrink-0" />
                   <span>Incrementar la seguridad mediante validación biométrica facial de alta precisión (Azure AI Face).</span>
                 </li>
                 <li className="flex gap-3 items-start leading-relaxed">
                   <CheckCircle2 className="h-5 w-5 text-indigo-300 mt-1 shrink-0" />
                   <span>Generar una bitácora digital inmutable de eventos para auditoría institucional.</span>
                 </li>
               </ul>
            </Card>

            <Card className="border-none shadow-xl bg-white p-10 rounded-[2.5rem] border border-slate-100">
               <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                 <ShieldCheck className="h-6 w-6 text-indigo-600" /> Análisis de Factibilidad
               </h3>
               <div className="space-y-6">
                 <div>
                   <h4 className="font-bold text-slate-800 text-sm">Operativa</h4>
                   <p className="text-xs text-slate-500">Sistema diseñado para docentes y administradores con curva de aprendizaje mínima.</p>
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 text-sm">Técnica</h4>
                   <p className="text-xs text-slate-500">Basado en infraestructura Azure (SaaS/PaaS) con escalabilidad inmediata.</p>
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 text-sm text-green-600">Económica</h4>
                   <p className="text-xs text-slate-500">Optimización de costos mediante el uso de hardware local accesible (Tablets/RPi).</p>
                 </div>
               </div>
            </Card>
          </section>

          <section className="space-y-8">
            <h3 className="text-2xl font-bold text-center">Desglose de Inversión (Aula Piloto)</h3>
            <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-xl bg-white">
              <table className="w-full">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-8 py-5 text-left">Componente</th>
                    <th className="px-8 py-5 text-right">Costo Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {[
                    { item: 'Hardware (Tablet + Lock)', cost: '$700' },
                    { item: 'Software y Desarrollo', cost: '$5,425' },
                    { item: 'Operación y Nube (Anual)', cost: '$1,264' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-8 py-5 font-bold text-slate-800">{row.item}</td>
                      <td className="px-8 py-5 text-right font-black text-indigo-600">{row.cost}</td>
                    </tr>
                  ))}
                  <tr className="bg-indigo-600 text-white font-bold">
                    <td className="px-8 py-6 text-lg uppercase">Total Proyecto Piloto</td>
                    <td className="px-8 py-6 text-right text-3xl">$7,389</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>

        {/* --- SECCIÓN 3: MANUAL DE USUARIO --- */}
        <TabsContent value="usuario" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-20">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">Gestión del Administrador</h2>
              <div className="space-y-6">
                 {[
                   { t: 'Gestión de Perfiles', i: Users, d: 'Permite registrar nuevos usuarios con DUI y correo institucional.' },
                   { t: 'Enrolamiento Biométrico', i: Fingerprint, d: 'Captura del rostro del docente para su registro en la nube.' },
                   { t: 'Control de Aulas', i: LayoutDashboard, d: 'Asignación de roles y horarios específicos para cada puerta.' }
                 ].map((step, idx) => (
                   <div key={idx} className="flex gap-4 p-5 bg-white rounded-2xl shadow-sm border border-slate-50 border-l-4 border-l-indigo-600">
                     <step.i className="h-6 w-6 text-indigo-600 shrink-0" />
                     <div>
                       <h5 className="font-bold text-slate-900 text-sm">{step.t}</h5>
                       <p className="text-xs text-slate-500">{step.d}</p>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
              <Image src="/docs/admin_dashboard.png" alt="Admin UI" width={800} height={500} />
            </div>
          </section>

          <Card className="bg-slate-900 rounded-[3rem] p-12 text-white overflow-hidden">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
               <div className="flex justify-center order-2 lg:order-1">
                 <Image src="/docs/biometric_access.png" alt="Tablet View" width={500} height={350} className="rounded-2xl shadow-2xl brightness-75 hover:brightness-100 transition-all cursor-crosshair" />
               </div>
               <div className="space-y-8 order-1 lg:order-2">
                 <h3 className="text-3xl font-bold flex items-center gap-3">Terminal Tablet (Acceso)</h3>
                 <p className="text-slate-400 font-light leading-relaxed">
                   La interfaz en el aula está diseñada para una interacción rápida (menos de 3 segundos). Muestra feedback visual (Verde/Éxito, Rojo/Denegado) y permite el respaldo por código dinámico.
                 </p>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                     <h6 className="font-bold text-xs text-indigo-400 mb-1">Paso 1</h6>
                     <p className="text-[10px] text-slate-500">Posicionarse frente a la cámara.</p>
                   </div>
                   <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                     <h6 className="font-bold text-xs text-indigo-400 mb-1">Paso 2</h6>
                     <p className="text-[10px] text-slate-500">Ingresar OTP si la biometría falla.</p>
                   </div>
                 </div>
               </div>
             </div>
          </Card>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900">Portal del Docente (PWA)</h2>
              <p className="text-slate-600 leading-relaxed font-light italic">
                 "Optimizado para que el docente tenga el control de su acceso y horarios en la palma de su mano, incluso sin conexión a internet estable mediante service workers."
              </p>
              <div className="flex gap-4">
                <div className="bg-slate-100 p-4 rounded-3xl h-fit border border-slate-200">
                  <UserCircle className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800">Generación de OTP</h5>
                  <p className="text-xs text-slate-500">Permite generar códigos temporales de 6 dígitos con validez de 120 segundos para contingencia.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
               <Image src="/docs/docente_pwa.png" alt="PWA View" width={300} height={600} className="rounded-[3rem] shadow-2xl border-4 border-white" />
            </div>
          </section>
        </TabsContent>
      </Tabs>

      {/* Footer Final */}
      <footer className="mt-16 text-center text-slate-300 text-[10px] font-bold tracking-[0.4em] uppercase py-10 opacity-30">
        Control Biométrico Institucional — ITCA-FEPADE 2026
      </footer>
    </div>
  );
}
