// backend/tests/unit/services/presentationUtils.spec.js
const { extractPresentationDefinition } =
    require('../../../src/utils/presentationUtils');

describe('extractPresentationDefinition', () => {
    it('extrae desde un openid4vp:// URL', () => {
        const obj = { foo: 'bar' };
        const encoded = encodeURIComponent(JSON.stringify(obj));
        const url = `openid4vp://auth?presentation_definition=${encoded}`;

        expect(extractPresentationDefinition(url)).toEqual(obj);
    });

    it('extrae desde objeto { presentation_definition }', () => {
        const presDef = { name: 'test' };
        expect(extractPresentationDefinition({ presentation_definition: presDef }))
            .toEqual(presDef);
    });

    it('lanza error si no encuentra definición', () => {
        expect(() => extractPresentationDefinition('openid4vp://?')).toThrow();
    });
});
