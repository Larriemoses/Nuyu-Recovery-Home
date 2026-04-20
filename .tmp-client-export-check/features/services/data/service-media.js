const fallbackMedia = {
    imageUrl: "https://images.pexels.com/photos/31234759/pexels-photo-31234759.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "A therapist providing a calm wellness massage in a softly lit treatment space.",
    sourceUrl: "https://www.pexels.com/photo/relaxing-spa-massage-therapy-at-wellness-center-31234759/",
    eyebrow: "Wellness support",
};
export const serviceMediaBySlug = {
    "lymphatic-drainage-massage": {
        imageUrl: "https://images.pexels.com/photos/6187296/pexels-photo-6187296.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "A client receiving a gentle facial massage in a calm treatment room.",
        sourceUrl: "https://www.pexels.com/photo/a-woman-having-a-massage-6187296/",
        eyebrow: "Post-op comfort",
    },
    "advanced-body-sculpting": {
        imageUrl: "https://images.pexels.com/photos/27659253/pexels-photo-27659253.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "A body sculpting treatment in progress with a specialist using contouring equipment.",
        sourceUrl: "https://www.pexels.com/photo/a-woman-getting-a-massage-on-her-butt-27659253/",
        eyebrow: "Contour support",
    },
    "laser-hair-removal": {
        imageUrl: "https://images.pexels.com/photos/16032298/pexels-photo-16032298.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "A laser hair removal device being used on skin in a bright clinic setting.",
        sourceUrl: "https://www.pexels.com/photo/device-for-laser-hair-removal-16032298/",
        eyebrow: "Precision care",
    },
    "recovery-home-stay": {
        imageUrl: "https://images.pexels.com/photos/15303766/pexels-photo-15303766.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "A calm, minimalist private room with a neatly made bed and warm light.",
        sourceUrl: "https://www.pexels.com/photo/bed-in-a-hotel-room-15303766/",
        eyebrow: "Private stay",
    },
};
export const homeShowcaseMedia = {
    imageUrl: "https://images.pexels.com/photos/31234759/pexels-photo-31234759.jpeg?auto=compress&cs=tinysrgb&w=1400",
    alt: "A calming therapeutic massage session in a bright wellness setting.",
    sourceUrl: "https://www.pexels.com/photo/relaxing-spa-massage-therapy-at-wellness-center-31234759/",
    eyebrow: "Supportive recovery care",
};
export function getServiceMedia(serviceSlug) {
    if (!serviceSlug) {
        return fallbackMedia;
    }
    return serviceMediaBySlug[serviceSlug] ?? fallbackMedia;
}
