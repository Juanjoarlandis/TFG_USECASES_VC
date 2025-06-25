/**
 * Utilidades de test reutilizables.
 * Incluye Provider de Redux y MemoryRouter por defecto.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import store from './store/store';

/* Re‑exportamos todo lo de Testing‑Library para comodidad */
export * from '@testing-library/react';

/**
 * customRender(ui, options)
 * ----------------------------------------------------
 *  ‑ options.route            → ruta inicial (string)
 *  ‑ options.initialEntries   → array de rutas si necesitas varias
 *  + any other RTL options
 */
export function customRender(
    ui,
    { route = '/', initialEntries, ...renderOptions } = {}
) {
    const Wrapper = ({ children }) => (
        <Provider store={store}>
            <MemoryRouter initialEntries={initialEntries ?? [route]}>
                {children}
            </MemoryRouter>
        </Provider>
    );

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}
