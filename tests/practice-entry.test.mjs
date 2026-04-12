import assert from 'node:assert/strict';

const { createPracticeEntryController } = await import('../js/practice-entry.mjs');

const createSection = () => {
    const calls = [];
    return {
        calls,
        async requestFullscreen() {
            calls.push('requestFullscreen');
        },
        scrollIntoView(options) {
            calls.push({ type: 'scrollIntoView', options });
        },
        focus(options) {
            calls.push({ type: 'focus', options });
        }
    };
};

const createDocumentStub = (fullscreenElement = null) => ({
    fullscreenElement
});

{
    const section = createSection();
    const documentStub = createDocumentStub(null);
    const controller = createPracticeEntryController({
        documentRef: documentStub,
        practiceSection: section
    });

    await controller.enter();

    assert.equal(section.calls[0], 'requestFullscreen');
    assert.deepEqual(section.calls[1], {
        type: 'scrollIntoView',
        options: { behavior: 'auto', block: 'start' }
    });
    assert.deepEqual(section.calls[2], {
        type: 'focus',
        options: { preventScroll: true }
    });
}

{
    const section = createSection();
    section.requestFullscreen = async () => {
        section.calls.push('requestFullscreen');
        throw new Error('blocked');
    };
    const documentStub = createDocumentStub(null);
    const controller = createPracticeEntryController({
        documentRef: documentStub,
        practiceSection: section
    });

    await controller.enter();

    assert.equal(section.calls[0], 'requestFullscreen');
    assert.deepEqual(section.calls[1], {
        type: 'scrollIntoView',
        options: { behavior: 'smooth', block: 'start' }
    });
    assert.deepEqual(section.calls[2], {
        type: 'focus',
        options: { preventScroll: true }
    });
}

{
    const section = createSection();
    const documentStub = createDocumentStub(section);
    const controller = createPracticeEntryController({
        documentRef: documentStub,
        practiceSection: section
    });

    await controller.enter();

    assert.deepEqual(section.calls[0], {
        type: 'scrollIntoView',
        options: { behavior: 'smooth', block: 'start' }
    });
    assert.deepEqual(section.calls[1], {
        type: 'focus',
        options: { preventScroll: true }
    });
}

console.log('practice-entry tests passed');
