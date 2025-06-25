import { render, screen } from '../test-utils';
import App from '../App';

test('la aplicación se renderiza sin estallar', () => {
    render(<App />, { withRouter: false });
    expect(screen.getByRole('banner')).toBeInTheDocument();
});
