// test‑utils.js
import { render as rtlRender } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from './store'
import { MemoryRouter } from 'react-router'

export function render(ui, options) {
    return rtlRender(
        <Provider store={store}>
            <MemoryRouter>{ui}</MemoryRouter>
        </Provider>,
        options
    )
}
