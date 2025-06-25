import { render } from '../test-utils';
import Header from '../components/Header/Header';
import { axe } from 'jest-axe';

test('Header cumple WCAG AA', async () => {
    const { container } = render(<Header />);
    expect(await axe(container)).toHaveNoViolations();
});
