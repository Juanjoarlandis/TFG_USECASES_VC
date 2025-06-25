import { render } from '../test-utils';
import { axe } from 'jest-axe';
import Home from '../pages/Home/Home';
import VerificationMethodSelect from '../pages/VerificationMethodSelect/VerificationMethodSelect';

describe('Páginas públicas sin violaciones de accesibilidad', () => {
    it.each([Home, VerificationMethodSelect])('%p', async (Comp) => {
        const { container } = render(<Comp />);
        expect(await axe(container)).toHaveNoViolations();
    });
});
