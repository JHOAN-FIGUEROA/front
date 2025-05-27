import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos en milisegundos
//const INACTIVITY_TIME = 1 * 60 * 1000; // 2 minutos en milisegundos para prueba

export const useInactivityTimer = () => {
    const navigate = useNavigate();
    const timerRef = useRef(null); // Inicializar con null

    const hookLogoutUser = useCallback(() => {
        console.log('Sesión cerrada por inactividad (hook).');
        // Opcional: Mostrar un mensaje al usuario
        Swal.fire({
            icon: 'warning',
            title: 'Sesión Expirada',
            text: 'Tu sesión se ha cerrado por inactividad.',
            confirmButtonColor: '#2E8B57',
            background: '#fff',
            customClass: {
              popup: 'animated fadeInDown'
            }
          });
        // Limpiar datos de sesión del almacenamiento local
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirigir al login
        navigate('/login');
    }, [navigate]);


    const hookResetTimer = useCallback(() => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(hookLogoutUser, INACTIVITY_TIME);
    }, [hookLogoutUser]);


    useEffect(() => {
        // Configurar event listeners al montar
        const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, hookResetTimer);
        });

        // Iniciar el primer temporizador
        hookResetTimer();

        // Limpiar event listeners y temporizador al desmontar
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, hookResetTimer);
            });
            clearTimeout(timerRef.current);
        };
    }, [hookResetTimer]); // Dependencia hookResetTimer

    // El hook no necesita retornar nada si solo gestiona un efecto secundario
}; 