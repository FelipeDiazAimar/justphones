// Debug script para probar la funcionalidad de WhatsApp en móviles
// Ejecutar en DevTools console del navegador

console.log('🔍 DEBUGGING MOBILE WHATSAPP FUNCTIONALITY');

// Detectar si es móvil
const isMobile = window.innerWidth < 768;
console.log('📱 Is Mobile:', isMobile);
console.log('📱 User Agent:', navigator.userAgent);
console.log('📱 Window dimensions:', { width: window.innerWidth, height: window.innerHeight });

// Test URL de WhatsApp
const phoneNumber = '5493564338599';
const testMessage = 'Test desde debug script';
const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(testMessage)}`;

console.log('🔗 WhatsApp URL:', whatsappUrl);

// Función para probar diferentes métodos de apertura
function testWhatsAppMethods() {
    console.log('🧪 Probando método 1: window.open');
    try {
        const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow || newWindow.closed) {
            console.log('❌ Método 1 falló - popup bloqueado');
        } else {
            console.log('✅ Método 1 exitoso');
            newWindow.close(); // Cerrar para no spam
        }
    } catch (e) {
        console.error('❌ Error método 1:', e);
    }
    
    setTimeout(() => {
        console.log('🧪 Probando método 2: elemento <a> temporal');
        try {
            const link = document.createElement('a');
            link.href = whatsappUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('✅ Método 2 ejecutado');
        } catch (e) {
            console.error('❌ Error método 2:', e);
        }
    }, 2000);
    
    setTimeout(() => {
        console.log('🧪 Probando método 3: location.href (CUIDADO: cambiará la página)');
        console.log('⚠️ Comentado para evitar cambio de página accidental');
        // window.location.href = whatsappUrl;
    }, 4000);
}

// Función para probar eventos touch en móviles
function testTouchEvents() {
    if (isMobile) {
        console.log('📱 Probando eventos touch...');
        
        // Simular touch event
        const testButton = document.querySelector('button');
        if (testButton) {
            console.log('🔘 Botón encontrado para prueba:', testButton);
            
            // Agregar listeners temporales
            testButton.addEventListener('touchstart', () => console.log('👆 TouchStart detectado'));
            testButton.addEventListener('touchend', () => console.log('👆 TouchEnd detectado'));
            testButton.addEventListener('click', () => console.log('👆 Click detectado'));
        }
    }
}

console.log('🚀 Ejecutar testWhatsAppMethods() para probar métodos de apertura');
console.log('🚀 Ejecutar testTouchEvents() para probar eventos touch');

// Auto-ejecutar tests básicos
testTouchEvents();
