const getFullscreenElement = (documentRef) => {
    return documentRef.fullscreenElement || documentRef.webkitFullscreenElement || null;
};

const requestElementFullscreen = async (element) => {
    if (typeof element.requestFullscreen === 'function') {
        return element.requestFullscreen();
    }

    if (typeof element.webkitRequestFullscreen === 'function') {
        return element.webkitRequestFullscreen();
    }

    throw new Error('Fullscreen API unavailable');
};

const moveIntoView = (practiceSection, behavior) => {
    practiceSection.scrollIntoView({ behavior, block: 'start' });

    if (typeof practiceSection.focus === 'function') {
        practiceSection.focus({ preventScroll: true });
    }
};

export const createPracticeEntryController = ({
    documentRef = document,
    practiceSection
}) => {
    if (!practiceSection) {
        throw new Error('practiceSection is required');
    }

    return {
        focusTarget() {
            moveIntoView(practiceSection, 'smooth');
            return { mode: 'scroll-only' };
        },
        async enter() {
            if (getFullscreenElement(documentRef)) {
                moveIntoView(practiceSection, 'smooth');
                return { mode: 'scroll-only' };
            }

            try {
                await requestElementFullscreen(practiceSection);
                moveIntoView(practiceSection, 'auto');
                return { mode: 'fullscreen' };
            } catch (error) {
                moveIntoView(practiceSection, 'smooth');
                return { mode: 'scroll-fallback', error };
            }
        }
    };
};
