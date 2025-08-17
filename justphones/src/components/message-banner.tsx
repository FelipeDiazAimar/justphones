'use client';

import React from 'react';

export function MessageBanner() {
  return (
    <div className="relative mb-6">
      <div className="message-banner py-2 overflow-hidden absolute left-1/2 transform -translate-x-1/2 w-screen">
        <div className="relative h-6 flex items-center justify-center">
          <div className="message-item absolute inset-0 flex items-center justify-center w-full">
            <span className="text-bright-white font-sf-pro font-medium text-xs md:text-sm text-center px-4">
              GARANTIA DE 30 DIAS EN TODAS TUS COMPRAS
            </span>
          </div>
          <div className="message-item absolute inset-0 flex items-center justify-center w-full">
            <span className="text-bright-white font-sf-pro font-medium text-xs md:text-sm text-center px-4">
              ENVIOS GRATIS EN FREYRE + 3 CUOTAS SIN INTERES + 20% OFF CON TRANSFERENCIA
            </span>
          </div>
          <div className="message-item absolute inset-0 flex items-center justify-center w-full">
            <span className="text-bright-white font-sf-pro font-medium text-xs md:text-sm text-center px-4">
              ENVIOS EN EL DIA A SAN FRANCISCO Y FREYRE
            </span>
          </div>
        </div>
      </div>
      <div className="h-8"></div>
    </div>
  );
}
