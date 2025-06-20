import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

test('Header muestra logo y enlaces principales', () => {
    const { getByText } = render(
        <MemoryRouter>
            <Header />
        </MemoryRouter>
    );
    expect(getByText('Inicio')).toBeInTheDocument();
});
