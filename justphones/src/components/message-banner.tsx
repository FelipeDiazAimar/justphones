'use client';

import React from 'react';

export function MessageBanner() {
  return (
    <div className="relative mb-6">
      <div className="message-banner py-2 overflow-hidden absolute inset-x-0 w-full max-w-full">
        <div className="relative h-6 flex items-center justify-center">
          <div className="message-item absolute inset-0 flex items-center justify-center w-full">
            <span className="text-bright-white font-sf-pro font-medium text-xs md:text-sm text-center px-4 max-w-full truncate">
              GARANTIA DE 30 DIAS EN TODAS TUS COMPRAS
            </span>
          </div>
          <div className="message-item absolute inset-0 flex items-center justify-center w-full">
            <span className="text-bright-white font-sf-pro font-medium text-xs md:text-sm text-center px-4 max-w-full truncate">
              ENVIOS GRATIS EN FREYRE + 3 CUOTAS SIN INTERES + 20% OFF CON TRANSFERENCIA
            </span>
          </div>
          <div className="message-item absolute inset-0 flex items-center justify-center w-full">
            <span className="text-bright-white font-sf-pro font-medium text-xs md:text-sm text-center px-4 max-w-full truncate">
              ENVIOS EN EL DIA A SAN FRANCISCO Y FREYRE
            </span>
          </div>
        </div>
      </div>
      <div className="h-8"></div>
    </div>
  );
}
