
'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminRootPage() {
  useEffect(() => {
    redirect('/admin/products');
  }, []);

  return (
    <div className="flex justify-center items-center h-64">
        <p>Redirigiendo al panel de productos...</p>
    </div>
  );
}
