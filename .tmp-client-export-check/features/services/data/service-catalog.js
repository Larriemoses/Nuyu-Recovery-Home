export const serviceCatalog = [
    {
        slug: "lymphatic-drainage-massage",
        name: "Lymphatic Drainage Massage",
        summary: "Post-op recovery massage session focused on swelling reduction and healing support.",
        bookingKind: "appointment",
        basePriceKobo: 450000,
        durationMinutes: 60,
    },
    {
        slug: "advanced-body-sculpting",
        name: "Advanced Body Sculpting",
        summary: "A sculpting treatment available as single sessions or multi-session packages.",
        bookingKind: "package",
        basePriceKobo: 850000,
        durationMinutes: 75,
        sessionsCount: 5,
        packages: [
            {
                label: "5 Sessions",
                sessionsCount: 5,
                packagePriceKobo: 3800000,
            },
            {
                label: "10 Sessions",
                sessionsCount: 10,
                packagePriceKobo: 7200000,
            },
            {
                label: "15 Sessions",
                sessionsCount: 15,
                packagePriceKobo: 10200000,
            },
        ],
    },
    {
        slug: "laser-hair-removal",
        name: "Laser Hair Removal",
        summary: "Precision laser treatment for long-term hair reduction.",
        bookingKind: "appointment",
        basePriceKobo: 600000,
        durationMinutes: 45,
    },
    {
        slug: "recovery-home-stay",
        name: "Recovery Home Stay",
        summary: "Structured post-op accommodation with wellness-focused care for 5 to 21 days.",
        bookingKind: "stay",
        basePriceKobo: 12500000,
        minStayDays: 5,
        maxStayDays: 21,
    },
];
